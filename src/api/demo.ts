import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { STALLS, applyMenu, isBaseItem, itemById, itemsOf, stallById, type MenuPatch } from '@/data/catalog';
import { useSettings } from '@/store/settings';

import { KITCHEN, MAX_ACTIVE_PER_USER, MAX_QTY, canTransition, etaMinutes, lineTotal, liveDeal } from './rules';
import {
  ApiError, type AuthTarget, type Backend, type Deal, type Order, type OrderStatus, type PlaceOrderInput,
  type StallLive, type StallStatus, type User,
} from './types';

/**
 * Demo backend: the whole "server" lives on the device. It simulates a busy campus so the
 * client demo works with no network or credentials:
 * - crowd: other students' orders, a pure function of time (identical across tabs/devices)
 * - autopilot: your orders get accepted, cooked and readied in about 30 s
 * - staff board: realistic incoming orders while a stall console is open
 * - web tabs stay in sync through BroadcastChannel (student tab + console tab side by side)
 */

type DB = {
  users: Record<string, User>;
  /** native only; on web each tab keeps its own session (student tab + console tab side by side) */
  session: string | null;
  stalls: Record<string, { status: StallStatus; maxActive: number }>;
  unavailable: string[];
  deals: Record<string, Omit<Deal, 'itemId' | 'stallId'>>;
  menu: MenuPatch;
  /** stallId -> last heartbeat of an open staff console in any tab: autopilot leaves those stalls to humans */
  consoles: Record<string, number>;
  orders: Order[];
  seq: Record<string, number>;
  seeded: string[];
  /** last-change times, so two tabs editing at once merge instead of overwriting each other */
  rev: Record<string, number>;
  /** bumped by a demo reset: a newer epoch replaces, an older one is ignored */
  epoch: number;
};

const KEY = 'fc-demo-db-v1';

/** Leftover / surplus offers the stalls start the day with: [item, price, left, minutes to go]. */
const DEAL_SEED: [string, number, number, number][] = [
  ['bnc-cheesecake', 89, 3, 150], ['hr-brownie', 39, 5, 95], ['cc-waffle', 89, 2, 120], ['fr-thali', 69, 6, 80],
  ['cf-steam-momos', 49, 4, 110], ['lp-cheese', 149, 2, 200], ['tj-mango', 59, 3, 140],
];
const seedDeals = () =>
  Object.fromEntries(DEAL_SEED.map(([id, price, left, mins]) => [id, { price, left, endsAt: Date.now() + mins * 60000 }]));
export const DEMO_CODE = '123456';

/**
 * Team logins: one per stall, plus HQ. Same shape as live Supabase staff accounts, so the demo
 * shows real separation (docs/DEMO_LOGINS.md).
 */
export const DEMO_TEAM: { email: string; password: string; stallId?: string }[] = [
  { email: 'hrcafe@foodcart.test', password: 'HRcafe#4821', stallId: 'hr-cafe' },
  { email: 'creativefood@foodcart.test', password: 'Creative#7316', stallId: 'creative-food' },
  { email: 'booksncooks@foodcart.test', password: 'Books#5194', stallId: 'books-n-cooks' },
  { email: 'tj@foodcart.test', password: 'TJstall#2648', stallId: 'tj' },
  { email: 'lapinoz@foodcart.test', password: 'Lapinoz#9073', stallId: 'lapinoz' },
  { email: 'cornercafe@foodcart.test', password: 'Corner#3517', stallId: 'corner-cafe' },
  { email: 'foodrepublic@foodcart.test', password: 'Republic#6402', stallId: 'food-republic' },
  { email: 'hq@foodcart.test', password: 'FoodCartHQ#2026' },
];

const teamUser = (a: (typeof DEMO_TEAM)[number]): User =>
  a.stallId
    ? { id: `staff-${a.stallId}`, name: `${stallById[a.stallId].name} team`, role: 'staff', stallId: a.stallId, email: a.email }
    : { id: 'demo-admin', name: 'Food Cart HQ', role: 'admin', email: a.email };

