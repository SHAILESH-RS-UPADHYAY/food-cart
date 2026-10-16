import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { LIVE } from './rules';
import {
  ApiError, type ApiErrorCode, type AuthTarget, type Backend, type Deal, type Order, type StallLive, type User,
} from './types';

// Live backend. Business rules run in Postgres (supabase/migrations); this file only maps rows.

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => (s === 'active' ? sb.auth.startAutoRefresh() : sb.auth.stopAutoRefresh()));
}

const CODES: ApiErrorCode[] = ['STALL_AT_CAPACITY', 'STALL_CLOSED', 'ITEM_UNAVAILABLE', 'TOO_MANY_ACTIVE', 'DEAL_GONE', 'BAD_TRANSITION', 'NOT_ALLOWED'];

function fail(error: { message: string } | null): asserts error is null {
  if (!error) return;
  const code = CODES.find((c) => error.message.includes(c));
  throw new ApiError(code ?? 'NETWORK', error.message);
}

type OrderRow = {
  id: string; stall_id: string; user_id: string; customer_name: string | null; token_no: number; pickup_code: string;
  status: Order['status']; payment: Order['payment']; total: number; note: string | null; eta_min: number;
  created_at: string; accepted_at: string | null; ready_at: string | null; collected_at: string | null;
  order_items: { item_id: string; name: string; qty: number; price: number }[];
};

const ms = (t: string | null) => (t ? Date.parse(t) : undefined);

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  stallId: r.stall_id,
  userId: r.user_id,
  customerName: r.customer_name ?? 'Student',
  tokenNo: r.token_no,
  pickupCode: r.pickup_code,
  status: r.status,
  payment: r.payment,
  total: r.total,
  note: r.note ?? undefined,
  etaMin: r.eta_min,
  lines: r.order_items.map((i) => ({ itemId: i.item_id, name: i.name, qty: i.qty, price: i.price })),
  createdAt: Date.parse(r.created_at),
  acceptedAt: ms(r.accepted_at),
  readyAt: ms(r.ready_at),
  collectedAt: ms(r.collected_at),
});

const ORDER_SELECT = '*, order_items(item_id, name, qty, price)';

async function loadUser(): Promise<User | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const [{ data: p }, { data: staff }] = await Promise.all([
    sb.from('profiles').select('id, name, phone, email, role').eq('id', auth.user.id).single(),
    sb.from('stall_staff').select('stall_id').eq('user_id', auth.user.id).limit(1),
  ]);
  return {
    id: auth.user.id,
    name: p?.name ?? '',
    phone: p?.phone ?? auth.user.phone ?? undefined,
    email: p?.email ?? auth.user.email ?? undefined,
    role: p?.role ?? 'student',
    stallId: staff?.[0]?.stall_id,
  };
}

/** Channel topics must be unique per subscription (effects can re-run in dev). */
const topic = (name: string) => `${name}:${Math.random().toString(36).slice(2, 8)}`;

const phoneOf = (t: AuthTarget) => (t.kind === 'phone' ? `+91${t.phone}` : '');

/** Refetch-on-change: realtime payloads lack order_items, and lists here are small. */
function watchOrders(name: string, filter: string, query: () => PromiseLike<{ data: OrderRow[] | null }>, cb: (o: Order[]) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const { data } = await query();
      cb((data ?? []).map(toOrder));
    }, 120);
  };
  refresh();
  const ch = sb
    .channel(topic(name))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter }, refresh)
    .subscribe();
  return () => {
    clearTimeout(timer);
    sb.removeChannel(ch);
  };
}

