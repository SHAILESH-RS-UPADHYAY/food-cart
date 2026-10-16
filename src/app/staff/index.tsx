import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, useDeals, useStallOrders, useStalls, useUnavailable, type Order, type OrderStatus } from '@/api';
import { KITCHEN, liveDeal, stallState } from '@/api/rules';
import { itemsOf, stallById, type Item } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { clock, rupees, token } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { useSession } from '@/store/session';
import { CapacityMeter, Hairline, StatusChip } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { CartMark } from '@/ui/Logo';
import { DealSheet } from '@/ui/DealSheet';
import { CSS_EASE_OUT, EASE_OUT } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Pill } from '@/ui/Pill';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { Toggle } from '@/ui/Toggle';
import { C, R, SHADOW } from '@/ui/theme';

type Column = 'new' | 'cooking' | 'ready';
const COLS: { key: Column; label: string; statuses: OrderStatus[]; empty: string }[] = [
  { key: 'new', label: 'New', statuses: ['placed'], empty: 'Abhi koi naya order nahi.' },
  { key: 'cooking', label: 'Cooking', statuses: ['accepted', 'preparing'], empty: 'Kitchen khaali hai.' },
  { key: 'ready', label: 'Ready', statuses: ['ready'], empty: 'Counter pe koi wait nahi kar raha.' },
];
const ENTER = FadeInDown.duration(280).easing(EASE_OUT);
const REFLOW = LinearTransition.duration(220).easing(EASE_OUT);

function useNow(ms = 15000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function OrderCard({ order, fresh, now, onAct, busy }: { order: Order; fresh: boolean; now: number; onAct: (o: Order, s: OrderStatus) => void; busy: boolean }) {
  const mins = Math.floor((now - order.createdAt) / 60000);
  const late = mins >= 15 ? C.chilli : mins >= 8 ? C.masala : C.ink3;
  return (
    <Animated.View entering={ENTER} layout={REFLOW} style={[{ borderRadius: R.card, backgroundColor: C.card, padding: 16, gap: 12, borderWidth: 2, borderColor: fresh ? C.accent : 'transparent' }, SHADOW.card]}>
      {fresh && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: -2, borderRadius: R.card, borderWidth: 3, borderColor: C.accent, animationName: { from: { opacity: 1 }, to: { opacity: 0 } }, animationDuration: '900ms', animationIterationCount: 4, animationDirection: 'alternate' }} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <T v="brand" size={30} tab>{token(order.tokenNo)}</T>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong" numberOfLines={1}>{order.customerName}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock-bold" size={13} color={late} />
            <T v="small" color={late} tab>{mins < 1 ? 'just now' : `${mins} min`}</T>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, height: 26, borderRadius: R.pill, justifyContent: 'center', backgroundColor: order.payment === 'cod' ? C.accentTint : C.leafSoft }}>
          <T v="label" color={order.payment === 'cod' ? C.ink : C.leaf} style={{ fontSize: 11 }}>{order.payment === 'cod' ? `Collect ${rupees(order.total)}` : 'Paid online'}</T>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        {order.lines.map((l) => (
          <View key={l.itemId} style={{ flexDirection: 'row', gap: 8 }}>
            <T v="bodyStrong" tab style={{ width: 26 }}>{l.qty}×</T>
            <T v="body" style={{ flex: 1 }}>{l.name}</T>
          </View>
        ))}
      </View>
      {order.note && (
        <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: C.accentTint }}>
          <Icon name="note-pencil-bold" size={16} />
          <T v="small" style={{ flex: 1 }}>{order.note}</T>
        </View>
      )}
      {order.status === 'placed' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label="Reject" kind="danger" size="md" onPress={() => onAct(order, 'rejected')} disabled={busy} style={{ flex: 1 }} />
          <Button label="Accept" icon="check-bold" size="md" onPress={() => onAct(order, 'accepted')} loading={busy} style={{ flex: 2 }} />
        </View>
      )}
      {(order.status === 'accepted' || order.status === 'preparing') && (
        <Button label="Mark ready" icon="bell-ringing-bold" kind="dark" size="md" onPress={() => onAct(order, 'ready')} loading={busy} block />
      )}
      {order.status === 'ready' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <T v="small" color={C.ink3}>Pickup code</T>
            <T v="h2" tab style={{ letterSpacing: 4 }}>{order.pickupCode}</T>
          </View>
          <Button label="Handed over" icon="check-bold" size="md" onPress={() => onAct(order, 'collected')} loading={busy} />
        </View>
      )}
    </Animated.View>
  );
}

