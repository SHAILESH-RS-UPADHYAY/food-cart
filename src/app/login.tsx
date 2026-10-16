import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { fx } from '@/lib/feedback';
import { isStudentEmail } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Lockup } from '@/ui/Logo';
import { enterRise } from '@/ui/motion';
import { Pill } from '@/ui/Pill';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { C, R } from '@/ui/theme';

type Mode = 'phone' | 'student' | 'email';

const MODES: { key: Mode; label: string }[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'student', label: 'CU email' },
  { key: 'email', label: 'Other email' },
];

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export default function Login() {
  const insets = useSafeAreaInsets();
  const { desktop } = useLayout();
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const phoneOk = /^[6-9]\d{9}$/.test(phone);
  const emailOk = mode === 'student' ? isStudentEmail(email) && validEmail(email) : validEmail(email);
  const ok = mode === 'phone' ? phoneOk : emailOk;

  const submit = async () => {
    if (!ok) {
      fx.error();
      setError(mode === 'phone' ? 'Enter your 10-digit mobile number' : mode === 'student' ? 'Use your @cuchd.in email' : 'That email looks off');
      return;
    }
    setBusy(true);
    setError(undefined);
    const target = mode === 'phone' ? { kind: 'phone' as const, phone } : { kind: 'email' as const, email: email.trim().toLowerCase() };
    try {
      await api.sendCode(target);
      router.push({ pathname: '/verify', params: target.kind === 'phone' ? { phone } : { email: target.email } });
    } catch (e) {
      fx.error();
      setError(e instanceof Error ? e.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 440, flex: 1 }}>
          <Animated.View entering={enterRise(0)}>
            <Lockup size={40} />
          </Animated.View>
          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: desktop ? 40 : 28, gap: 26 }}>
            <Animated.View entering={enterRise(1)}>
              <T v="display" color={C.ink}>Bas number daalo.</T>
              <T v="body" color={C.ink3} style={{ marginTop: 10, fontSize: 16 }}>
                {mode === 'phone' ? "We'll text a 6-digit code. No passwords to remember." : "We'll email a 6-digit code. No passwords to remember."}
              </T>
            </Animated.View>

            <Animated.View entering={enterRise(2)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MODES.map((m) => (
                <Pill key={m.key} label={m.label} active={mode === m.key} onPress={() => { setMode(m.key); setError(undefined); }} />
              ))}
            </Animated.View>

            <Animated.View entering={enterRise(3)}>
              {mode === 'phone' ? (
                <Field
                  label="Mobile number"
                  prefix="+91"
                  value={phone}
                  onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(undefined); }}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  onSubmitEditing={submit}
                  error={error}
                  autoFocus={Platform.OS === 'web'}
                />
              ) : (
                <Field
                  label={mode === 'student' ? 'CU student email' : 'Email'}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(undefined); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder={mode === 'student' ? '23bcs10421@cuchd.in' : 'you@gmail.com'}
                  onSubmitEditing={submit}
                  error={error}
                  hint={mode === 'student' ? 'Student emails get a verified badge at the counter.' : undefined}
                />
              )}
            </Animated.View>

            <Animated.View entering={enterRise(4)} style={{ gap: 14 }}>
              <Button label="Send code" iconRight="arrow-right-bold" onPress={submit} loading={busy} block />
              {api.mode === 'demo' && (
                <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.input, backgroundColor: C.card }}>
                  <Icon name="info-bold" size={18} color={C.accent} />
                  <T v="small" color={C.ink3} style={{ flex: 1 }}>Demo build: any valid number or email works. The code is 123456.</T>
                </View>
              )}
            </Animated.View>
          </View>

          <Press onPress={() => router.push('/staff/login')} feedback="tap" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48 }}>
            <Icon name="storefront-bold" size={18} color={C.ink3} />
            <T v="label" color={C.ink3}>Stall staff? Open the console</T>
          </Press>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
