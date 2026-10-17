import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { fx } from '@/lib/feedback';
import { isStudentEmail } from '@/lib/format';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { enterRise } from '@/ui/motion';
import { T } from '@/ui/Text';
import { PaperGrid } from '@/ui/Surface';
import { C, R } from '@/ui/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const user = useSession((s) => s.user);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = name.trim().length >= 2;

  const save = async () => {
    if (!ok) return fx.error();
    setBusy(true);
    try {
      useSession.getState().setUser(await api.setName(name));
      router.replace('/home');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.canvas }}>
      <PaperGrid />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 440, flex: 1, justifyContent: 'center', gap: 26 }}>
          <Animated.View entering={enterRise(0)}>
            {isStudentEmail(user?.email) && (
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: R.pill, backgroundColor: C.card, marginBottom: 18 }}>
                <Icon name="seal-check-fill" size={16} color={C.accent} />
                <T v="label" color={C.ink}>CU student verified</T>
              </View>
            )}
            <T v="display" color={C.ink}>What name goes *on your token?*</T>
            <T v="body" color={C.ink3} style={{ marginTop: 10, fontSize: 16 }}>Your first name goes on every token, so the counter knows it's yours.</T>
          </Animated.View>
          <Animated.View entering={enterRise(1)}>
            <Field label="First name" value={name} onChangeText={setName} placeholder="Simran" autoCapitalize="words" autoComplete="given-name" autoFocus onSubmitEditing={save} maxLength={24} />
          </Animated.View>
          <Animated.View entering={enterRise(2)}>
            <Button label="Let's eat" iconRight="arrow-right-bold" onPress={save} loading={busy} disabled={!ok} block />
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
