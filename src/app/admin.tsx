import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, useDeals, useMenuVersion, useStalls, useUnavailable, type Order, type OrderStatus, type User } from '@/api';
import { resetDemo } from '@/api/demo';
import { LIVE, etaMinutes, liveDeal, stallState } from '@/api/rules';
import { ITEMS, STALLS, itemById, stallById, type Item } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { ago, clock, prettyPhone, rupees, token } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { useSession } from '@/store/session';
import { CapacityMeter, Hairline, StatusChip } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { DealSheet } from '@/ui/DealSheet';
import { ItemSheet } from '@/ui/ItemSheet';
import { NoAccess } from '@/ui/NoAccess';
import { Icon, type IconName } from '@/ui/Icon';
import { CartMark } from '@/ui/Logo';
import { enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Pill } from '@/ui/Pill';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { Toggle } from '@/ui/Toggle';
import { C, R } from '@/ui/theme';

type Tab = 'overview' | 'orders' | 'stalls' | 'menu' | 'deals' | 'users' | 'system';
const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'chart-bar-bold' },
  { key: 'orders', label: 'Orders', icon: 'receipt-bold' },
  { key: 'stalls', label: 'Stalls', icon: 'storefront-bold' },
  { key: 'menu', label: 'Menu', icon: 'bowl-food-bold' },
  { key: 'deals', label: 'Last call', icon: 'hourglass-high-bold' },
  { key: 'users', label: 'Users', icon: 'users-three-bold' },
  { key: 'system', label: 'System', icon: 'gear-six-bold' },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'New', accepted: 'Accepted', preparing: 'Cooking', ready: 'Ready', collected: 'Collected', cancelled: 'Cancelled', rejected: 'Rejected',
};
const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  placed: { to: 'accepted', label: 'Accept' },
  accepted: { to: 'ready', label: 'Mark ready' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'collected', label: 'Handed over' },
};

function useAllOrders() {
  const [o, set] = useState<Order[] | null>(null);
  useEffect(() => api.subscribeAllOrders(set), []);
  return o;
}

