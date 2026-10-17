import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDeals, useStalls, useUnavailable, type Payment } from '@/api';
import { etaMinutes, freeSlotMinutes, stallState } from '@/api/rules';
import { itemById, stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { rupees } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { usePlaceOrder } from '@/lib/place-order';
import { unitPrice, useCart, useCartSummary } from '@/store/cart';
import { Hairline } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { fullLine } from '@/ui/cards';
import { Icon, type IconName } from '@/ui/Icon';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { StackPage } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { SlideToConfirm } from '@/ui/SlideToConfirm';
import { Stepper } from '@/ui/Stepper';
import { T } from '@/ui/Text';
import { C, F, R, SHADOW } from '@/ui/theme';

function PayOption({ active, onPress, icon, title, body }: { active: boolean; onPress: () => void; icon: IconName; title: string; body: string }) {
  return (
    <Press onPress={onPress} feedback="pill" scale={0.985} accessibilityRole="radio" accessibilityState={{ checked: active }} style={{ flex: 1 }}>
      <Animated.View
        style={{
          flexDirection: 'row', gap: 12, padding: 16, borderRadius: R.card, backgroundColor: C.card, borderWidth: 2,
          borderColor: active ? C.accent : C.line, transitionProperty: 'borderColor', transitionDuration: 180, transitionTimingFunction: CSS_EASE_OUT,
        }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: active ? C.accent : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} color={active ? C.onAccent : C.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3">{title}</T>
          <T v="small" color={C.ink3} style={{ marginTop: 2 }}>{body}</T>
        </View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: active ? C.accent : C.ink4, alignItems: 'center', justifyContent: 'center' }}>
          {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent }} />}
        </View>
      </Animated.View>
    </Press>
  );
}

