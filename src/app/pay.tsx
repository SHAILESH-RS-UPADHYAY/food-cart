import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, cubicBezier } from 'react-native-reanimated';

import { stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { rupees } from '@/lib/format';
import { usePlaceOrder } from '@/lib/place-order';
import { useCart, useCartSummary } from '@/store/cart';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Pill } from '@/ui/Pill';
import { StackPage } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R, SHADOW } from '@/ui/theme';

type Method = 'upi' | 'card';
type Phase = 'form' | 'processing' | 'paid' | 'failed';

const HANDLES = ['@okaxis', '@ybl', '@paytm', '@okhdfcbank'];
const BOUNCE = cubicBezier(0.34, 1.56, 0.64, 1);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cardDigits = (s: string) => s.replace(/\D/g, '').slice(0, 16);
const prettyCard = (s: string) => cardDigits(s).replace(/(.{4})/g, '$1 ').trim();
const prettyExpiry = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Demo checkout: shows the future online-payment flow. Nothing is charged, ever. */
export default function Pay() {
  const stallId = useCart((s) => s.stallId);
  const { total } = useCartSummary();
  const { place } = usePlaceOrder();
  const [method, setMethod] = useState<Method>('upi');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string>();

  const upiOk = /^[\w.-]{2,}@[a-z]{2,}$/i.test(upi.trim());
  const cardOk = cardDigits(card).length === 16 && /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) && /^\d{3}$/.test(cvv);
  const ok = method === 'upi' ? upiOk : cardOk;

  if (!stallId) {
    return (
      <StackPage title="Checkout">
        <T v="body" color={C.ink2}>Nothing to pay for. Your cart is empty.</T>
      </StackPage>
    );
  }

  const pay = async () => {
    if (!ok) {
      fx.error();
      setError(method === 'upi' ? 'Enter a UPI ID like name@okaxis' : 'Check the card number, expiry and CVV');
      return;
    }
    setError(undefined);
    setPhase('processing');
    await wait(2300);
    if (method === 'upi' && /fail/i.test(upi)) {
      fx.error();
      setPhase('failed');
      return;
    }
    fx.coin();
    setPhase('paid');
    await wait(1100);
    try {
      await place('online_demo');
    } catch {
      setPhase('form');
    }
  };

  if (phase !== 'form') {
    return (
      <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 22 }}>
        <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'processing' && [0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: C.accent, opacity: 0,
                animationName: { from: { opacity: 0.7, transform: [{ scale: 0.55 }] }, to: { opacity: 0, transform: [{ scale: 1.15 }] } },
                animationDuration: '1500ms', animationDelay: i * 500, animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT,
              }}
            />
          ))}
          <Animated.View
            key={phase}
            style={{
              width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
              backgroundColor: phase === 'paid' ? C.leaf : phase === 'failed' ? C.chilli : C.accent,
              animationName: { from: { transform: [{ scale: 0.6 }] }, to: { transform: [{ scale: 1 }] } },
              animationDuration: '420ms', animationTimingFunction: BOUNCE,
            }}
          >
            <Icon name={phase === 'paid' ? 'check-bold' : phase === 'failed' ? 'x-bold' : 'lock-simple-bold'} size={40} color={C.chalk} />
          </Animated.View>
        </View>
        <Animated.View key={`t-${phase}`} entering={FadeIn.duration(200)} style={{ alignItems: 'center', gap: 8, maxWidth: 360 }}>
          <T v="h1" color={C.ink} center>
            {phase === 'processing' ? (method === 'upi' ? 'Approve in your UPI app' : 'Talking to your bank') : phase === 'paid' ? `${rupees(total)} paid` : 'Payment failed'}
          </T>
          <T v="body" color={C.ink3} center>
            {phase === 'processing' ? `Request sent to ${method === 'upi' ? upi.trim() : `card ending ${cardDigits(card).slice(-4)}`}. Demo only, nothing is charged.`
              : phase === 'paid' ? `Sending your order to ${stallById[stallId].name}.`
              : 'Your bank declined this one. No money left your account.'}
          </T>
        </Animated.View>
        {phase === 'failed' && (
          <View style={{ width: '100%', maxWidth: 360, gap: 10 }}>
            <Button label="Try again" onPress={() => setPhase('form')} block />
            <Button label="Pay at counter instead" kind="quiet" onPress={() => router.back()} block style={{ backgroundColor: C.card }} />
          </View>
        )}
      </View>
    );
  }

  return (
    <StackPage title="Checkout" footer={<Button label={`Pay ${rupees(total)}`} icon="lock-simple-bold" onPress={pay} block />}>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 18 }}>
        <Animated.View entering={enterRise(0)} style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.input, backgroundColor: C.accentTint }}>
          <Icon name="info-bold" size={18} />
          <T v="small" style={{ flex: 1 }}>Demo checkout. This shows how paying online will work. No real payment is made.</T>
        </Animated.View>

        <Animated.View entering={enterRise(1)} style={[{ padding: 20, borderRadius: R.card, backgroundColor: C.card, gap: 4 }, SHADOW.card]}>
          <T v="small" color={C.ink3}>Paying {stallById[stallId].name} via Food Cart</T>
          <T v="display" tab>{rupees(total)}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Icon name="shield-check-bold" size={16} color={C.leaf} />
            <T v="small" color={C.leaf}>Secured payment. Refunded automatically if the stall can't take the order.</T>
          </View>
        </Animated.View>

        <Animated.View entering={enterRise(2)} style={{ flexDirection: 'row', gap: 8 }}>
          <Pill label="UPI" icon="device-mobile-bold" active={method === 'upi'} onPress={() => { setMethod('upi'); setError(undefined); }} />
          <Pill label="Card" icon="credit-card-bold" active={method === 'card'} onPress={() => { setMethod('card'); setError(undefined); }} />
        </Animated.View>

        <Animated.View key={method} entering={enterRise(0)} style={{ gap: 14 }}>
          {method === 'upi' ? (
            <>
              <Field label="UPI ID" value={upi} onChangeText={(t) => { setUpi(t.trim()); setError(undefined); }} placeholder="yourname@okaxis" autoCapitalize="none" keyboardType="email-address" error={error} onSubmitEditing={pay} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {HANDLES.map((h) => (
                  <Pill key={h} label={h} onPress={() => setUpi(`${upi.split('@')[0] || 'simran'}${h}`)} />
                ))}
              </View>
              <T v="small" color={C.ink3}>Tip for the demo: a UPI ID with "fail" in it shows the failed-payment screen.</T>
            </>
          ) : (
            <>
              <Field label="Card number" value={prettyCard(card)} onChangeText={(t) => { setCard(cardDigits(t)); setError(undefined); }} placeholder="4111 1111 1111 1111" keyboardType="number-pad" maxLength={19} error={error} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Expiry" value={expiry} onChangeText={(t) => setExpiry(prettyExpiry(t))} placeholder="MM/YY" keyboardType="number-pad" maxLength={5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 3))} placeholder="123" keyboardType="number-pad" secureTextEntry maxLength={3} />
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </StackPage>
  );
}
