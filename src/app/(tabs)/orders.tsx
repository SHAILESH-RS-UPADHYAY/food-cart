import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useMyOrders, type Order } from '@/api';
import { LIVE } from '@/api/rules';
import { stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { ago, rupees, token } from '@/lib/format';
import { useLayout, useTabInsets } from '@/lib/layout';
import { useCart } from '@/store/cart';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { Column, SectionTitle } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R, SHADOW } from '@/ui/theme';

const LABEL: Record<Order['status'], string> = {
  placed: 'Sent to kitchen', accepted: 'Accepted', preparing: 'Cooking', ready: 'Ready to collect',
  collected: 'Collected', cancelled: 'Cancelled', rejected: 'Declined',
};

function LiveCard({ order }: { order: Order }) {
  const stall = stallById[order.stallId];
  const ready = order.status === 'ready';
  const step = { placed: 1, accepted: 2, preparing: 3, ready: 4 }[order.status as 'placed'] ?? 0;
  return (
    <Press onPress={() => router.push(`/order/${order.id}`)} feedback="open" scale={0.985}
      style={[{ borderRadius: R.card, backgroundColor: ready ? C.accent : C.card, padding: 16, gap: 14 }, SHADOW.card]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Photo photo={stall.photo} width={56} style={{ width: 56, height: 56, borderRadius: 14 }} />
        <View style={{ flex: 1 }}>
          <T v="h3" color={ready ? C.chalk : C.ink}>{stall.name}</T>
          <T v="small" color={ready ? 'rgba(255,255,255,0.8)' : C.ink3}>{order.lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}</T>
        </View>
        <T v="brand" size={30} color={ready ? C.onAccent : C.accent} tab>{token(order.tokenNo)}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? (ready ? C.canvas : C.accent) : ready ? 'rgba(255,255,255,0.3)' : C.line, transitionProperty: 'backgroundColor', transitionDuration: 300 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {ready && (
            <Animated.View style={{ animationName: { '0%': { transform: [{ rotate: '0deg' }] }, '25%': { transform: [{ rotate: '-14deg' }] }, '75%': { transform: [{ rotate: '14deg' }] }, '100%': { transform: [{ rotate: '0deg' }] } }, animationDuration: '600ms', animationIterationCount: 3, animationTimingFunction: CSS_EASE_OUT }}>
              <Icon name="bell-ringing-bold" size={18} color={C.onAccent} />
            </Animated.View>
          )}
          <T v="bodyStrong" color={ready ? C.onAccent : C.ink}>{LABEL[order.status]}</T>
        </View>
        <T v="small" color={ready ? 'rgba(255,255,255,0.85)' : C.ink3}>{ready ? `Code ${order.pickupCode}` : ago(order.createdAt)}</T>
      </View>
    </Press>
  );
}

function PastRow({ order }: { order: Order }) {
  const stall = stallById[order.stallId];
  const reorder = () => {
    useCart.getState().clear();
    for (const l of order.lines) for (let i = 0; i < l.qty; i++) useCart.getState().add(l.itemId);
    fx.add();
    router.push('/cart');
  };
  return (
    <Press onPress={() => router.push(`/order/${order.id}`)} feedback="tap" scale={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
      <Photo photo={stall.photo} width={48} style={{ width: 48, height: 48, borderRadius: 12 }} />
      <View style={{ flex: 1 }}>
        <T v="bodyStrong">{stall.name}</T>
        <T v="small" color={C.ink3}>{LABEL[order.status]} {ago(order.createdAt)}, {rupees(order.total)}</T>
      </View>
      <Button label="Reorder" size="sm" kind="light" icon="arrows-clockwise-bold" onPress={reorder} />
    </Press>
  );
}

export default function Orders() {
  const orders = useMyOrders();
  const pad = useTabInsets();
  const { desktop } = useLayout();
  const live = orders?.filter((o) => LIVE.includes(o.status)) ?? [];
  const past = orders?.filter((o) => !LIVE.includes(o.status)) ?? [];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.canvas }} contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom }}>
      <Column>
        <Animated.View entering={enterRise(0)} style={{ marginTop: desktop ? 28 : 10 }}>
          <T v="display">Aapke orders</T>
        </Animated.View>
        {orders && !orders.length && (
          <Animated.View entering={enterRise(1)} style={{ marginTop: 40, alignItems: 'flex-start', gap: 12 }}>
            <T v="brand" size={40} color={C.ink4}>#000</T>
            <T v="h2">Abhi tak koi token nahi.</T>
            <T v="body" color={C.ink2}>Your first order is one tap away. Pickup codes and live status show up here.</T>
            <Button label="Browse stalls" kind="dark" size="md" onPress={() => router.navigate('/home')} style={{ marginTop: 6 }} />
          </Animated.View>
        )}
        {!!live.length && (
          <>
            <SectionTitle title="Abhi ban raha hai" />
            <View style={{ gap: 14, flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap' }}>
              {live.map((o, i) => (
                <Animated.View key={o.id} entering={enterRise(i, 60)} style={{ width: desktop ? 360 : '100%' }}>
                  <LiveCard order={o} />
                </Animated.View>
              ))}
            </View>
          </>
        )}
        {!!past.length && (
          <>
            <SectionTitle title="Pehle ke orders" />
            <View style={[{ backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 16 }, SHADOW.card]}>
              {past.map((o, i) => (
                <View key={o.id} style={i ? { borderTopWidth: 1, borderTopColor: C.line } : undefined}>
                  <PastRow order={o} />
                </View>
              ))}
            </View>
          </>
        )}
      </Column>
    </ScrollView>
  );
}
