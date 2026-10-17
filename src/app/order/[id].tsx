import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeOut, cubicBezier } from 'react-native-reanimated';

import { api, useMyOrders, type Order, type OrderStatus } from '@/api';
import { stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { clock, rupees, token } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { useCart } from '@/store/cart';
import { useSettings } from '@/store/settings';
import { Hairline } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { Confetti } from '@/ui/Confetti';
import { Icon, type IconName } from '@/ui/Icon';
import { CSS_EASE_IN_OUT, CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { StackPage } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { Token } from '@/ui/Token';
import { C, R, SHADOW } from '@/ui/theme';

const BOUNCE = cubicBezier(0.34, 1.56, 0.64, 1);

const STEPS: { status: OrderStatus; label: string; icon: IconName }[] = [
  { status: 'placed', label: 'Placed', icon: 'receipt-fill' },
  { status: 'accepted', label: 'Accepted', icon: 'chef-hat-bold' },
  { status: 'preparing', label: 'Cooking', icon: 'fire-fill' },
  { status: 'ready', label: 'Ready', icon: 'check-bold' },
];
const RANK: Record<OrderStatus, number> = { placed: 0, accepted: 1, preparing: 2, ready: 3, collected: 4, cancelled: -1, rejected: -1 };

const COPY: Record<OrderStatus, { head: string; sub: string }> = {
  placed: { head: 'Sent to *the kitchen.*', sub: 'Waiting for the stall to accept.' },
  accepted: { head: 'The chef *said yes.*', sub: 'Your order is next on the line.' },
  preparing: { head: 'Your food is *cooking.*', sub: "It's cooking. Walk over when we buzz you." },
  ready: { head: 'Ready at *the counter.*', sub: 'Show your code and grab it.' },
  collected: { head: '*Enjoy your meal!*', sub: 'Thanks for skipping the queue.' },
  cancelled: { head: 'Order cancelled', sub: 'Nothing was charged.' },
  rejected: { head: "The stall couldn't take this order", sub: 'Usually an item ran out. Try another dish or stall.' },
};

/** Seconds until ready: demo kitchens are compressed, live ones use the stall's ETA. */
function useCountdown(order?: Order) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!order) return null;
  const due = api.mode === 'demo' && useSettings.getState().autopilot ? order.createdAt + 26000 : order.createdAt + order.etaMin * 60000;
  return Math.max(0, Math.round((due - now) / 1000));
}