export const live: Backend = {
  mode: 'live',

  restore: async () => ((await sb.auth.getSession()).data.session ? loadUser() : null),

  async sendCode(t) {
    const { error } = t.kind === 'phone'
      ? await sb.auth.signInWithOtp({ phone: phoneOf(t) })
      : await sb.auth.signInWithOtp({ email: t.email, options: { shouldCreateUser: true } });
    fail(error);
  },

  async verifyCode(t, token) {
    const { error } = t.kind === 'phone'
      ? await sb.auth.verifyOtp({ phone: phoneOf(t), token, type: 'sms' })
      : await sb.auth.verifyOtp({ email: t.email, token, type: 'email' });
    if (error) throw new ApiError('BAD_CODE', error.message);
    const user = await loadUser();
    if (!user) throw new ApiError('NETWORK');
    return user;
  },

  async staffSignIn(credentials) {
    if (!('email' in credentials)) throw new ApiError('NOT_ALLOWED', 'Use your staff email and password.');
    const { error } = await sb.auth.signInWithPassword(credentials);
    if (error) throw new ApiError('BAD_CODE', error.message);
    const user = await loadUser();
    if (!user || user.role === 'student') {
      await sb.auth.signOut();
      throw new ApiError('NOT_ALLOWED', 'This account is not linked to a stall yet.');
    }
    return user;
  },

  async setName(name) {
    const { data: auth } = await sb.auth.getUser();
    const { error } = await sb.from('profiles').update({ name: name.trim() }).eq('id', auth.user?.id ?? '');
    fail(error);
    const user = await loadUser();
    if (!user) throw new ApiError('NOT_ALLOWED');
    return user;
  },

  async signOut() {
    await sb.auth.signOut();
  },

  subscribeStalls(cb) {
    const state: Record<string, StallLive> = {};
    const put = (r: { id: string; status: StallLive['status']; max_active_orders: number; active_orders: number }) => {
      state[r.id] = { id: r.id, status: r.status, maxActive: r.max_active_orders, active: r.active_orders };
    };
    sb.from('stalls').select('id, status, max_active_orders, active_orders').then(({ data }) => {
      data?.forEach(put);
      cb({ ...state });
    });
    const ch = sb
      .channel(topic('stalls'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stalls' }, (p) => {
        put(p.new as Parameters<typeof put>[0]);
        cb({ ...state });
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  },

  subscribeUnavailable(cb) {
    const refresh = () =>
      sb.from('menu_items').select('id').eq('available', false).then(({ data }) => cb(new Set((data ?? []).map((r) => r.id))));
    refresh();
    const ch = sb.channel(topic('menu')).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, refresh).subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  },

  subscribeDeals(cb) {
    const refresh = () =>
      sb.from('deals').select('item_id, stall_id, price, left_qty, ends_at').then(({ data }) =>
        cb(Object.fromEntries((data ?? []).map((r): [string, Deal] => [r.item_id, { itemId: r.item_id, stallId: r.stall_id, price: r.price, left: r.left_qty, endsAt: Date.parse(r.ends_at) }]))));
    refresh();
    const ch = sb.channel(topic('deals')).on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, refresh).subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  },

  subscribeMyOrders(cb) {
    let off = () => {};
    let cancelled = false;
    sb.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (!id || cancelled) return cb([]);
      off = watchOrders(`orders:${id}`, `user_id=eq.${id}`,
        () => sb.from('orders').select(ORDER_SELECT).eq('user_id', id).order('created_at', { ascending: false }).limit(30), cb);
    });
    return () => {
      cancelled = true;
      off();
    };
  },

  subscribeStallOrders(stallId, cb) {
    const since = new Date(Date.now() - 16 * 3600 * 1000).toISOString();
    return watchOrders(`stall:${stallId}`, `stall_id=eq.${stallId}`,
      () => sb.from('orders').select(ORDER_SELECT).eq('stall_id', stallId)
        .or(`status.in.(${LIVE.join(',')}),created_at.gte.${since}`).order('created_at').limit(200), cb);
  },

  async placeOrder({ stallId, lines, note, payment }) {
    const { data, error } = await sb.rpc('place_order', {
      p_stall: stallId,
      p_lines: lines.map((l) => ({ item_id: l.itemId, qty: l.qty })),
      p_note: note ?? null,
      p_payment: payment,
    });
    fail(error);
    const { data: row, error: e2 } = await sb.from('orders').select(ORDER_SELECT).eq('id', (data as { id: string }).id).single();
    fail(e2);
    return toOrder(row as OrderRow);
  },

  async setOrderStatus(orderId, status) {
    const { error } = await sb.rpc('set_order_status', { p_order: orderId, p_status: status });
    fail(error);
  },

  async updateStall(stallId, patch) {
    const { error } = await sb.rpc('update_stall', { p_stall: stallId, p_status: patch.status ?? null, p_max: patch.maxActive ?? null });
    fail(error);
  },

  async setItemAvailable(itemId, available) {
    const { error } = await sb.rpc('set_item_available', { p_item: itemId, p_available: available });
    fail(error);
  },

  async setDeal(itemId, { price, left, minutes }) {
    const { error } = await sb.rpc('set_deal', { p_item: itemId, p_price: price, p_left: left, p_minutes: minutes });
    fail(error);
  },

  async clearDeal(itemId) {
    const { error } = await sb.rpc('clear_deal', { p_item: itemId });
    fail(error);
  },

  async deleteAccount() {
    const { error } = await sb.rpc('delete_my_account');
    fail(error);
    await sb.auth.signOut();
  },
};
