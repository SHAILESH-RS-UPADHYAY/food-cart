import { Redirect, router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, useStalls } from '@/api';
import { etaMinutes, stallState } from '@/api/rules';
import { STALLS } from '@/data/catalog';
import { useLayout } from '@/lib/layout';
import { useSession } from '@/store/session';
import { CapacityMeter, StatusChip } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { CartMark } from '@/ui/Logo';
import { enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { Toggle } from '@/ui/Toggle';
import { C, R, SHADOW } from '@/ui/theme';

/** Campus at a glance: every stall's live load, with a switch and a door into its console. */
export default function Admin() {
  const user = useSession((s) => s.user);
  const live = useStalls();
  const insets = useSafeAreaInsets();
  const { width, desktop, tablet } = useLayout();
  if (!user) return <Redirect href="/staff/login" />;
  if (user.role !== 'admin') return <Redirect href="/" />;

  const all = Object.values(live);
  const cooking = all.reduce((n, s) => n + s.active, 0);
  const capacity = all.reduce((n, s) => n + s.maxActive, 0);
  const open = all.filter((s) => s.status === 'open').length;
  const full = all.filter((s) => stallState(s) === 'full').length;
  const cols = desktop ? 3 : tablet ? 2 : 1;
  const pad = desktop ? 32 : 18;
  const cardW = (Math.min(width, 1280) - pad * 2 - (cols - 1) * 16) / cols;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 10, paddingBottom: 22 }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: pad, gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CartMark size={34} awning={C.haldi} stripe={C.chalk} cart={C.chalk} />
            <T v="h2" color={C.chalk} style={{ flex: 1 }}>Campus overview</T>
            <Press onPress={async () => { await useSession.getState().signOut(); router.replace('/staff/login'); }} feedback="tap" accessibilityLabel="Sign out" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.night2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sign-out-bold" size={18} color={C.chalk} />
            </Press>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
            {[
              { k: 'Orders cooking', v: `${cooking}`, s: `of ${capacity} campus capacity` },
              { k: 'Stalls open', v: `${open}/${STALLS.length}`, s: full ? `${full} at full capacity` : 'All kitchens have room' },
            ].map((m) => (
              <View key={m.k}>
                <T v="small" color={C.nightMuted}>{m.k}</T>
                <T v="display" color={C.chalk} tab>{m.v}</T>
                <T v="small" color={C.nightMuted}>{m.s}</T>
              </View>
            ))}
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: pad, paddingTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {STALLS.map((s, i) => {
            const l = live[s.id];
            const state = stallState(l);
            return (
              <Animated.View key={s.id} entering={enterRise(i)} style={[{ width: cardW, borderRadius: R.card, backgroundColor: C.card, overflow: 'hidden' }, SHADOW.card]}>
                <View style={{ flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' }}>
                  <Photo photo={s.photo} width={56} style={{ width: 56, height: 56, borderRadius: 14 }} />
                  <View style={{ flex: 1 }}>
                    <T v="h3" numberOfLines={1}>{s.name}</T>
                    <T v="small" color={C.ink3} tab>~{etaMinutes(s.avgPrepMin, l)} min wait</T>
                  </View>
                  <StatusChip state={state} />
                </View>
                <View style={{ paddingHorizontal: 14, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T v="small" color={C.ink3}>Kitchen load</T>
                    <T v="label" tab>{l?.active ?? 0}/{l?.maxActive ?? s.maxActive}</T>
                  </View>
                  <CapacityMeter active={l?.active ?? 0} max={l?.maxActive ?? s.maxActive} state={state} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
                  <Toggle label={`${s.name} taking orders`} value={l?.status === 'open'} onChange={(v) => api.updateStall(s.id, { status: v ? 'open' : 'paused' })} />
                  <T v="small" color={C.ink2} style={{ flex: 1 }}>{l?.status === 'open' ? 'Taking orders' : 'Paused'}</T>
                  <Button label="Console" size="sm" kind="light" iconRight="arrow-up-right-bold" onPress={() => router.push({ pathname: '/staff', params: { stall: s.id } })} />
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