function Celebration({ order, onDone }: { order: Order; onDone: () => void }) {
  useEffect(() => {
    fx.success();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View exiting={FadeOut.duration(260)} style={{ position: 'absolute', inset: 0, zIndex: 30, backgroundColor: C.accent }}>
      <Pressable onPress={onDone} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }} accessibilityLabel="Continue">
        <Animated.View
          style={{
            width: 104, height: 104, borderRadius: 52, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center',
            animationName: { from: { opacity: 0, transform: [{ scale: 0.4 }, { rotate: '-30deg' }] }, to: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }] } },
            animationDuration: '560ms', animationTimingFunction: BOUNCE,
          }}
        >
          <Icon name="check-bold" size={52} color={C.accent} />
        </Animated.View>
        <Animated.View style={{ alignItems: 'center', marginTop: 26, opacity: 0, animationName: { from: { opacity: 0, transform: [{ translateY: 18 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }, animationDuration: '460ms', animationDelay: 220, animationFillMode: 'forwards', animationTimingFunction: CSS_EASE_OUT }}>
          <T v="brand" size={46} color={C.chalk} center>Order placed!</T>
          <T v="h3" color="rgba(255,255,255,0.82)" center style={{ marginTop: 6 }}>
            Token {token(order.tokenNo)} at {stallById[order.stallId].name}
          </T>
        </Animated.View>
      </Pressable>
      <Confetti />
    </Animated.View>
  );
}

export default function OrderScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const orders = useMyOrders();
  const order = orders?.find((o) => o.id === id);
  const { wide } = useLayout();
  const [celebrate, setCelebrate] = useState(fresh === '1');
  const [busy, setBusy] = useState(false);
  const left = useCountdown(order);
  const prev = useRef<OrderStatus | undefined>(undefined);

  useEffect(() => {
    if (!order) return;
    if (prev.current && prev.current !== order.status && order.status === 'ready') {
      fx.stamp();
      setTimeout(fx.ready, 160);
    }
    prev.current = order.status;
  }, [order?.status]);

  if (!orders || (!order && fresh === '1')) return <StackPage title="Your order"><View style={{ height: 320, borderRadius: R.token, backgroundColor: C.line, opacity: 0.6 }} /></StackPage>;
  if (!order) {
    return (
      <StackPage title="Your order">
        <T v="h2">We couldn't find this order.</T>
        <Button label="See my orders" onPress={() => router.replace('/orders')} kind="dark" size="md" style={{ marginTop: 16, alignSelf: 'flex-start' }} />
      </StackPage>
    );
  }

  const stall = stallById[order.stallId];
  const rank = RANK[order.status];
  const copy = COPY[order.status];
  const dead = rank < 0;
  const stamp = order.status === 'ready' ? 'Ready' : order.status === 'collected' ? 'Collected' : dead ? (order.status === 'cancelled' ? 'Cancelled' : 'Declined') : undefined;

  const act = async (status: OrderStatus) => {
    setBusy(true);
    try {
      await api.setOrderStatus(order.id, status);
      if (status === 'collected') fx.success();
      if (status === 'cancelled') toast('Order cancelled', 'x-bold');
    } catch {
      fx.error();
      toast('That changed a moment ago. Refreshing.', 'arrows-clockwise-bold');
    } finally {
      setBusy(false);
    }
  };

  const reorder = () => {
    useCart.getState().clear();
    for (const l of order.lines) for (let i = 0; i < l.qty; i++) useCart.getState().add(l.itemId);
    fx.add();
    router.push('/cart');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <StackPage title={stall.name}>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, width: wide ? undefined : '100%', gap: 18 }}>
            <Animated.View key={order.status} entering={enterRise(0)}>
              <T v="display" color={dead ? C.chilli : C.ink}>{copy.head}</T>
              <T v="body" color={C.ink2} style={{ marginTop: 6, fontSize: 16 }}>{copy.sub}</T>
            </Animated.View>

            {!dead && rank < 4 && (
              <Animated.View entering={enterRise(1)} style={[{ padding: 18, borderRadius: R.card, backgroundColor: C.card, gap: 16 }, SHADOW.card]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {STEPS.map((s, i) => {
                    const on = rank >= i;
                    const now = rank === i;
                    return (
                      <View key={s.status} style={{ flex: i === 0 ? undefined : 1, flexDirection: 'row', alignItems: 'flex-start' }}>
                        {i > 0 && (
                          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.line, marginTop: 18, marginHorizontal: 4, overflow: 'hidden' }}>
                            <Animated.View style={{ flex: 1, backgroundColor: C.accent, transformOrigin: 'left', transform: [{ scaleX: on ? 1 : 0 }], transitionProperty: 'transform', transitionDuration: 520, transitionTimingFunction: CSS_EASE_IN_OUT }} />
                          </View>
                        )}
                        <View style={{ alignItems: 'center', gap: 8, width: 62 }}>
                          <View style={{ width: 40, height: 40 }}>
                            {now && i < 3 && (
                              <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: 20, backgroundColor: C.accent, animationName: { from: { opacity: 0.55, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scale: 1.7 }] } }, animationDuration: '1400ms', animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT }} />
                            )}
                            <Animated.View
                              style={{
                                width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                                backgroundColor: on ? (i === 3 ? C.leaf : C.accent) : C.card,
                                transitionProperty: 'backgroundColor', transitionDuration: 260,
                              }}
                            >
                              <Icon name={s.icon} size={18} color={on ? C.chalk : C.ink4} />
                            </Animated.View>
                          </View>
                          <T v="label" color={on ? C.ink : C.ink3} style={{ fontSize: 11 }}>{s.label}</T>
                        </View>
                      </View>
                    );
                  })}
                </View>
                {rank < 3 && left != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="timer-bold" size={18} color={C.ink2} />
                    <T v="bodyStrong" tab>
                      {left > 90 ? `Ready in about ${Math.ceil(left / 60)} min` : left > 0 ? `Ready in 0:${String(left).padStart(2, '0')}` : 'Any moment now'}
                    </T>
                    {api.mode === 'demo' && <T v="small" color={C.ink3} style={{ flex: 1, textAlign: 'right' }}>Demo kitchen, sped up</T>}
                  </View>
                )}
              </Animated.View>
            )}

            <Animated.View entering={enterRise(2)}>
              <Token
                stall={stall.name}
                tokenNo={order.tokenNo}
                code={order.pickupCode}
                qrValue={`foodcart:${order.id}:${order.pickupCode}`}
                stamp={stamp}
                stampTone={dead ? 'chilli' : 'stamp'}
              />
            </Animated.View>
          </View>

          <View style={{ width: wide ? 380 : '100%', gap: 16 }}>
            <Animated.View entering={enterRise(3)} style={[{ padding: 18, borderRadius: R.card, backgroundColor: C.card, gap: 10 }, SHADOW.card]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T v="h3">Order details</T>
                <T v="small" color={C.ink3}>{clock(order.createdAt)}</T>
              </View>
              {order.lines.map((l) => (
                <View key={l.itemId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <T v="body" style={{ flex: 1 }}>{l.qty} × {l.name}</T>
                  <T v="bodyStrong" tab>{rupees(l.qty * l.price)}</T>
                </View>
              ))}
              {order.note && (
                <View style={{ padding: 10, borderRadius: 12, backgroundColor: C.accentTint }}>
                  <T v="small">Note: {order.note}</T>
                </View>
              )}
              <Hairline />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name={order.payment === 'cod' ? 'money-bold' : 'check-circle-fill'} size={18} color={order.payment === 'cod' ? C.ink2 : C.leaf} />
                  <T v="small" color={C.ink2}>{order.payment === 'cod' ? 'Pay at counter' : 'Paid online (demo)'}</T>
                </View>
                <T v="h2" tab>{rupees(order.total)}</T>
              </View>
            </Animated.View>

            {order.status === 'ready' && <Button label="I've collected it" icon="check-bold" onPress={() => act('collected')} loading={busy} block />}
            {order.status === 'placed' && <Button label="Cancel order" kind="danger" onPress={() => act('cancelled')} loading={busy} block />}
            {(order.status === 'collected' || dead) && <Button label="Order this again" icon="arrows-clockwise-bold" onPress={reorder} kind="dark" block />}
            <Button label="Back to stalls" kind="quiet" onPress={() => router.replace('/home')} block />
          </View>
        </View>
      </StackPage>
      {celebrate && <Celebration order={order} onDone={() => setCelebrate(false)} />}
    </View>
  );
}