/** Wrong passwords per email: the fifth miss locks that login for 30 s. */
const misses: Record<string, { n: number; until: number }> = {};

const fresh = (): DB => ({
  users: {},
  session: null,
  stalls: Object.fromEntries(STALLS.map((s) => [s.id, { status: 'open' as StallStatus, maxActive: s.maxActive }])),
  unavailable: ['hr-hazelnut', 'lp-garden'],
  deals: seedDeals(),
  menu: { prices: {}, added: [] },
  consoles: {},
  orders: [],
  seq: {},
  seeded: [],
  rev: {},
  epoch: 0,
});

let db: DB = fresh();
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();
const channel: BroadcastChannel | null =
  Platform.OS === 'web' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fc-demo') : null;

const web = Platform.OS === 'web' && typeof window !== 'undefined';
const TAB_KEY = 'fc-demo-tab-session';
const LAST_KEY = 'fc-demo-last-session';
let session: string | null = null;

function setSession(id: string | null) {
  session = id;
  db.session = id;
  if (!web) return;
  try {
    if (id) window.sessionStorage.setItem(TAB_KEY, id);
    else window.sessionStorage.removeItem(TAB_KEY);
    window.localStorage.setItem(LAST_KEY, id ?? '');
  } catch {}
}

const touch = (key: string) => {
  db.rev[key] = Date.now();
};

function merge(inc: DB) {
  if (inc.epoch !== db.epoch) {
    if (inc.epoch > db.epoch) db = { ...inc, session };
    return;
  }
  db.users = { ...db.users, ...inc.users };
  const byId = new Map(db.orders.map((o) => [o.id, o]));
  for (const o of inc.orders) {
    if (!byId.has(o.id) || (inc.rev[o.id] ?? 0) > (db.rev[o.id] ?? 0)) {
      byId.set(o.id, o);
      db.rev[o.id] = inc.rev[o.id] ?? 0;
    }
  }
  db.orders = [...byId.values()];
  for (const k of ['stalls', 'unavailable', 'deals', 'menu'] as const) {
    if ((inc.rev[k] ?? 0) > (db.rev[k] ?? 0)) {
      (db as Record<string, unknown>)[k] = inc[k];
      db.rev[k] = inc.rev[k];
    }
  }
  for (const [k, v] of Object.entries(inc.seq)) db.seq[k] = Math.max(db.seq[k] ?? 0, v);
  for (const [k, v] of Object.entries(inc.consoles ?? {})) db.consoles[k] = Math.max(db.consoles[k] ?? 0, v);
  db.seeded = [...new Set([...db.seeded, ...inc.seeded])];
}

channel?.addEventListener('message', (e: MessageEvent<DB>) => {
  merge(e.data);
  applyMenu(db.menu);
  listeners.forEach((l) => l());
});

function load() {
  loaded ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (raw) db = { ...fresh(), ...JSON.parse(raw) };
    })
    .catch(() => {})
    .then(() => {
      applyMenu(db.menu);
      let s = db.session;
      if (web) {
        try {
          s = window.sessionStorage.getItem(TAB_KEY) ?? (window.localStorage.getItem(LAST_KEY) || null);
        } catch {}
      }
      session = s && db.users[s] ? s : null;
    });
  return loaded;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function commit() {
  listeners.forEach((l) => l());
  channel?.postMessage(db);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(db)).catch(() => {}), 250);
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const me = () => (session ? db.users[session] ?? null : null);

/** Same rule as SQL is_staff_of(): HQ, or staff of exactly this stall. */
const runs = (stallId?: string) => {
  const u = me();
  return !!u && !!stallId && (u.role === 'admin' || (u.role === 'staff' && u.stallId === stallId));
};
const mustRun = (stallId?: string) => {
  if (!runs(stallId)) throw new ApiError('NOT_ALLOWED', 'That belongs to another stall. You can only change your own.');
};
const isHq = () => me()?.role === 'admin';
const LIVE_CONSOLE_MS = 12000;

// ---------- live stall state ----------

