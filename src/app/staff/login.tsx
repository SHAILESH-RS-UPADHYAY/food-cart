import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { STALLS } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { useLayout } from '@/lib/layout';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Lockup } from '@/ui/Logo';
import { enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { BackButton } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R } from '@/ui/theme';

export default function StaffLogin() {
  const insets = useSafeAreaInsets();
  const { width, desktop, tablet } = useLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const enter = async (key: string, creds: Parameters<typeof api.staffSignIn>[0]) => {
    setBusy(key);
    setError(undefined);
    try {
      const user = await api.staffSignIn(creds);
      useSession.getState().setUser(user);
      fx.success();
      router.replace(user.role === 'admin' ? '/admin' : '/staff');
    } catch (e) {
      fx.error();
      setError(e instanceof Error ? e.message : 'Could not sign in');
    } finally {
      setBusy(null);
    }
  };

  const cols = desktop ? 4 : tablet ? 3 : 2;
  const tileW = (Math.min(width, 980) - 44 - (cols - 1) * 12) / cols;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.canvas }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, paddingHorizontal: 22, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 980, gap: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton fallback="/login" />
          <Lockup size={32} />
        </View>
        <Animated.View entering={enterRise(0)}>
          <T v="label" color={C.accent}>STALL CONSOLE</T>
          <T v="display" color={C.ink} style={{ marginTop: 6 }}>Run your counter from any screen.</T>
          <T v="body" color={C.ink3} style={{ marginTop: 8, fontSize: 16 }}>Phone, tablet or the laptop at the till. Orders arrive live with a chime.</T>
        </Animated.View>

        {api.mode === 'demo' ? (
          <>
            <Animated.View entering={enterRise(1)}>
              <T v="h3" color={C.ink} style={{ marginBottom: 12 }}>Pick your stall</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {STALLS.map((s) => (
                  <Press key={s.id} onPress={() => enter(s.id, { demoStallId: s.id })} feedback="tap" scale={0.97} style={{ width: tileW, borderRadius: R.card, overflow: 'hidden', backgroundColor: C.card }}>
                    <Photo photo={s.photo} width={tileW} style={{ width: tileW, height: tileW * 0.56 }} />
                    <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <T v="bodyStrong" color={C.ink} numberOfLines={1} style={{ flex: 1 }}>{s.name}</T>
                      {busy === s.id ? <T v="label" color={C.accent}>...</T> : <Icon name="arrow-right-bold" size={16} color={C.ink3} />}
                    </View>
                  </Press>
                ))}
              </View>
            </Animated.View>
            <Animated.View entering={enterRise(2)} style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.input, backgroundColor: C.card }}>
              <Icon name="info-bold" size={18} color={C.accent} />
              <T v="small" color={C.ink3} style={{ flex: 1 }}>Demo build: no password needed. With the live backend, each stall signs in with its staff email.</T>
            </Animated.View>
            <Button label="Open admin overview" kind="ghost" icon="chart-bar-bold" onPress={() => enter('admin', { demoAdmin: true })} loading={busy === 'admin'} style={{ borderColor: C.line, alignSelf: 'flex-start' }} />
          </>
        ) : (
          <Animated.View entering={enterRise(1)} style={{ gap: 16, maxWidth: 440 }}>
            <Field label="Staff email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="counter@hrcafe.in" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" error={error} onSubmitEditing={() => enter('pw', { email, password })} />
            <Button label="Sign in" onPress={() => enter('pw', { email, password })} loading={busy === 'pw'} block />
          </Animated.View>
        )}
        {api.mode === 'demo' && error && <T v="small" color={C.chilli}>{error}</T>}
      </View>
    </ScrollView>
  );
}