export default function Cart() {
  const { desktop, wide } = useLayout();
  const stallId = useCart((s) => s.stallId);
  const qty = useCart((s) => s.qty);
  const note = useCart((s) => s.note);
  const live = useStalls();
  const unavailable = useUnavailable();
  const [payment, setPayment] = useState<Payment>('cod');
  const { place, busy, full, closeFull } = usePlaceOrder();
  const { count, total } = useCartSummary();
  const deals = useDeals();

  if (!stallId || !count) {
    return (
      <StackPage title="Your cart">
        <Animated.View entering={enterRise(0)} style={{ alignItems: 'center', paddingVertical: 70, gap: 14 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shopping-bag-bold" size={42} color={C.accent} />
          </View>
          <T v="h1" center>Your cart is *empty.*</T>
          <T v="body" color={C.ink2} center>Seven stalls are cooking right now. Pick one.</T>
          <Button label="Browse stalls" onPress={() => router.replace('/home')} kind="dark" size="md" style={{ marginTop: 8 }} />
        </Animated.View>
      </StackPage>
    );
  }

  const stall = stallById[stallId];
  const state = stallState(live[stallId]);
  const soldOut = Object.keys(qty).filter((id) => unavailable.has(id));
  const canOrder = state !== 'paused' && state !== 'closed' && soldOut.length === 0;

  const submit = () => {
    if (payment === 'online_demo') {
      fx.open();
      router.push('/pay');
      return;
    }
    place('cod').catch(() => {});
  };

  const cta = canOrder
    ? desktop
      ? <Button label={payment === 'cod' ? `Place order · ${rupees(total)}` : `Continue to pay · ${rupees(total)}`} iconRight="arrow-right-bold" onPress={submit} loading={busy} feedback="press" block />
      : <SlideToConfirm label={payment === 'cod' ? `Slide to order · ${rupees(total)}` : `Slide to pay · ${rupees(total)}`} onConfirm={submit} disabled={busy} />
    : <Button label={soldOut.length ? 'Remove sold-out items' : 'Stall paused'} kind="light" disabled block />;

  return (
    <StackPage title="Your cart" footer={!wide ? cta : undefined}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, width: wide ? undefined : '100%', gap: 16 }}>
          <Animated.View entering={enterRise(0)}>
            <Press onPress={() => router.push(`/stall/${stall.id}`)} feedback="tap" scale={0.99} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: R.card, backgroundColor: C.card }, SHADOW.card]}>
              <Photo photo={stall.photo} width={64} style={{ width: 64, height: 64, borderRadius: 14 }} />
              <View style={{ flex: 1 }}>
                <T v="h3">{stall.name}</T>
                <T v="small" color={C.ink3}>{stall.location}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="small" color={C.ink3}>Ready in</T>
                <T v="h3" tab>~{etaMinutes(stall.avgPrepMin, live[stallId])} min</T>
              </View>
            </Press>
          </Animated.View>

          <Animated.View entering={enterRise(1)} style={[{ padding: 16, paddingVertical: 6, borderRadius: R.card, backgroundColor: C.card }, SHADOW.card]}>
            {Object.entries(qty).map(([id, n], i) => {
              const it = itemById[id];
              const gone = unavailable.has(id);
              return (
                <View key={id}>
                  {i > 0 && <Hairline />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                    <Photo photo={it.photo} width={52} style={{ width: 52, height: 52, borderRadius: 12, opacity: gone ? 0.4 : 1 }} />
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong" numberOfLines={2}>{it.name}</T>
                      <T v="small" color={gone ? C.chilli : unitPrice(id, deals) < it.price ? C.accent : C.ink3} tab>
                        {gone ? 'Just sold out' : unitPrice(id, deals) < it.price ? `Last call, ${rupees(unitPrice(id, deals))} each` : `${rupees(it.price)} each`}
                      </T>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Stepper qty={n} compact onAdd={() => useCart.getState().add(id)} onRemove={() => useCart.getState().remove(id)} />
                      <T v="price" tab>{rupees(n * unitPrice(id, deals))}</T>
                    </View>
                  </View>
                </View>
              );
            })}
          </Animated.View>

          <Animated.View entering={enterRise(2)} style={{ gap: 8 }}>
            <T v="label" color={C.ink2}>Note for the kitchen</T>
            <TextInput
              value={note}
              onChangeText={(t) => useCart.getState().setNote(t.slice(0, 200))}
              placeholder="Kam teekha, no onion, extra napkins"
              placeholderTextColor={C.ink3}
              multiline
              style={[{ minHeight: 78, borderRadius: R.input, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.card, padding: 14, fontFamily: F.regular, fontSize: 15, color: C.ink, textAlignVertical: 'top' }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            />
          </Animated.View>
        </View>

        <View style={{ width: wide ? 380 : '100%', gap: 16 }}>
          <Animated.View entering={enterRise(3)} style={{ gap: 10 }}>
            <T v="h3">How do you want to pay?</T>
            <PayOption active={payment === 'cod'} onPress={() => setPayment('cod')} icon="money-bold" title="Pay at counter" body="Cash ya UPI, at pickup." />
            <PayOption active={payment === 'online_demo'} onPress={() => setPayment('online_demo')} icon="device-mobile-bold" title="Pay online" body="UPI or card now. Demo checkout, no money moves." />
          </Animated.View>

          <Animated.View entering={enterRise(4)} style={[{ padding: 18, borderRadius: R.card, backgroundColor: C.card, gap: 10 }, SHADOW.card]}>
            <Row label={`Item total (${count})`} value={rupees(total)} />
            <Row label="Platform fee" value="₹0" muted />
            <Hairline />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T v="h2">To pay</T>
              <T v="h2" tab>{rupees(total)}</T>
            </View>
          </Animated.View>
          {wide && cta}
          <T v="small" color={C.ink3} center>No delivery. You walk up, show the code, skip the line.</T>
        </View>
      </View>

      <Sheet visible={full} onClose={closeFull} title="Kitchen full">
        <T v="h2" style={{ marginTop: 4 }}>{fullLine(stall)}</T>
        <T v="body" color={C.ink2} style={{ marginTop: 10, lineHeight: 22 }}>
          {stall.name} hit its order cap a moment ago. Your cart is saved. Try again in about {freeSlotMinutes(stall.avgPrepMin)} min, or pick another stall.
        </T>
        <Button label="See other stalls" kind="dark" onPress={() => { closeFull(); router.replace('/home'); }} block style={{ marginTop: 22 }} />
      </Sheet>
    </StackPage>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T v="body" color={C.ink2}>{label}</T>
      <T v="bodyStrong" tab color={muted ? C.ink3 : C.ink}>{value}</T>
    </View>
  );
}