const phase = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);

/** Other students' kitchen load: gentle waves around the stall's demo baseline. */
function crowd(stallId: string, maxActive: number, now = Date.now()): number {
  const s = stallById[stallId];
  if (s.demoActive >= s.maxActive) return s.demoActive; // the 'kitchen full' stall stays full until staff act
  const p = phase(stallId);
  const wobble = 4 * Math.sin(now / 37000 + p) + 2 * Math.sin(now / 11000 + p * 1.7);
  return Math.max(0, Math.min(maxActive - 1, Math.round(s.demoActive + wobble)));
}

function kitchenCount(stallId: string) {
  return db.orders.filter((o) => o.stallId === stallId && KITCHEN.includes(o.status)).length;
}

function liveStalls(): Record<string, StallLive> {
  const now = Date.now();
  return Object.fromEntries(
    STALLS.map((s) => {
      const st = db.stalls[s.id];
      const active = Math.min(st.maxActive, crowd(s.id, st.maxActive, now) + kitchenCount(s.id));
      return [s.id, { id: s.id, status: st.status, maxActive: st.maxActive, active }];
    }),
  );
}

// ---------- orders ----------

const NAMES = ['Aarav S.', 'Simran K.', 'Harleen B.', 'Kabir M.', 'Ishita R.', 'Manav G.', 'Rhea T.', 'Arjun P.',
  'Jasleen D.', 'Tanvi A.', 'Rohan V.', 'Mehak J.', 'Yuvraj C.', 'Navya L.', 'Kunal N.', 'Sanya H.'];

function nextToken(stallId: string) {
  db.seq[stallId] = (db.seq[stallId] ?? 40) + 1;
  return db.seq[stallId];
}

function makeOrder(stallId: string, userId: string, customerName: string, lines: { itemId: string; qty: number; price?: number }[],
  payment: Order['payment'], note?: string, createdAt = Date.now()): Order {
  const full = lines.map(({ itemId, qty, price }) => ({ itemId, qty, name: itemById[itemId].name, price: price ?? itemById[itemId].price }));
  return {
    id: uid(),
    stallId,
    userId,
    customerName,
    tokenNo: nextToken(stallId),
    pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
    status: 'placed',
    payment,
    total: lineTotal(full),
    note: note?.trim() || undefined,
    lines: full,
    etaMin: etaMinutes(stallById[stallId].avgPrepMin, liveStalls()[stallId]),
    createdAt,
  };
}

function addOrder(o: Order) {
  db.orders.push(o);
  touch(o.id);
}

function setStatus(o: Order, status: OrderStatus, at = Date.now()) {
  o.status = status;
  touch(o.id);
  if (status === 'accepted') o.acceptedAt = at;
  if (status === 'ready') o.readyAt = at;
  if (status === 'collected') o.collectedAt = at;
}

function randomLines(stallId: string) {
  const pool = itemsOf(stallId).filter((i) => !db.unavailable.includes(i.id));
  const n = 1 + Math.floor(Math.random() * 3);
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  return picked.map((i) => ({ itemId: i.id, qty: Math.random() < 0.25 ? 2 : 1 }));
}

function seedBoard(stallId: string) {
  if (db.seeded.includes(stallId)) return;
  db.seeded.push(stallId);
  const now = Date.now();
  // walk-up orders only: the New column stays for real online orders
  const plan: [OrderStatus, number][] = [['ready', 9], ['preparing', 6], ['preparing', 3]];
  for (const [status, minsAgo] of plan) {
    const o = makeOrder(stallId, 'guest', NAMES[Math.floor(Math.random() * NAMES.length)], randomLines(stallId),
      Math.random() < 0.4 ? 'online_demo' : 'cod', undefined, now - minsAgo * 60000);
    if (status !== 'placed') setStatus(o, 'accepted', o.createdAt + 40000);
    if (status === 'preparing' || status === 'ready') setStatus(o, 'preparing', o.createdAt + 60000);
    if (status === 'ready') setStatus(o, 'ready', now - 90000);
    addOrder(o);
  }
}