export default function Console() {
  const user = useSession((s) => s.user);
  const params = useLocalSearchParams<{ stall?: string }>();
  const stallId = user?.role === 'admin' ? params.stall ?? 'hr-cafe' : user?.stallId;
  const stall = stallId ? stallById[stallId] : undefined;
  const orders = useStallOrders(stall?.id);
  const live = useStalls()[stallId ?? ''];
  const unavailable = useUnavailable();
  const deals = useDeals();
  const [dealItem, setDealItem] = useState<Item | null>(null);
  const insets = useSafeAreaInsets();
  const { desktop, tablet } = useLayout();
  const now = useNow();
  const [view, setView] = useState<Column | 'menu' | 'deals'>('new');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const seen = useRef<Set<string> | null>(null);
  const mountedAt = useRef(Date.now());

  // New orders: chime + highlight, never on the first load.
  useEffect(() => {
    if (!orders) return;
    const placed = orders.filter((o) => o.status === 'placed');
    if (seen.current && Date.now() - mountedAt.current > 2500) {
      const arrivals = placed.filter((o) => !seen.current!.has(o.id));
      if (arrivals.length) {
        fx.alert();
        toast(`Naya order ${token(arrivals[0].tokenNo)} from ${arrivals[0].customerName}`, 'bell-ringing-bold');
        setFresh((f) => new Set([...f, ...arrivals.map((o) => o.id)]));
        setTimeout(() => setFresh((f) => new Set([...f].filter((id) => !arrivals.some((a) => a.id === id)))), 7000);
      }
    }
    seen.current = new Set(orders.map((o) => o.id));
  }, [orders]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const list = (orders ?? []).filter((o) => o.createdAt >= start.getTime());
    const done = list.filter((o) => o.status === 'collected');
    return { done: done.length, revenue: done.reduce((n, o) => n + o.total, 0) };
  }, [orders]);

  if (!user) return <Redirect href="/staff/login" />;
  if (!stall) return <Redirect href={user.role === 'student' ? '/home' : '/staff/login'} />;

  const byCol = (c: (typeof COLS)[number]) => (orders ?? []).filter((o) => c.statuses.includes(o.status)).sort((a, b) => a.createdAt - b.createdAt);
  const kitchen = (orders ?? []).filter((o) => KITCHEN.includes(o.status)).length;
  const state = stallState(live);
  const open = live?.status === 'open';

  const act = async (o: Order, status: OrderStatus) => {
    setBusyId(o.id);
    try {
      await api.setOrderStatus(o.id, status);
      if (status === 'accepted') await api.setOrderStatus(o.id, 'preparing').catch(() => {});
      if (status === 'ready') fx.ready();
      else if (status === 'collected') fx.success();
      else if (status === 'rejected') fx.remove();
      else fx.pill();
    } catch {
      fx.error();
      toast('That order changed a moment ago.', 'arrows-clockwise-bold');
    } finally {
      setBusyId(null);
    }
  };

  const setCap = (n: number) => {
    fx.tick();
    api.updateStall(stall.id, { maxActive: n });
  };

  const board = desktop ? (
    <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
      {COLS.map((c) => {
        const list = byCol(c);
        return (
          <View key={c.key} style={{ flex: 1, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T v="h2">{c.label}</T>
              <View style={{ minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 8, backgroundColor: c.key === 'new' && list.length ? C.accent : C.line, alignItems: 'center', justifyContent: 'center' }}>
                <T v="label" tab color={c.key === 'new' && list.length ? C.onAccent : C.ink}>{list.length}</T>
              </View>
            </View>
            {list.length ? list.map((o) => <OrderCard key={o.id} order={o} fresh={fresh.has(o.id)} now={now} onAct={act} busy={busyId === o.id} />)
              : <View style={{ padding: 22, borderRadius: R.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line }}><T v="body" color={C.ink3} center>{c.empty}</T></View>}
          </View>
        );
      })}
    </View>
  ) : null;

  const current = COLS.find((c) => c.key === view);
  const menuSections = Object.entries(
    itemsOf(stall.id).reduce<Record<string, ReturnType<typeof itemsOf>>>((acc, it) => ({ ...acc, [it.category]: [...(acc[it.category] ?? []), it] }), {}),
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={{ backgroundColor: C.canvas, paddingTop: insets.top + 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: desktop ? 32 : 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CartMark size={34} />
          <View style={{ flex: 1 }}>
            <T v="h2" numberOfLines={1}>{stall.name}</T>
            <T v="small" color={C.ink3}>Stall console</T>
          </View>
          <StatusChip state={state} pulse />
          {user.role === 'admin' && (
            <Press onPress={() => router.replace('/admin')} feedback="tap" style={{ height: 40, paddingHorizontal: 14, borderRadius: R.pill, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="chart-bar-bold" size={16} color={C.ink} />
              {!tablet && !desktop ? null : <T v="label">Admin</T>}
            </Press>
          )}
          <Press onPress={async () => { await useSession.getState().signOut(); router.replace('/staff/login'); }} feedback="tap" accessibilityLabel="Sign out" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sign-out-bold" size={18} color={C.ink} />
          </Press>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: desktop ? 32 : 18, paddingTop: 18, gap: 18 }}>
          <View style={{ flexDirection: desktop || tablet ? 'row' : 'column', gap: 12 }}>
            <View style={[{ flex: 2, padding: 16, borderRadius: R.card, backgroundColor: C.card, gap: 12 }, SHADOW.card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <T v="small" color={C.ink3}>In the kitchen</T>
                  <T v="h1" tab>{live?.active ?? kitchen}<T v="h3" color={C.ink3}> / {live?.maxActive ?? stall.maxActive}</T></T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <T v="small" color={C.ink3}>Order cap</T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Press onPress={() => setCap((live?.maxActive ?? 100) - 10)} feedback="none" accessibilityLabel="Lower cap by 10" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="minus-bold" size={14} />
                    </Press>
                    <T v="h3" tab style={{ minWidth: 40, textAlign: 'center' }}>{live?.maxActive ?? stall.maxActive}</T>
                    <Press onPress={() => setCap((live?.maxActive ?? 100) + 10)} feedback="none" accessibilityLabel="Raise cap by 10" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="plus-bold" size={14} />
                    </Press>
                  </View>
                </View>
              </View>
              <CapacityMeter active={live?.active ?? kitchen} max={live?.maxActive ?? stall.maxActive} state={state} />
              <T v="small" color={C.ink3}>Includes walk-up orders the kitchen is already handling. At the cap, students see "Kitchen full" and can't order.</T>
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              <View style={[{ flex: 1, padding: 16, borderRadius: R.card, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, SHADOW.card]}>
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong">{open ? 'Taking orders' : 'Paused'}</T>
                  <T v="small" color={C.ink3}>{open ? 'Students can order now' : 'New orders are blocked'}</T>
                </View>
                <Toggle label="Taking orders" value={open} onChange={(v) => api.updateStall(stall.id, { status: v ? 'open' : 'paused' })} />
              </View>
              <View style={[{ flex: 1, padding: 16, borderRadius: R.card, backgroundColor: C.card, flexDirection: 'row', gap: 18 }, SHADOW.card]}>
                <View><T v="small" color={C.ink3}>Done today</T><T v="h2" tab>{today.done}</T></View>
                <View><T v="small" color={C.ink3}>Collected</T><T v="h2" tab>{rupees(today.revenue)}</T></View>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {!desktop && COLS.map((c) => <Pill key={c.key} label={c.label} count={byCol(c).length} active={view === c.key} onPress={() => setView(c.key)} />)}
            {desktop && <Pill label="Live board" icon="squares-four-bold" active={view !== 'menu'} onPress={() => setView('new')} />}
            <Pill label="Menu" icon="bowl-food-bold" active={view === 'menu'} onPress={() => setView('menu')} />
            <Pill label="Last call" icon="hourglass-high-bold" count={itemsOf(stall.id).filter((it) => liveDeal(deals[it.id])).length} active={view === 'deals'} onPress={() => setView('deals')} />
          </ScrollView>

          {view === 'deals' ? (
            <View style={{ gap: 14 }}>
              <View style={[{ backgroundColor: C.card, borderRadius: R.card, padding: 16 }, SHADOW.card]}>
                <T v="h3">Leftovers? Sell them, don't bin them.</T>
                <T v="body" color={C.ink2} style={{ marginTop: 4 }}>
                  Put extra plates on last call at a lower price. Students see a countdown and the plates left, and the deal ends on its own.
                </T>
              </View>
              {itemsOf(stall.id).map((it) => {
                const d = liveDeal(deals[it.id]);
                return (
                  <View key={it.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.card, backgroundColor: d ? C.accentTint : C.card }]}>
                    <Photo photo={it.photo} width={52} style={{ width: 52, height: 52, borderRadius: 12 }} />
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong" numberOfLines={1}>{it.name}</T>
                      <T v="small" color={d ? C.accent : C.ink3} tab>
                        {d ? `${rupees(d.price)} instead of ${rupees(it.price)}, ${d.left} left, ends ${clock(d.endsAt)}` : rupees(it.price)}
                      </T>
                    </View>
                    {d && <Button label="End" kind="light" size="sm" onPress={() => { api.clearDeal(it.id); fx.remove(); }} />}
                    <Button label={d ? 'Edit' : 'Last call'} kind={d ? 'dark' : 'primary'} size="sm" disabled={unavailable.has(it.id)} onPress={() => { fx.open(); setDealItem(it); }} feedback="none" />
                  </View>
                );
              })}
            </View>
          ) : view === 'menu' ? (
            <View style={[{ backgroundColor: C.card, borderRadius: R.card, padding: 16 }, SHADOW.card]}>
              <T v="body" color={C.ink2} style={{ marginBottom: 6 }}>Switch a dish off the moment it runs out. Students see "Sold out" instantly.</T>
              {menuSections.map(([cat, list]) => (
                <View key={cat}>
                  <T v="h3" style={{ marginTop: 16, marginBottom: 4 }}>{cat}</T>
                  {list.map((it, i) => (
                    <View key={it.id}>
                      {i > 0 && <Hairline />}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                        <View style={{ flex: 1 }}>
                          <T v="bodyStrong" color={unavailable.has(it.id) ? C.ink3 : C.ink}>{it.name}</T>
                          <T v="small" color={unavailable.has(it.id) ? C.chilli : C.ink3} tab>{unavailable.has(it.id) ? 'Sold out' : rupees(it.price)}</T>
                        </View>
                        <Toggle label={`${it.name} available`} value={!unavailable.has(it.id)} onChange={(v) => api.setItemAvailable(it.id, v)} />
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : desktop ? board : current && (
            <View style={{ gap: 12 }}>
              {byCol(current).length ? byCol(current).map((o) => <OrderCard key={o.id} order={o} fresh={fresh.has(o.id)} now={now} onAct={act} busy={busyId === o.id} />)
                : <View style={{ padding: 28, borderRadius: R.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line }}><T v="body" color={C.ink3} center>{current.empty}</T></View>}
            </View>
          )}
          {api.mode === 'demo' && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.leaf, animationName: { from: { opacity: 1 }, to: { opacity: 0.25 } }, animationDuration: '900ms', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: CSS_EASE_OUT }} />
              <T v="small" color={C.ink3}>Demo: walk-up orders from other students arrive every half minute or so.</T>
            </View>
          )}
        </View>
      </ScrollView>
      <DealSheet item={dealItem} current={dealItem ? liveDeal(deals[dealItem.id]) : undefined} onClose={() => setDealItem(null)} />
    </View>
  );
}
