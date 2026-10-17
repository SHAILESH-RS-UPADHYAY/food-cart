import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, TextInput, View } from 'react-native';
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
import { Button } from '@/ui/Button';
import { useCookiePrefs } from '@/ui/CookieConsent';
import { Field } from '@/ui/Field';
import { Icon, type IconName } from '@/ui/Icon';
import { enterRise } from '@/ui/motion';
import { Press } from '@/ui/Press';
import { Column } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { Toggle } from '@/ui/Toggle';
import { C, F, R } from '@/ui/theme';

function Row({ icon, title, body, right, onPress, danger }: { icon: IconName; title: string; body?: string; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? C.chilliSoft : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={danger ? C.chilli : C.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="bodyStrong" color={danger ? C.chilli : C.ink}>{title}</T>
        {body && <T v="small" color={C.ink3}>{body}</T>}
      </View>
      {right ?? (onPress ? <Icon name="caret-right-bold" size={15} color={C.ink4} /> : null)}
    </View>
  );
  return onPress ? <Press onPress={onPress} feedback="tap" scale={0.99}>{inner}</Press> : inner;
}

function Group({ title, children, index }: { title: string; children: ReactNode; index: number }) {
  const rows = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Animated.View entering={enterRise(index)} style={{ marginTop: 26 }}>
      <T v="label" color={C.ink3} style={{ marginBottom: 8, marginLeft: 4 }}>{title.toUpperCase()}</T>
      <View style={{ backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 14 }}>
        {rows.map((r, i) => (
          <View key={i}>
            {i > 0 && <Hairline style={{ marginLeft: 52 }} />}
            {r}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function Me() {
  const pad = useTabInsets();
  const { desktop } = useLayout();
  const user = useSession((s) => s.user);
  const settings = useSettings();
  const orders = useMyOrders() ?? [];
  const [sheet, setSheet] = useState<null | 'edit' | 'pay' | 'report' | 'delete'>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [report, setReport] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const done = orders.filter((o) => o.status === 'collected');
  const spent = done.reduce((n, o) => n + o.total, 0);
  const student = isStudentEmail(user?.email);
  const contact = user?.phone ? `+91 ${prettyPhone(user.phone)}` : user?.email ?? '';

  const saveName = async () => {
    if (name.trim().length < 2) return fx.error();
    setBusy(true);
    try {
      useSession.getState().setUser(await api.setName(name));
      fx.success();
      toast('Profile updated', 'check-bold', 'leaf');
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.deleteAccount();
      useCart.getState().clear();
      useSession.getState().setUser(null);
      setSheet(null);
      toast('Account deleted. See you around!', 'check-bold');
      router.replace('/login');
    } catch {
      fx.error();
      toast('Could not delete the account right now', 'warning-bold', 'chilli');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom }}>
        <Column style={{ maxWidth: 720 }}>
          <Animated.View entering={enterRise(0)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: desktop ? 28 : 10 }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <T v="brand" size={32} color={C.onAccent}>{(user?.name || '?').slice(0, 1).toLowerCase()}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="h1" numberOfLines={1}>{user?.name || 'Student'}</T>
              <T v="body" color={C.ink3} numberOfLines={1}>{contact}</T>
              {student && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <Icon name="seal-check-fill" size={15} color={C.accent} />
                  <T v="label" color={C.accent}>CU student verified</T>
                </View>
              )}
            </View>
            <Button label="Edit" kind="light" size="sm" icon="note-pencil-bold" onPress={() => { setName(user?.name ?? ''); fx.open(); setSheet('edit'); }} feedback="none" />
          </Animated.View>

          <Animated.View entering={enterRise(1)} style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
            {[
              { k: 'Tokens collected', v: String(done.length) },
              { k: 'Spent on campus', v: rupees(spent) },
              { k: 'Queue time saved', v: `~${done.length * 15} min` },
            ].map((s) => (
              <View key={s.k} style={{ flex: 1, padding: 14, borderRadius: R.card, backgroundColor: C.card }}>
                <T v="h2" tab>{s.v}</T>
                <T v="small" color={C.ink3} style={{ marginTop: 2 }}>{s.k}</T>
              </View>
            ))}
          </Animated.View>

          <Group title="Your account" index={2}>
            <Row icon="receipt-bold" title="Order history" body="Tokens, receipts and reorders" onPress={() => router.navigate('/orders')} />
            <Row icon="heart-bold" title="Favourites" body="Stalls and dishes you love" onPress={() => router.navigate('/likes')} />
            <Row icon="credit-card-bold" title="Payment methods" body="Pay at counter, UPI and cards" onPress={() => { fx.open(); setSheet('pay'); }} />
          </Group>

          <Group title="Preferences" index={3}>
            <Row icon="bell-ringing-bold" title="Order alerts" body="Chime and banner when your token is ready" right={<Toggle label="Order alerts" value={settings.alerts} onChange={(v) => settings.set({ alerts: v })} />} />
            <Row icon="speaker-high-bold" title="Sounds" body="Taps, pills and the order-ready chime" right={<Toggle label="Sounds" value={settings.sound} onChange={(v) => { settings.set({ sound: v }); if (v) fx.pill(); }} />} />
            {Platform.OS !== 'web' && <Row icon="vibrate-bold" title="Haptics" body="Gentle taps on your phone" right={<Toggle label="Haptics" value={settings.haptics} onChange={(v) => settings.set({ haptics: v })} />} />}
          </Group>

          <Group title="Help" index={4}>
            <Row icon="info-bold" title="Help and FAQs" body="Pickup, payments, last call deals" onPress={() => router.push('/help')} />
            <Row icon="warning-bold" title="Report a problem" body="Wrong item, cold food, app trouble" onPress={() => { setReport(''); fx.open(); setSheet('report'); }} />
            <Row icon="envelope-simple-bold" title="Contact support" body="support@foodcart.app" onPress={() => Linking.openURL('mailto:support@foodcart.app?subject=Food%20Cart%20help')} />
          </Group>

          <Group title="Legal" index={5}>
            <Row icon="shield-check-bold" title="Privacy policy" onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
            <Row icon="note-pencil-bold" title="Terms of use" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
            {Platform.OS === 'web' && <Row icon="cookie-bold" title="Cookie preferences" onPress={() => useCookiePrefs.getState().show()} />}
            <Row icon="image-bold" title="Photo credits and licences" onPress={() => router.push('/credits')} />
          </Group>

          {api.mode === 'demo' && (
            <Group title="Demo controls" index={6}>
              <Row icon="robot-bold" title="Kitchen autopilot" body="Stalls accept and cook your demo orders" right={<Toggle label="Kitchen autopilot" value={settings.autopilot} onChange={(v) => settings.set({ autopilot: v })} />} />
              <Row icon="ticket-bold" title="Replay the intro" onPress={() => { settings.set({ onboarded: false }); router.replace('/onboarding'); }} />
              <Row icon="arrows-clockwise-bold" title="Reset demo data" body="Fresh campus, fresh orders, fresh deals" onPress={() => { resetDemo(); useCart.getState().clear(); toast('Demo reset. Fresh campus, fresh orders.', 'arrows-clockwise-bold'); }} />
            </Group>
          )}

          <Group title="For stall staff" index={7}>
            <Row icon="storefront-bold" title="Open the stall console" body="Live board, order cap, last call" onPress={() => router.push('/staff/login')} />
          </Group>

          <Group title="Session" index={8}>
            <Row icon="sign-out-bold" title="Log out" onPress={async () => { await useSession.getState().signOut(); router.replace('/login'); }} />
            <Row icon="trash-bold" title="Delete account" body="Permanently remove your profile" danger onPress={() => { setConfirm(''); fx.open(); setSheet('delete'); }} />
          </Group>

          <View style={{ alignItems: 'center', marginTop: 30, gap: 4 }}>
            <T v="small" color={C.ink3}>Food Cart 1.0.0{api.mode === 'demo' ? ' (demo build)' : ''}</T>
            <T v="small" color={C.ink4}>Made for the CU lunch rush</T>
          </View>
        </Column>
      </ScrollView>

      <Sheet visible={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit profile">
        <View style={{ gap: 16 }}>
          <Field label="First name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={24} onSubmitEditing={saveName} />
          <View style={{ gap: 6 }}>
            <T v="label" color={C.ink2}>{user?.phone ? 'Mobile number' : 'Email'}</T>
            <View style={{ height: 52, borderRadius: R.input, backgroundColor: C.card, justifyContent: 'center', paddingHorizontal: 16 }}>
              <T v="bodyStrong" color={C.ink3}>{contact}</T>
            </View>
            <T v="small" color={C.ink3}>This is how you log in, so it can't be changed here.</T>
          </View>
          <Button label="Save" onPress={saveName} loading={busy} block feedback="none" />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'pay'} onClose={() => setSheet(null)} title="Payment methods">
        <View style={{ gap: 12 }}>
          {[
            { icon: 'money-bold' as const, t: 'Pay at counter', d: 'Cash or any UPI app when you collect. Always available.' },
            { icon: 'device-mobile-bold' as const, t: 'UPI in the app', d: api.mode === 'demo' ? 'Demo checkout for now. Live UPI arrives with the payments launch.' : 'Pay with any UPI app at checkout.' },
            { icon: 'credit-card-bold' as const, t: 'Debit and credit cards', d: 'Visa, Mastercard and RuPay at checkout.' },
          ].map((m) => (
            <View key={m.t} style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: R.input, backgroundColor: C.card }}>
              <Icon name={m.icon} size={20} color={C.accent} />
              <View style={{ flex: 1 }}>
                <T v="bodyStrong">{m.t}</T>
                <T v="small" color={C.ink3}>{m.d}</T>
              </View>
            </View>
          ))}
        </View>
      </Sheet>

      <Sheet visible={sheet === 'report'} onClose={() => setSheet(null)} title="Report a problem">
        <View style={{ gap: 14 }}>
          <T v="body" color={C.ink2}>Tell us what went wrong. If it's about an order, add the token number.</T>
          <TextInput
            value={report}
            onChangeText={setReport}
            multiline
            placeholder="Token #047 at HR Cafe: got a cappuccino instead of cold coffee"
            placeholderTextColor={C.ink3}
            style={[{ minHeight: 110, borderRadius: R.input, backgroundColor: C.card, padding: 14, fontFamily: F.regular, fontSize: 15, color: C.ink, textAlignVertical: 'top' }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
          />
          <Button label="Send" disabled={report.trim().length < 6} onPress={() => { setSheet(null); fx.success(); toast("Thanks. We'll look into it today.", 'check-bold', 'leaf'); }} block feedback="none" />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'delete'} onClose={() => setSheet(null)} title="Delete account">
        <View style={{ gap: 14 }}>
          <T v="body" color={C.ink2} style={{ lineHeight: 22 }}>
            This removes your profile, favourites and saved cart. Past orders stay with the stalls without your name, for their records. You can't undo this.
          </T>
          <Field label='Type "DELETE" to confirm' value={confirm} onChangeText={setConfirm} autoCapitalize="characters" placeholder="DELETE" />
          <Button label="Delete my account" kind="danger" icon="trash-bold" disabled={confirm.trim().toUpperCase() !== 'DELETE'} loading={busy} onPress={deleteAccount} block />
          <Button label="Keep my account" kind="quiet" onPress={() => setSheet(null)} block />
        </View>
      </Sheet>
    </View>
  );
}