// ---------- timers: autopilot for my orders, walk-ins for open consoles ----------

const ACCEPT_AFTER = 4000;
const PREP_AFTER = 7000;
const READY_AFTER = 26000;

let ticking: ReturnType<typeof setInterval> | null = null;
const boards = new Map<string, number>(); // stallId -> next walk-in timestamp

function tick() {
  const now = Date.now();
  let changed = false;
  const self = me();
  if (self && useSettings.getState().autopilot) {
    for (const o of db.orders) {
      if (o.userId !== self.id || now - (db.consoles[o.stallId] ?? 0) < LIVE_CONSOLE_MS) continue;
      if (o.status === 'placed' && now - o.createdAt > ACCEPT_AFTER) { setStatus(o, 'accepted'); changed = true; }
      else if (o.status === 'accepted' && now - o.createdAt > PREP_AFTER) { setStatus(o, 'preparing'); changed = true; }
      else if (o.status === 'preparing' && now - o.createdAt > READY_AFTER) { setStatus(o, 'ready'); changed = true; }
    }
  }
  // walk-up orders are handled by the counter team on their own
  for (const o of db.orders) {
    if (o.userId !== 'guest' || now - (db.rev[o.id] ?? 0) < 50000) continue;
    if (o.status === 'placed' || o.status === 'accepted') { setStatus(o, 'accepted'); setStatus(o, 'preparing'); changed = true; }
    else if (o.status === 'preparing') { setStatus(o, 'ready'); changed = true; }
    else if (o.status === 'ready') { setStatus(o, 'collected'); changed = true; }
  }
  for (const [stallId, due] of boards) {
    if (now - (db.consoles[stallId] ?? 0) > 4000) {
      db.consoles = { ...db.consoles, [stallId]: now };
      changed = true;
    }
    if (now < due) continue;
    boards.set(stallId, now + 28000 + Math.random() * 22000);
    const live = liveStalls()[stallId];
    if (live.status === 'open' && live.active < live.maxActive) {
      const o = makeOrder(stallId, 'guest', NAMES[Math.floor(Math.random() * NAMES.length)], randomLines(stallId),
        Math.random() < 0.4 ? 'online_demo' : 'cod');
      setStatus(o, 'accepted');
      setStatus(o, 'preparing');
      addOrder(o);
      changed = true;
    }
  }
  // keep the store small: drop finished orders older than 2 days
  const before = db.orders.length;
  db.orders = db.orders.filter((o) => KITCHEN.includes(o.status) || o.status === 'ready' || now - o.createdAt < 172800000);
  if (changed || db.orders.length !== before) commit();
}

