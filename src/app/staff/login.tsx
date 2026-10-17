import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { DEMO_TEAM } from '@/api/demo';
import { stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { useLayout } from '@/lib/layout';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon, type IconName } from '@/ui/Icon';
import { Lockup } from '@/ui/Logo';
import { enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { BackButton } from '@/ui/Screen';
import { PaperGrid } from '@/ui/Surface';
import { T } from '@/ui/Text';
import { C, R, SHADOW } from '@/ui/theme';

const POINTS: [IconName, string][] = [
  ['storefront-bold', 'One login per stall. Staff see only their own orders, menu, prices and deals.'],
  ['shield-check-bold', 'The server checks every action, so another stall stays locked even by link.'],
  ['lock-simple-bold', 'Five wrong passwords lock that login for 30 seconds.'],
];

type Account = (typeof DEMO_TEAM)[number];

export default function StaffLogin() {
  const insets = useSafeAreaInsets();
  const { desktop } = useLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [demoOpen, setDemoOpen] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      fx.error();
      return setError('Enter your staff email and password.');
    }
    setBusy(true);
    setError(undefined);
    try {
      const user = await api.staffSignIn({ email: email.trim(), password });
      useSession.getState().setUser(user);
      fx.success();
      router.replace(user.role === 'admin' ? '/admin' : '/staff');
    } catch (e) {
      fx.error();
      setError(e instanceof Error ? e.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const fill = (a: Account) => {
    fx.pill();
    setEmail(a.email);
    setPassword(a.password);
    setError(undefined);
  };

  const intro = (
    <Animated.View entering={enterRise(0)}>
      <T v="label" color={C.ink3} style={{ letterSpacing: 1.6 }}>TEAM SIGN IN</T>
      <T v="display" style={{ marginTop: 12 }}>{'Your stall.\n*Only your stall.*'}</T>
      <T v="body" color={C.ink3} style={{ marginTop: 12, maxWidth: 440 }}>
        Every stall has its own login. The Food Cart team signs in here too, for HQ.
      </T>
    </Animated.View>
  );

  const points = (
    <Animated.View entering={enterRise(2)} style={{ gap: 14 }}>
      {POINTS.map(([icon, text]) => (
        <View key={text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', maxWidth: 440 }}>
          <View style={[{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }, SHADOW.card]}>
            <Icon name={icon} size={16} color={C.ink} />
          </View>
          <T v="small" color={C.ink2} style={{ flex: 1 }}>{text}</T>
        </View>
      ))}
    </Animated.View>
  );

  const card = (
    <Animated.View entering={enterRise(1)} style={[{ width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: C.card, borderRadius: R.card + 4, padding: desktop ? 28 : 20, gap: 16 }, SHADOW.float]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <T v="h2">Sign in to your stall</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: R.pill, backgroundColor: C.leafSoft }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.live }} />
          <T v="label" color={C.leaf}>Kitchens online</T>
        </View>
      </View>
      <Field label="Staff email" value={email} onChangeText={(t) => { setEmail(t); setError(undefined); }} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" autoComplete="username" placeholder="counter@yourstall.in" />
      <Field label="Password" value={password} onChangeText={(t) => { setPassword(t); setError(undefined); }} secureTextEntry autoComplete="current-password"
        placeholder="Your password" onSubmitEditing={signIn} error={error} />
      <Button label="Sign in" icon="arrow-right-bold" onPress={signIn} loading={busy} block feedback="none" />
      {api.mode === 'demo' && <DemoLogins open={demoOpen} onToggle={() => setDemoOpen((o) => !o)} onPick={fill} />}
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <PaperGrid />
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32, paddingHorizontal: desktop ? 32 : 18, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 1080, flex: 1, gap: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <BackButton fallback="/login" />
            <Lockup size={30} tagline={false} />
          </View>
          {desktop ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 72, paddingBottom: 40 }}>
              <View style={{ flex: 1, gap: 30 }}>
                {intro}
                {points}
              </View>
              <View style={{ flex: 1 }}>{card}</View>
            </View>
          ) : (
            <>
              {intro}
              {card}
              {points}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Demo build only: the walkthrough accounts, one tap fills the form (nothing signs in by itself). */
function DemoLogins({ open, onToggle, onPick }: { open: boolean; onToggle: () => void; onPick: (a: Account) => void }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 }}>
      <Press onPress={onToggle} feedback="tap" hover={false} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <Icon name="users-three-bold" size={16} color={C.ink2} />
        <T v="label" color={C.ink2} style={{ flex: 1 }}>Demo logins for the walkthrough</T>
        <Icon name={open ? 'caret-up-bold' : 'caret-down-bold'} size={14} color={C.ink3} />
      </Press>
      {open && (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: 2 }}>
          {DEMO_TEAM.map((a) => {
            const s = a.stallId ? stallById[a.stallId] : undefined;
            return (
              <Press key={a.email} onPress={() => onPick(a)} feedback="none" hover={false} accessibilityLabel={`Use the ${s?.name ?? 'Food Cart HQ'} login`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 6, borderRadius: R.input }}>
                {s ? (
                  <Photo photo={s.photo} width={32} style={{ width: 32, height: 32, borderRadius: 8 }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="shield-check-bold" size={16} color={C.chalk} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{s?.name ?? 'Food Cart HQ (developers)'}</T>
                  <T v="small" color={C.ink3} numberOfLines={1} tab>{`${a.email}  ·  ${a.password}`}</T>
                </View>
                <T v="label" color={C.ink}>Use</T>
              </Press>
            );
          })}
          <T v="small" color={C.ink3} style={{ marginTop: 6, marginBottom: 2 }}>Tap a row to fill the form. Try a wrong password too.</T>
        </Animated.View>
      )}
    </View>
  );
}