function Panel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[{ backgroundColor: C.card, borderRadius: R.card, borderWidth: 1, borderColor: C.line, padding: 16 }, style]}>{children}</View>;
}

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: IconName }) {
  return (
    <Panel style={{ flex: 1, minWidth: 150 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={17} color={C.accent} />
      </View>
      <T v="small" color={C.ink3}>{label}</T>
      <T v="h1" tab style={{ marginTop: 2 }}>{value}</T>
      {sub && <T v="small" color={C.ink3}>{sub}</T>}
    </Panel>
  );
}

export default function Admin() {
  const user = useSession((s) => s.user);
  const live = useStalls();
  const unavailable = useUnavailable();
  const deals = useDeals();
  const menuV = useMenuVersion();
  const orders = useAllOrders();
  const insets = useSafeAreaInsets();
  const { desktop, tablet } = useLayout();
  const [tab, setTab] = useState<Tab>('overview');
  const [orderFilter, setOrderFilter] = useState<'live' | 'all'>('live');
  const [menuStall, setMenuStall] = useState(STALLS[0].id);
  const [users, setUsers] = useState<User[] | null>(null);
  const [dealItem, setDealItem] = useState<Item | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [itemOpen, setItemOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'users') api.listUsers().then(setUsers).catch(() => setUsers([]));
  }, [tab]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const list = (orders ?? []).filter((o) => o.createdAt >= start.getTime());
    const done = list.filter((o) => o.status === 'collected');
    return { count: list.length, revenue: done.reduce((n, o) => n + o.total, 0), live: (orders ?? []).filter((o) => LIVE.includes(o.status)).length };
  }, [orders]);

  if (!user) return <Redirect href="/staff/login" />;
  if (user.role !== 'admin') {
    const mine = user.stallId ? stallById[user.stallId] : undefined;
    return (
      <NoAccess title="HQ is *team only.*" action={mine ? `Back to ${mine.name}` : 'Back to home'} onAction={() => router.replace(mine ? '/staff' : '/home')}
        body={mine ? `You're signed in for ${mine.name}. HQ shows every stall, so only the Food Cart team can open it.` : 'HQ shows every stall and order, so only the Food Cart team can open it.'} />
    );
  }

  const all = Object.values(live);
  const cooking = all.reduce((n, s) => n + s.active, 0);
  const capacity = all.reduce((n, s) => n + s.maxActive, 0);
  const open = all.filter((s) => s.status === 'open').length;
  const liveDeals = Object.values(deals).filter((d) => liveDeal(d));
  const pad = desktop ? 32 : tablet ? 24 : 16;
  const cols = desktop ? 3 : tablet ? 2 : 1;

  const act = async (o: Order, to: OrderStatus) => {
    setBusy(o.id);
    try {
      await api.setOrderStatus(o.id, to);
      if (to === 'accepted') await api.setOrderStatus(o.id, 'preparing').catch(() => {});
      fx.pill();
    } catch {
      fx.error();
      toast('That order changed a moment ago.', 'arrows-clockwise-bold');
    } finally {
      setBusy(null);
    }
  };

  const shownOrders = (orders ?? []).filter((o) => orderFilter === 'all' || LIVE.includes(o.status));

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={{ backgroundColor: C.card, paddingTop: insets.top + 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: pad, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CartMark size={34} />
            <View style={{ flex: 1 }}>
              <T v="h2" numberOfLines={1}>Food Cart *HQ*</T>
              <T v="small" color={C.ink3}>Developer admin, full access</T>
            </View>
            <View style={{ paddingHorizontal: 10, height: 26, borderRadius: R.pill, backgroundColor: C.accentTint, justifyContent: 'center' }}>
              <T v="label" color={C.accent}>{api.mode === 'demo' ? 'Demo backend' : 'Live backend'}</T>
            </View>
            <Press onPress={async () => { await useSession.getState().signOut(); router.replace('/staff/login'); }} feedback="tap" accessibilityLabel="Sign out"
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sign-out-bold" size={18} />
            </Press>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {TABS.map((t) => <Pill key={t.key} label={t.label} icon={t.icon} active={tab === t.key} onPress={() => setTab(t.key)} />)}
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View key={tab} style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: pad, paddingTop: 20, gap: 16 }}>
          {tab === 'overview' && (
            <>
              <Animated.View entering={enterRise(0)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Kpi icon="fire-fill" label="Cooking on campus" value={String(cooking)} sub={`of ${capacity} capacity`} />
                <Kpi icon="storefront-bold" label="Stalls open" value={`${open}/${STALLS.length}`} sub={`${all.filter((s) => stallState(s) === 'full').length} at full capacity`} />
                <Kpi icon="receipt-bold" label="Orders today" value={String(today.count)} sub={`${today.live} live right now`} />
                <Kpi icon="money-bold" label="Collected today" value={rupees(today.revenue)} sub={`${liveDeals.length} last-call deals running`} />
              </Animated.View>
              <T v="h2" style={{ marginTop: 8 }}>Stalls right now</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {STALLS.map((s, i) => {
                  const l = live[s.id];
                  const st = stallState(l);
                  return (
                    <Animated.View key={s.id} entering={enterRise(i, 60)} style={{ width: cols === 1 ? '100%' : `${100 / cols - 1.5}%` as `${number}%` }}>
                      <Panel>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Photo photo={s.photo} width={48} style={{ width: 48, height: 48, borderRadius: 12 }} />
                          <View style={{ flex: 1 }}>
                            <T v="h3" numberOfLines={1}>{s.name}</T>
                            <T v="small" color={C.ink3} tab>~{etaMinutes(s.avgPrepMin, l)} min wait, {l?.active ?? 0}/{l?.maxActive ?? s.maxActive}</T>
                          </View>
                          <StatusChip state={st} />
                        </View>
                        <CapacityMeter active={l?.active ?? 0} max={l?.maxActive ?? s.maxActive} state={st} style={{ marginTop: 12 }} />
                      </Panel>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}

          {tab === 'orders' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pill label="Live" count={today.live} active={orderFilter === 'live'} onPress={() => setOrderFilter('live')} />
                <Pill label="Everything today" active={orderFilter === 'all'} onPress={() => setOrderFilter('all')} />
              </View>
              <Panel style={{ paddingVertical: 4 }}>
                {!shownOrders.length && <T v="body" color={C.ink3} style={{ paddingVertical: 20 }} center>No orders here yet.</T>}
                {shownOrders.map((o, i) => {
                  const next = NEXT_ACTION[o.status];
                  return (
                    <View key={o.id}>
                      {i > 0 && <Hairline />}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, flexWrap: 'wrap' }}>
                        <T v="brand" size={22} color={C.accent} tab style={{ width: 66 }}>{token(o.tokenNo)}</T>
                        <View style={{ flex: 1, minWidth: 160 }}>
                          <T v="bodyStrong" numberOfLines={1}>{stallById[o.stallId]?.name} · {o.customerName}</T>
                          <T v="small" color={C.ink3} numberOfLines={1}>{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</T>
                        </View>
                        <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
                          <T v="bodyStrong" tab>{rupees(o.total)}</T>
                          <T v="small" color={C.ink3}>{STATUS_LABEL[o.status]}, {ago(o.createdAt)}</T>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {o.status === 'placed' && <Button label="Reject" kind="danger" size="sm" onPress={() => act(o, 'rejected')} disabled={busy === o.id} />}
                          {next && <Button label={next.label} size="sm" onPress={() => act(o, next.to)} loading={busy === o.id} feedback="none" />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Panel>
            </>
          )}

          {tab === 'stalls' && STALLS.map((s, i) => {
            const l = live[s.id];
            const st = stallState(l);
            return (
              <Animated.View key={s.id} entering={enterRise(i)}>
                <Panel style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Photo photo={s.photo} width={52} style={{ width: 52, height: 52, borderRadius: 12 }} />
                    <View style={{ flex: 1 }}>
                      <T v="h3">{s.name}</T>
                      <T v="small" color={C.ink3}>{s.location}</T>
                    </View>
                    <StatusChip state={st} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                      <Toggle label={`${s.name} taking orders`} value={l?.status === 'open'} onChange={(v) => api.updateStall(s.id, { status: v ? 'open' : 'paused' })} />
                      <T v="small" color={C.ink2}>{l?.status === 'open' ? 'Taking orders' : 'Paused'}</T>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <T v="small" color={C.ink3}>Order cap</T>
                      <Press onPress={() => { fx.tick(); api.updateStall(s.id, { maxActive: (l?.maxActive ?? 100) - 10 }); }} feedback="none" accessibilityLabel="Lower cap" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="minus-bold" size={13} />
                      </Press>
                      <T v="bodyStrong" tab style={{ minWidth: 34, textAlign: 'center' }}>{l?.maxActive ?? s.maxActive}</T>
                      <Press onPress={() => { fx.tick(); api.updateStall(s.id, { maxActive: (l?.maxActive ?? 100) + 10 }); }} feedback="none" accessibilityLabel="Raise cap" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="plus-bold" size={13} />
                      </Press>
                    </View>
                    <Button label="Open console" size="sm" kind="light" iconRight="arrow-up-right-bold" onPress={() => router.push({ pathname: '/staff', params: { stall: s.id } })} />
                  </View>
                </Panel>
              </Animated.View>
            );
          })}

          {tab === 'menu' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
                  {STALLS.map((s) => <Pill key={s.id} label={s.name} active={menuStall === s.id} onPress={() => setMenuStall(s.id)} />)}
                </ScrollView>
                <Button label={desktop || tablet ? 'Add a dish' : 'Add'} icon="plus-bold" size="sm" onPress={() => { fx.open(); setEditItem(null); setItemOpen(true); }} feedback="none" />
              </View>
              <Panel style={{ paddingVertical: 4 }}>
                {ITEMS.filter((it) => it.stallId === menuStall).map((it, i) => (
                  <View key={it.id}>
                    {i > 0 && <Hairline />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                      <Photo photo={it.photo} width={44} style={{ width: 44, height: 44, borderRadius: 10 }} />
                      <View style={{ flex: 1 }}>
                        <T v="bodyStrong" numberOfLines={1}>{it.name}</T>
                        <T v="small" color={unavailable.has(it.id) ? C.chilli : C.ink3} numberOfLines={1}>{unavailable.has(it.id) ? 'Sold out' : it.category}</T>
                      </View>
                      <Press onPress={() => { fx.open(); setEditItem(it); setItemOpen(true); }} feedback="none" accessibilityLabel={`Set price of ${it.name}`}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.canvas, borderWidth: 1, borderColor: C.line }}>
                        <T v="bodyStrong" tab>{rupees(it.price)}</T>
                        <Icon name="note-pencil-bold" size={13} color={C.ink3} />
                      </Press>
                      <Toggle label={`${it.name} available`} value={!unavailable.has(it.id)} onChange={(v) => api.setItemAvailable(it.id, v)} />
                    </View>
                  </View>
                ))}
              </Panel>
            </>
          )}

          {tab === 'deals' && (
            <Panel style={{ paddingVertical: 4 }}>
              {!liveDeals.length && <T v="body" color={C.ink3} style={{ paddingVertical: 20 }} center>No last-call deals running.</T>}
              {liveDeals.sort((a, b) => a.endsAt - b.endsAt).map((d, i) => {
                const it = itemById[d.itemId];
                return (
                  <View key={d.itemId}>
                    {i > 0 && <Hairline />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, flexWrap: 'wrap' }}>
                      <Photo photo={it.photo} width={44} style={{ width: 44, height: 44, borderRadius: 10 }} />
                      <View style={{ flex: 1, minWidth: 160 }}>
                        <T v="bodyStrong" numberOfLines={1}>{it.name}</T>
                        <T v="small" color={C.ink3} tab>{stallById[it.stallId].name}, {rupees(d.price)} instead of {rupees(it.price)}, {d.left} left, ends {clock(d.endsAt)}</T>
                      </View>
                      <Button label="Edit" size="sm" kind="light" onPress={() => setDealItem(it)} />
                      <Button label="End" size="sm" kind="danger" onPress={() => { api.clearDeal(it.id); fx.remove(); }} />
                    </View>
                  </View>
                );
              })}
            </Panel>
          )}

          {tab === 'users' && (
            <Panel style={{ paddingVertical: 4 }}>
              {!users && <T v="body" color={C.ink3} style={{ paddingVertical: 20 }} center>Loading people...</T>}
              {users && !users.length && <T v="body" color={C.ink3} style={{ paddingVertical: 20 }} center>No accounts yet.</T>}
              {users?.map((u, i) => (
                <View key={u.id}>
                  {i > 0 && <Hairline />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                      <T v="bodyStrong" color={C.accent}>{(u.name || '?').slice(0, 1).toUpperCase()}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong" numberOfLines={1}>{u.name || 'No name yet'}</T>
                      <T v="small" color={C.ink3} numberOfLines={1}>{u.phone ? `+91 ${prettyPhone(u.phone)}` : u.email ?? (u.stallId ? stallById[u.stallId]?.name : '')}</T>
                    </View>
                    <View style={{ paddingHorizontal: 10, height: 24, borderRadius: R.pill, backgroundColor: u.role === 'admin' ? C.accentTint : u.role === 'staff' ? C.masalaSoft : C.canvas, justifyContent: 'center' }}>
                      <T v="label" color={u.role === 'admin' ? C.accent : u.role === 'staff' ? C.masala : C.ink2}>{u.role}</T>
                    </View>
                  </View>
                </View>
              ))}
            </Panel>
          )}

          {tab === 'system' && (
            <Panel style={{ gap: 14 }}>
              {[
                ['Backend', api.mode === 'demo' ? 'On-device demo engine (no .env). Add Supabase URL + anon key to go live.' : 'Supabase (Postgres, Auth, Realtime).'],
                ['App version', 'Food Cart 1.0.0'],
                ['Menu', `${STALLS.length} stalls, ${ITEMS.length} dishes`],
              ].map(([k, v]) => (
                <View key={k} style={{ gap: 2 }}>
                  <T v="label" color={C.ink3}>{k.toUpperCase()}</T>
                  <T v="body">{v}</T>
                </View>
              ))}
              <Hairline />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button label="Test order-ready chime" size="sm" kind="light" icon="bell-ringing-bold" onPress={() => fx.ready()} feedback="none" />
                <Button label="Open student app" size="sm" kind="light" icon="house-bold" onPress={() => toast('Log out and sign in with a phone number to use the student app', 'info-bold')} />
                {api.mode === 'demo' && <Button label="Reset demo data" size="sm" kind="danger" icon="arrows-clockwise-bold" onPress={() => { resetDemo(); toast('Demo reset', 'arrows-clockwise-bold'); }} />}
              </View>
            </Panel>
          )}
        </View>
      </ScrollView>
      <DealSheet item={dealItem} current={dealItem ? liveDeal(deals[dealItem.id]) : undefined} onClose={() => setDealItem(null)} />
      <ItemSheet stallId={editItem?.stallId ?? menuStall} item={editItem ?? undefined} open={itemOpen} onClose={() => setItemOpen(false)} />
    </View>
  );
}
