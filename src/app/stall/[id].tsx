import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, ScrollView, View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useStalls, useUnavailable } from '@/api';
import { etaMinutes, freeSlotMinutes, stallState } from '@/api/rules';
import { itemsOf, stallById, type Category } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { rupees } from '@/lib/format';
import { useLayout } from '@/lib/layout';
import { cartSummary, useCart } from '@/store/cart';
import { useNotify } from '@/store/notify';
import { CapacityMeter, Hairline, StatusChip } from '@/ui/bits';
import { Button } from '@/ui/Button';
import { CartBar } from '@/ui/CartBar';
import { fullLine, ItemRow } from '@/ui/cards';
import { Icon } from '@/ui/Icon';
import { LikeButton } from '@/ui/LikeButton';
import { enterRise } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Pill } from '@/ui/Pill';
import { ReplaceCartSheet } from '@/ui/ReplaceCartSheet';
import { BackButton, Column } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { toast } from '@/ui/Toast';
import { C, R, SHADOW } from '@/ui/theme';

const sticky = (top: number) => (Platform.OS === 'web' ? ({ position: 'sticky', top } as unknown as ViewStyle) : null);

export default function StallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stall = stallById[id];
  const live = useStalls()[id];
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  const { width, desktop, tablet } = useLayout();
  const cartStall = useCart((s) => s.stallId);
  const qty = useCart((s) => s.qty);
  const watching = useNotify((s) => s.stalls.includes(id));
  const [conflict, setConflict] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const scroller = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const sectionY = useRef<number[]>([]);
  const offsets = useSharedValue<number[]>([]);
  const y = useSharedValue(0);

  const items = useMemo(() => (stall ? itemsOf(stall.id) : []), [stall]);
  const sections = useMemo(() => {
    const map = new Map<Category, typeof items>();
    for (const it of items) map.set(it.category, [...(map.get(it.category) ?? []), it]);
    return [...map.entries()];
  }, [items]);

  const heroH = desktop ? 380 : tablet ? 340 : 300;
  const compactH = insets.top + 108;

  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });
  useAnimatedReaction(
    () => {
      const o = offsets.get();
      let i = 0;
      for (let k = 0; k < o.length; k++) if (y.get() + compactH + 24 >= o[k]) i = k;
      return i;
    },
    (i, prev) => {
      if (i !== prev) scheduleOnRN(setActive, i);
    },
  );

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.get() > 0 ? y.get() * 0.45 : y.get() },
      { scale: y.get() < 0 ? 1 + -y.get() / heroH : 1 },
    ],
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [heroH - 160, heroH - 90], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.get(), [heroH - 160, heroH - 90], [-10, 0], Extrapolation.CLAMP) }],
  }));

  if (!stall) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: C.canvas }}>
        <T v="h2">This stall moved out.</T>
        <Button label="Back to all stalls" onPress={() => router.replace('/home')} kind="dark" size="md" />
      </View>
    );
  }

  const state = stallState(live);
  const blocked = state === 'full' || state === 'paused' || state === 'closed';
  const { count, total } = cartSummary(cartStall === id ? qty : {});

  const jump = (i: number) => {
    fx.pill();
    setActive(i);
    scroller.current?.scrollTo({ y: Math.max(0, (sectionY.current[i] ?? 0) - compactH - 8), animated: true });
  };

  const tabs = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
      {sections.map(([cat, list], i) => <Pill key={cat} label={cat} count={list.length} active={active === i} onPress={() => jump(i)} />)}
    </ScrollView>
  );

  const menuW = desktop ? Math.min(width, 1180) - 64 - 380 - 32 : width;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: heroH + 40 }, heroStyle]}>
        <Photo photo={stall.photo} width={width} priority="high" style={{ width: '100%', height: '100%' }} alt={stall.name} />
        <LinearGradient colors={['rgba(20,20,20,0.35)', 'rgba(20,20,20,0)', 'rgba(20,20,20,0.7)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', inset: 0 }} />
      </Animated.View>

      <Animated.ScrollView ref={scroller} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom + (count && !desktop ? 120 : 48) }}>
        <View style={{ height: heroH - 28 }}>
          <Column style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 46 }}>
            <Animated.View entering={enterRise(0)}>
              <StatusChip state={state} pulse onDark />
              <T v="display" color={C.chalk} style={{ marginTop: 10, ...(desktop ? { fontSize: 56, lineHeight: 58, letterSpacing: -2.4 } : null) }}>{stall.name}</T>
              <T v="body" color="rgba(244,244,239,0.85)" style={{ fontSize: 16, marginTop: 4 }}>{stall.tagline}</T>
            </Animated.View>
          </Column>
        </View>

        <View style={{ backgroundColor: C.canvas, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingTop: 22, minHeight: 600 }}>
          <Column style={{ flexDirection: desktop ? 'row' : 'column', gap: 32, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, width: desktop ? undefined : '100%' }}>
              <Animated.View entering={enterRise(1)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Meta icon="clock-bold" label={`~${etaMinutes(stall.avgPrepMin, live)} min`} />
                <Meta icon="map-pin-bold" label={stall.location} />
                <Meta icon="leaf-fill" label="Pure veg" tint={C.leaf} />
              </Animated.View>

              <Animated.View entering={enterRise(2)} style={[{ marginTop: 18, padding: 18, borderRadius: R.card, backgroundColor: state === 'full' ? C.chilliSoft : C.card }, state === 'full' ? null : SHADOW.card]}>
                {state === 'full' ? (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Icon name="fire-fill" size={22} color={C.chilli} />
                      <T v="h3" color={C.chilli}>Kitchen full</T>
                    </View>
                    <T v="h2">{fullLine(stall)}</T>
                    <T v="body" color={C.ink2}>
                      {live?.maxActive} orders are cooking, the cap this stall set to keep food hot and fast. A slot usually opens in about {freeSlotMinutes(stall.avgPrepMin)} min.
                    </T>
                    <CapacityMeter active={live?.active ?? 0} max={live?.maxActive ?? 1} state={state} />
                    <Button
                      label={watching ? "We'll ping you" : 'Notify me when there is room'}
                      icon="bell-ringing-bold"
                      kind={watching ? 'light' : 'dark'}
                      size="md"
                      disabled={watching}
                      onPress={() => {
                        useNotify.getState().watch(stall.id);
                        toast(`We'll ping you when ${stall.name} has room`, 'bell-ringing-bold');
                      }}
                    />
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <T v="h3">Kitchen load</T>
                      <T v="small" color={C.ink3} tab>{live?.active ?? 0} of {live?.maxActive ?? stall.maxActive} orders cooking</T>
                    </View>
                    <CapacityMeter active={live?.active ?? 0} max={live?.maxActive ?? stall.maxActive} state={state} />
                    <T v="small" color={C.ink3}>
                      {state === 'busy' ? 'Filling up fast. Order now to lock your slot.' : state === 'paused' ? 'The stall paused new orders for a bit.' : 'Plenty of room in the kitchen.'}
                    </T>
                  </View>
                )}
              </Animated.View>

              <View style={{ marginTop: 24, marginBottom: 4 }}>{tabs}</View>

              {sections.map(([cat, list], si) => (
                <View key={cat} onLayout={(e) => {
                  sectionY.current[si] = e.nativeEvent.layout.y + heroH - 28 + 22;
                  offsets.set([...sectionY.current]);
                }}>
                  <T v="h2" style={{ marginTop: 26 }}>{cat}</T>
                  <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap', columnGap: 28 }}>
                    {list.map((item, i) => (
                      <View key={item.id} style={{ width: desktop ? (menuW - 28) / 2 : '100%' }}>
                        {(desktop ? i > 1 : i > 0) && <Hairline />}
                        <ItemRow item={item} unavailable={unavailable.has(item.id)} blocked={blocked} onConflict={setConflict} />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {desktop && (
              <View style={[{ width: 380, padding: 22, borderRadius: R.card, backgroundColor: C.card, gap: 14 }, SHADOW.card, sticky(96)]}>
                <T v="h2">Your order</T>
                {count ? (
                  <>
                    {Object.entries(qty).map(([itemId, n]) => {
                      const it = items.find((x) => x.id === itemId);
                      return it ? (
                        <View key={itemId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                          <T v="body" style={{ flex: 1 }} numberOfLines={1}>{n} × {it.name}</T>
                          <T v="bodyStrong" tab>{rupees(n * it.price)}</T>
                        </View>
                      ) : null;
                    })}
                    <Hairline />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <T v="h3">To pay</T>
                      <T v="h3" tab>{rupees(total)}</T>
                    </View>
                    <Button label="Review and order" iconRight="arrow-right-bold" onPress={() => router.push('/cart')} feedback="open" block />
                  </>
                ) : (
                  <T v="body" color={C.ink3}>Add a dish and it shows up here. Pickup in about {etaMinutes(stall.avgPrepMin, live)} min.</T>
                )}
              </View>
            )}
          </Column>
        </View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: compactH, backgroundColor: C.canvas, borderBottomWidth: 1, borderBottomColor: C.line }, compactStyle]}>
        <Column style={{ paddingTop: insets.top + 8, gap: 8 }}>
          <View style={{ height: 42, justifyContent: 'center', paddingLeft: 54, paddingRight: 54 }}>
            <T v="h3" numberOfLines={1}>{stall.name}</T>
          </View>
          {tabs}
        </Column>
      </Animated.View>

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}>
        <Column style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton onPhoto />
          <LikeButton kind="stalls" id={stall.id} onPhoto />
        </Column>
      </View>

      {!desktop && <CartBar bottom={insets.bottom + 14} />}
      <ReplaceCartSheet itemId={conflict} onClose={() => setConflict(null)} />
    </View>
  );
}

function Meta({ icon, label, tint = C.ink2 }: { icon: 'clock-bold' | 'map-pin-bold' | 'leaf-fill'; label: string; tint?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
      <Icon name={icon} size={15} color={tint} />
      <T v="label" color={C.ink} style={{ fontSize: 13 }}>{label}</T>
    </View>
  );
}
