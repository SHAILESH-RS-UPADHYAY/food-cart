import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api, useMyOrders } from '@/api';
import { resetDemo } from '@/api/demo';
import { fx } from '@/lib/feedback';
import { isStudentEmail, prettyPhone, rupees } from '@/lib/format';
import { useLayout, useTabInsets } from '@/lib/layout';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { useSettings } from '@/store/settings';
import { Hairline } from '@/ui/bits';
import { Icon, type IconName } from '@/ui/Icon';
import { enterRise } from '@/ui/motion';
import { Press } from '@/ui/Press';
import { Column } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { Toggle } from '@/ui/Toggle';
import { C, R, SHADOW } from '@/ui/theme';

function Row({ icon, title, body, right, onPress, danger }: { icon: IconName; title: string; body?: string; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: danger ? C.chilliSoft : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={danger ? C.chilli : C.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="bodyStrong" color={danger ? C.chilli : C.ink}>{title}</T>
        {body && <T v="small" color={C.ink3}>{body}</T>}
      </View>
      {right ?? (onPress ? <Icon name="caret-right-bold" size={16} color={C.ink4} /> : null)}
    </View>
  );
  return onPress ? <Press onPress={onPress} feedback="tap" scale={0.99}>{inner}</Press> : inner;
}

function Group({ children, index }: { children: ReactNode; index: number }) {
  return (
    <Animated.View entering={enterRise(index)} style={[{ backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 16, marginTop: 16 }, SHADOW.card]}>
      {children}
    </Animated.View>
  );
}

export default function Me() {
  const pad = useTabInsets();
  const { desktop } = useLayout();
  const user = useSession((s) => s.user);
  const settings = useSettings();
  const orders = useMyOrders() ?? [];
  const done = orders.filter((o) => o.status === 'collected');
  const spent = done.reduce((n, o) => n + o.total, 0);
  const student = isStudentEmail(user?.email);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.canvas }} contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom }}>
      <Column style={{ maxWidth: 760 }}>
        <Animated.View entering={enterRise(0)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: desktop ? 28 : 10 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.haldi, alignItems: 'center', justifyContent: 'center' }}>
            <T v="brand" size={34}>{(user?.name || '?').slice(0, 1).toLowerCase()}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="h1">{user?.name || 'Student'}</T>
            <T v="body" color={C.ink2}>{user?.phone ? `+91 ${prettyPhone(user.phone)}` : user?.email}</T>
            {student && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Icon name="seal-check-fill" size={15} color={C.leaf} />
                <T v="label" color={C.leaf}>CU student verified</T>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={enterRise(1)} style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {[
            { k: 'Tokens collected', v: String(done.length) },
            { k: 'Spent on campus', v: rupees(spent) },
            { k: 'Queue time saved', v: `~${done.length * 15} min` },
          ].map((s) => (
            <View key={s.k} style={[{ flex: 1, padding: 14, borderRadius: R.card, backgroundColor: C.card }, SHADOW.card]}>
              <T v="h2" tab>{s.v}</T>
              <T v="small" color={C.ink3} style={{ marginTop: 2 }}>{s.k}</T>
            </View>
          ))}
        </Animated.View>

        <Group index={2}>
          <Row icon="speaker-high-bold" title="Sounds" body="Taps, pills and the order-ready chime" right={<Toggle label="Sounds" value={settings.sound} onChange={(v) => { settings.set({ sound: v }); if (v) fx.pill(); }} />} />
          <Hairline />
          <Row icon="vibrate-bold" title="Haptics" body="Gentle taps on your phone" right={<Toggle label="Haptics" value={settings.haptics} onChange={(v) => settings.set({ haptics: v })} />} />
          {api.mode === 'demo' && (
            <>
              <Hairline />
              <Row icon="robot-bold" title="Demo kitchen autopilot" body="Stalls accept and cook your demo orders on their own" right={<Toggle label="Demo kitchen autopilot" value={settings.autopilot} onChange={(v) => settings.set({ autopilot: v })} />} />
            </>
          )}
        </Group>

        <Group index={3}>
          <Row icon="storefront-bold" title="Stall staff console" body="Run a stall's live order board" onPress={() => router.push('/staff/login')} />
          <Hairline />
          <Row icon="ticket-bold" title="Replay the intro" body="See how Food Cart works again" onPress={() => { settings.set({ onboarded: false }); router.replace('/onboarding'); }} />
          <Hairline />
          <Row icon="image-bold" title="Photo credits" onPress={() => router.push('/credits')} />
          {api.mode === 'demo' && (
            <>
              <Hairline />
              <Row icon="arrows-clockwise-bold" title="Reset demo data" body="Clears demo orders and stall settings" onPress={() => { resetDemo(); useCart.getState().clear(); toast('Demo reset. Fresh campus, fresh orders.', 'arrows-clockwise-bold'); }} />
            </>
          )}
        </Group>

        <Group index={4}>
          <Row icon="sign-out-bold" title="Log out" danger onPress={async () => { await useSession.getState().signOut(); router.replace('/login'); }} />
        </Group>

        <T v="small" color={C.ink3} center style={{ marginTop: 28 }}>Food Cart for Chandigarh University. Made for the lunch rush.</T>
      </Column>
    </ScrollView>
  );
}
