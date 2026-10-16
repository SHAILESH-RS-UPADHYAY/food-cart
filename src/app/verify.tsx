import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, ApiError, type AuthTarget } from '@/api';
import { fx } from '@/lib/feedback';
import { prettyPhone } from '@/lib/format';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { OtpBoxes } from '@/ui/Field';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Press } from '@/ui/Press';
import { BackButton } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C } from '@/ui/theme';

const SHAKE = { '0%': { transform: [{ translateX: 0 }] }, '20%': { transform: [{ translateX: -10 }] }, '40%': { transform: [{ translateX: 9 }] }, '60%': { transform: [{ translateX: -6 }] }, '80%': { transform: [{ translateX: 4 }] }, '100%': { transform: [{ translateX: 0 }] } };

export default function Verify() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();
  const target: AuthTarget = params.phone ? { kind: 'phone', phone: params.phone } : { kind: 'email', email: params.email ?? '' };
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [shakes, setShakes] = useState(0);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async (value = code) => {
    if (value.length < 6 || busy) return;
    setBusy(true);
    try {
      const user = await api.verifyCode(target, value);
      useSession.getState().setUser(user);
      fx.success();
      router.replace(user.name ? '/home' : '/welcome');
    } catch (e) {
      fx.error();
      setError(true);
      setShakes((s) => s + 1);
      setCode('');
      if (!(e instanceof ApiError) || e.code !== 'BAD_CODE') console.warn(e);
    } finally {
      setBusy(false);
    }
  };

  const to = target.kind === 'phone' ? `+91 ${prettyPhone(target.phone)}` : target.email;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 440, flex: 1 }}>
          <BackButton fallback="/login" />
          <View style={{ flex: 1, justifyContent: 'center', gap: 28, paddingVertical: 28 }}>
            <Animated.View entering={enterRise(0)}>
              <T v="display" color={C.ink}>Code daalo.</T>
              <T v="body" color={C.ink3} style={{ marginTop: 10, fontSize: 16 }}>
                Sent to <T v="bodyStrong" color={C.ink}>{to}</T>
              </T>
            </Animated.View>
            <Animated.View entering={enterRise(1)}>
              <Animated.View key={shakes} style={shakes ? { animationName: SHAKE, animationDuration: '380ms', animationTimingFunction: CSS_EASE_OUT } : undefined}>
                <OtpBoxes
                  value={code}
                  error={error}
                  onChange={(v) => {
                    if (v.length > code.length) fx.tick();
                    setError(false);
                    setCode(v);
                    if (v.length === 6) verify(v);
                  }}
                />
              </Animated.View>
              <T v="small" color={error ? C.chilli : C.ink3} style={{ marginTop: 12 }}>
                {error ? 'Code match nahi hua. Try again.' : api.mode === 'demo' ? 'Demo code: 123456' : 'The code expires in 10 minutes.'}
              </T>
            </Animated.View>
            <Animated.View entering={enterRise(2)} style={{ gap: 14 }}>
              <Button label="Verify" onPress={() => verify()} loading={busy} disabled={code.length < 6} block />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Press onPress={() => router.back()} feedback="tap">
                  <T v="label" color={C.ink3}>{target.kind === 'phone' ? 'Wrong number?' : 'Wrong email?'}</T>
                </Press>
                <Press
                  disabled={wait > 0}
                  feedback="tap"
                  onPress={async () => {
                    setWait(30);
                    await api.sendCode(target).catch(() => {});
                  }}
                >
                  <T v="label" color={wait > 0 ? C.ink3 : C.accent} tab>{wait > 0 ? `Resend in 0:${String(wait).padStart(2, '0')}` : 'Resend code'}</T>
                </Press>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
