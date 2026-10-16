import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useStalls, useUnavailable } from '@/api';
import { stallState } from '@/api/rules';
import { itemById, stallById } from '@/data/catalog';
import { useLayout, useTabInsets } from '@/lib/layout';
import { useLikes } from '@/store/likes';
import { Hairline } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { ItemRow, StallCard } from '@/ui/cards';
import { Icon } from '@/ui/Icon';
import { enterRise } from '@/ui/motion';
import { Pill } from '@/ui/Pill';
import { ReplaceCartSheet } from '@/ui/ReplaceCartSheet';
import { Column } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R, SHADOW } from '@/ui/theme';

export default function Likes() {
  const pad = useTabInsets();
  const { width, desktop, tablet } = useLayout();
  const stalls = useLikes((s) => s.stalls);
  const items = useLikes((s) => s.items);
  const live = useStalls();
  const unavailable = useUnavailable();
  const [tab, setTab] = useState<'items' | 'stalls'>('items');
  const [conflict, setConflict] = useState<string | null>(null);
  const cols = desktop ? 3 : tablet ? 2 : 1;
  const gutter = desktop ? 32 : tablet ? 28 : 18;
  const cardW = (Math.min(width, 1180) - gutter * 2 - (cols - 1) * 20) / cols;
  const list = tab === 'items' ? items.filter((id) => itemById[id]) : stalls.filter((id) => stallById[id]);

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom }}>
        <Column>
          <Animated.View entering={enterRise(0)} style={{ marginTop: desktop ? 28 : 10 }}>
            <T v="display">Your favourites</T>
          </Animated.View>
          <Animated.View entering={enterRise(1)} style={{ flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 18 }}>
            <Pill label="Dishes" icon="bowl-food-bold" count={items.length} active={tab === 'items'} onPress={() => setTab('items')} />
            <Pill label="Stalls" icon="storefront-bold" count={stalls.length} active={tab === 'stalls'} onPress={() => setTab('stalls')} />
          </Animated.View>

          {!list.length ? (
            <Animated.View key={tab} entering={enterRise(0)} style={{ alignItems: 'flex-start', gap: 12, marginTop: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.chilliSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart-fill" size={30} color={C.chilli} />
              </View>
              <T v="h2">Abhi kuch nahi.</T>
              <T v="body" color={C.ink2}>Tap the heart on any {tab === 'items' ? 'dish' : 'stall'} and it lands here for one-tap reordering.</T>
              <Button label="Explore stalls" kind="dark" size="md" onPress={() => router.navigate('/home')} />
            </Animated.View>
          ) : tab === 'items' ? (
            <View key="items" style={[{ backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 16 }, SHADOW.card]}>
              {list.map((id, i) => (
                <Animated.View key={id} entering={enterRise(i)}>
                  {i > 0 && <Hairline />}
                  <ItemRow item={itemById[id]} showStall unavailable={unavailable.has(id)}
                    blocked={['full', 'paused', 'closed'].includes(stallState(live[itemById[id].stallId]))} onConflict={setConflict} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View key="stalls" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
              {list.map((id, i) => (
                <Animated.View key={id} entering={enterRise(i)}>
                  <StallCard stall={stallById[id]} live={live[id]} width={cardW} />
                </Animated.View>
              ))}
            </View>
          )}
        </Column>
      </ScrollView>
      <ReplaceCartSheet itemId={conflict} onClose={() => setConflict(null)} />
    </View>
  );
}