function ensureTicking() {
  ticking ??= setInterval(tick, 1000);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  ensureTicking();
  load().then(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---------- backend ----------

export const demo: Backend = {
  mode: 'demo',

  async restore() {
    await load();
    ensureTicking();
    return me();
  },

  async sendCode() {
    await wait(700);
  },

  async verifyCode(target: AuthTarget, code: string) {
    await load();
    await wait(500);
    if (code !== DEMO_CODE) throw new ApiError('BAD_CODE');
    const key = target.kind === 'phone' ? target.phone : target.email.toLowerCase();
    let user = Object.values(db.users).find((u) => u.role === 'student' && (u.phone === key || u.email === key));
    if (!user) {
      user = { id: uid(), name: '', role: 'student', ...(target.kind === 'phone' ? { phone: key } : { email: key }) };
      db.users[user.id] = user;
    }
    setSession(user.id);
    commit();
    return user;
  },

  async staffSignIn({ email, password }) {
    await load();
    await wait(450);
    const key = email.trim().toLowerCase();
    const lock = misses[key];
    if (lock && lock.until > Date.now()) {
      throw new ApiError('NOT_ALLOWED', `Too many wrong tries. Try again in ${Math.ceil((lock.until - Date.now()) / 1000)} s.`);
    }
    const account = DEMO_TEAM.find((a) => a.email === key && a.password === password);
    if (!account) {
      const n = (lock?.n ?? 0) + 1;
      misses[key] = n >= 5 ? { n: 0, until: Date.now() + 30000 } : { n, until: 0 };
      // never say which half was wrong
      throw new ApiError('NOT_ALLOWED', n >= 5 ? 'Too many wrong tries. This login is locked for 30 s.' : `Email or password is wrong. ${5 - n} ${5 - n === 1 ? 'try' : 'tries'} left.`);
    }
    delete misses[key];
    const user = teamUser(account);
    db.users[user.id] = user;
    setSession(user.id);
    commit();
    return user;
  },

  async setName(name: string) {
    const user = me();
    if (!user) throw new ApiError('NOT_ALLOWED');
    user.name = name.trim();
    commit();
    return { ...user };
  },

  async signOut() {
    setSession(null);
    commit();
  },

  subscribeStalls(cb) {
    const emit = () => cb(liveStalls());
    const off = subscribe(emit);
    const wave = setInterval(emit, 3000); // crowd moves even when nobody orders
    return () => {
      off();
      clearInterval(wave);
    };
  },

  subscribeUnavailable(cb) {
    return subscribe(() => cb(new Set(db.unavailable)));
  },

  subscribeMenu(cb) {
    return subscribe(() => cb(db.menu));
  },

  subscribeDeals(cb) {
    return subscribe(() =>
      cb(Object.fromEntries(Object.entries(db.deals).map(([itemId, d]) => [itemId, { ...d, itemId, stallId: itemById[itemId].stallId }]))));
  },

  subscribeMyOrders(cb) {
    return subscribe(() => {
      const self = me();
      cb(self ? db.orders.filter((o) => o.userId === self.id).sort((a, b) => b.createdAt - a.createdAt).map((o) => ({ ...o })) : []);
    });
  },

  subscribeAllOrders(cb) {
    return subscribe(() => cb(isHq() ? db.orders.map((o) => ({ ...o })).sort((a, b) => b.createdAt - a.createdAt) : []));
  },

  async listUsers() {
    await load();
    if (!isHq()) throw new ApiError('NOT_ALLOWED');
    const team = Object.fromEntries(DEMO_TEAM.map((a) => [teamUser(a).id, teamUser(a)]));
    return Object.values({ ...team, ...db.users }).map((u) => ({ ...u }));
  },

  subscribeStallOrders(stallId, cb) {
    load().then(() => {
      if (!runs(stallId)) return;
      seedBoard(stallId);
      commit();
    });
    boards.set(stallId, Date.now() + 15000);
    // a stall's board is visible to that stall's team and HQ only
    const off = subscribe(() => cb(runs(stallId) ? db.orders.filter((o) => o.stallId === stallId).map((o) => ({ ...o })) : []));
    return () => {
      off();
      boards.delete(stallId);
    };
  },

  async placeOrder(input: PlaceOrderInput) {
    await load();
    await wait(450);
    const self = me();
    if (!self) throw new ApiError('NOT_ALLOWED');
    const live = liveStalls()[input.stallId];
    if (live.status !== 'open') throw new ApiError('STALL_CLOSED');
    if (live.active >= live.maxActive) throw new ApiError('STALL_AT_CAPACITY');
    const mine = db.orders.filter((o) => o.userId === self.id && KITCHEN.includes(o.status)).length;
    if (mine >= MAX_ACTIVE_PER_USER) throw new ApiError('TOO_MANY_ACTIVE');
    const lines = input.lines.filter((l) => l.qty > 0);
    const bad = lines.some((l) => {
      const item = itemById[l.itemId];
      return !item || item.stallId !== input.stallId || db.unavailable.includes(l.itemId) || l.qty > MAX_QTY;
    });
    if (!lines.length || bad) throw new ApiError('ITEM_UNAVAILABLE');
    // Leftover deals: priced here, never by the client, and stock is taken in the same step.
    const priced = lines.map((l) => {
      const d = db.deals[l.itemId];
      const deal = d && liveDeal({ ...d, itemId: l.itemId, stallId: input.stallId });
      if (deal && deal.left < l.qty) throw new ApiError('DEAL_GONE');
      return { ...l, price: deal ? deal.price : itemById[l.itemId].price };
    });
    for (const l of priced) {
      const d = db.deals[l.itemId];
      if (d && liveDeal({ ...d, itemId: l.itemId, stallId: input.stallId })) db.deals = { ...db.deals, [l.itemId]: { ...d, left: d.left - l.qty } };
    }
    touch('deals');
    const order = makeOrder(input.stallId, self.id, self.name || 'Student', priced, input.payment, input.note);
    addOrder(order);
    commit();
    return { ...order };
  },

  async setOrderStatus(orderId, status) {
    const self = me();
    const o = db.orders.find((x) => x.id === orderId);
    if (!self || !o) throw new ApiError('NOT_ALLOWED');
    const allowed = self.role === 'admin' || (self.role === 'staff' && self.stallId === o.stallId)
      || (self.role === 'student' && o.userId === self.id);
    if (!allowed) throw new ApiError('NOT_ALLOWED');
    if (!canTransition(o.status, status, self.role)) throw new ApiError('BAD_TRANSITION');
    setStatus(o, status);
    commit();
  },

  async updateStall(stallId, patch) {
    mustRun(stallId);
    db.stalls = { ...db.stalls, [stallId]: { ...db.stalls[stallId] } };
    touch('stalls');
    const st = db.stalls[stallId];
    if (patch.status) st.status = patch.status;
    if (patch.maxActive) st.maxActive = Math.max(1, Math.min(1000, Math.round(patch.maxActive)));
    commit();
  },

  async setItemAvailable(itemId, available) {
    mustRun(itemById[itemId]?.stallId);
    db.unavailable = available ? db.unavailable.filter((i) => i !== itemId) : [...new Set([...db.unavailable, itemId])];
    touch('unavailable');
    commit();
  },

  async setDeal(itemId, { price, left, minutes }) {
    const item = itemById[itemId];
    if (!item || price <= 0 || price >= item.price || left < 1) throw new ApiError('NOT_ALLOWED', 'A deal must be cheaper than the menu price.');
    mustRun(item.stallId);
    db.deals = { ...db.deals, [itemId]: { price: Math.round(price), left: Math.round(left), endsAt: Date.now() + minutes * 60000 } };
    touch('deals');
    commit();
  },

  async saveItem({ id, stallId, name, description, category, price, photo }) {
    mustRun(stallId);
    if (id && itemById[id] && itemById[id].stallId !== stallId) mustRun(itemById[id].stallId);
    if (!name.trim() || !(price > 0) || price > 5000) throw new ApiError('NOT_ALLOWED', 'Give the dish a name and a price.');
    if (id && isBaseItem(id)) {
      db.menu = { ...db.menu, prices: { ...db.menu.prices, [id]: Math.round(price) } };
    } else {
      const item = { id: id ?? `${stallId}-${uid()}`, stallId, name: name.trim(), description: description.trim(), category, price: Math.round(price), photo };
      db.menu = { ...db.menu, added: [...db.menu.added.filter((a) => a.id !== item.id), item] };
    }
    touch('menu');
    applyMenu(db.menu);
    commit();
  },

  async clearDeal(itemId) {
    mustRun(itemById[itemId]?.stallId);
    const { [itemId]: _gone, ...rest } = db.deals;
    db.deals = rest;
    touch('deals');
    commit();
  },

  async deleteAccount() {
    const self = me();
    if (!self) return;
    // the stall keeps its sales history, without the person
    for (const o of db.orders) if (o.userId === self.id) o.customerName = 'Deleted user';
    const { [self.id]: _removed, ...users } = db.users;
    db.users = users;
    setSession(null);
    commit();
  },
};

/** For the profile screen: wipe the demo world back to its first-run state. */
export async function resetDemo() {
  db = { ...fresh(), users: db.users, session, epoch: db.epoch + 1 };
  commit();
}
