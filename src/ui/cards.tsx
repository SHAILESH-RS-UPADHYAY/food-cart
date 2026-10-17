import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDeals, type Deal, type StallLive } from '@/api';
import { etaMinutes, freeSlotMinutes, liveDeal, percentOff, stallState } from '@/api/rules';
import { stallById, type Item, type Stall } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { clock, rupees } from '@/lib/format';
import { useCart } from '@/store/cart';

import { CapacityMeter, StatusChip, TagChip, VegMark } from './bits';
import { Icon } from './Icon';
import { LikeButton } from './LikeButton';
import { Photo } from './Photo';
import { Press } from './Press';
import { Stepper } from './Stepper';
import { T } from './Text';
import { toast } from './Toast';
import { C, R, SHADOW } from './theme';

export const FULL_LINES = [
  (n: number) => `Kitchen's full. Give it ${n} min, then try again.`,
  () => "Every burner's busy. The chef says hold that thought.",
  (n: number) => `No room on the grill. A slot opens in ${n} min.`,
];
export const fullLine = (stall: Stall) => FULL_LINES[stall.id.length % FULL_LINES.length](freeSlotMinutes(stall.avgPrepMin));

/** Big stall card: photo with scrim, live state, ETA, location, kitchen load. */
export function StallCard({ stall, live, width }: { stall: Stall; live?: StallLive; width: number }) {
  const state = stallState(live);
  const h = Math.round(width * 0.56);
  return (
    <Press onPress={() => router.push(`/stall/${stall.id}`)} feedback="open" scale={0.985} lift={4} accessibilityRole="link" accessibilityLabel={`${stall.name}, ${state}`}
      style={[{ width, borderRadius: R.card, backgroundColor: C.card, overflow: 'hidden' }, SHADOW.card]}>
      <View style={{ height: h }}>
        <Photo photo={stall.photo} width={width} style={{ width, height: h }} alt={stall.name} />
        <LinearGradient colors={['rgba(20,20,20,0)', 'rgba(20,20,20,0.82)']} locations={[0.35, 1]} style={{ position: 'absolute', inset: 0 }} />
        {(state === 'full' || state === 'paused' || state === 'closed') && <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,20,20,0.45)' }} />}
        <View style={{ position: 'absolute', top: 12, left: 12 }}><StatusChip state={state} onDark /></View>
        <View style={{ position: 'absolute', top: 6, right: 6 }}><LikeButton kind="stalls" id={stall.id} onPhoto size={20} /></View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
          <T v="h1" color={C.chalk} numberOfLines={1}>{stall.name}</T>
          <T v="body" color="rgba(244,244,239,0.82)" numberOfLines={1}>{state === 'full' ? fullLine(stall) : stall.tagline}</T>
        </View>
      </View>
      <View style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="clock-bold" size={16} color={C.ink2} />
            <T v="bodyStrong" tab>~{etaMinutes(stall.avgPrepMin, live)} min</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Icon name="map-pin-bold" size={16} color={C.ink3} />
            <T v="small" color={C.ink3} numberOfLines={1} style={{ flex: 1 }}>{stall.location}</T>
          </View>
          {live && <T v="label" color={C.ink3} tab>{live.active}/{live.maxActive}</T>}
        </View>
        {live && <CapacityMeter active={live.active} max={live.maxActive} state={state} />}
      </View>
    </Press>
  );
}

/** Compact rail card: the ETA is the headline. */
export function StallMini({ stall, live, width = 210 }: { stall: Stall; live?: StallLive; width?: number }) {
  const state = stallState(live);
  return (
    <Press onPress={() => router.push(`/stall/${stall.id}`)} feedback="open" scale={0.97} accessibilityLabel={stall.name} style={{ width }}>
      <Photo photo={stall.photo} width={width} style={{ width, height: Math.round(width * 0.62), borderRadius: 18 }} alt={stall.name} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
        <T v="h2" tab>~{etaMinutes(stall.avgPrepMin, live)} min</T>
        <T v="label" color={state === 'busy' ? C.masala : C.leaf}>{state === 'busy' ? 'Busy' : 'Open'}</T>
      </View>
      <T v="body" color={C.ink2} numberOfLines={1}>{stall.name}</T>
    </Press>
  );
}

/** Menu row. Adding from a different stall asks before replacing the cart. */
export function ItemRow({ item, unavailable, blocked, showStall, onConflict }: {
  item: Item; unavailable?: boolean; blocked?: boolean; showStall?: boolean; onConflict: (itemId: string) => void;
}) {
  const qty = useCart((s) => s.qty[item.id] ?? 0);
  const deal = liveDeal(useDeals()[item.id]);
  const [delta, setDelta] = useState<1 | -1>(1);
  const add = () => {
    setDelta(1);
    if (deal && qty >= deal.left) {
      fx.error();
      toast(`Only ${deal.left} left at the last-call price`, 'hourglass-high-bold');
      return;
    }
    if (!useCart.getState().add(item.id)) {
      fx.error();
      onConflict(item.id);
    }
  };
  return (
    <View style={{ flexDirection: 'row', gap: 14, paddingVertical: 16 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <VegMark />
          {item.tags?.map((t) => <TagChip key={t} tag={t} />)}
        </View>
        <T v="h3" numberOfLines={2} color={unavailable ? C.ink3 : C.ink}>{item.name}</T>
        {showStall && <T v="small" color={C.ink3}>{stallById[item.stallId].name}</T>}
        {deal ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <T v="price" tab color={C.accent}>{rupees(deal.price)}</T>
            <T v="small" tab color={C.ink4} style={{ textDecorationLine: 'line-through' }}>{rupees(item.price)}</T>
            <T v="label" color={C.masala}>{deal.left} left</T>
          </View>
        ) : (
          <T v="price" tab color={unavailable ? C.ink3 : C.ink}>{rupees(item.price)}</T>
        )}
        <T v="small" color={C.ink3} numberOfLines={2}>{item.description}</T>
      </View>
      <View style={{ width: 118, alignItems: 'center' }}>
        <View style={{ opacity: unavailable ? 0.45 : 1 }}>
          <Photo photo={item.photo} width={118} style={{ width: 118, height: 108, borderRadius: R.thumb }} alt={item.name} />
          <View style={{ position: 'absolute', top: 2, right: 2 }}><LikeButton kind="items" id={item.id} size={15} onPhoto /></View>
        </View>
        <View style={{ marginTop: -19 }}>
          <Stepper
            qty={qty}
            lastDelta={delta}
            disabled={unavailable || (blocked && qty === 0)}
            disabledLabel={unavailable ? 'Sold out' : 'Full'}
            onAdd={add}
            onRemove={() => { setDelta(-1); useCart.getState().remove(item.id); }}
            compact
          />
        </View>
      </View>
    </View>
  );
}

/** Last-call card: a leftover dish at a lower price, limited plates, ends soon. */
export function DealCard({ item, deal, width = 208, blocked, onConflict }: { item: Item; deal: Deal; width?: number; blocked?: boolean; onConflict: (itemId: string) => void }) {
  const qty = useCart((s) => s.qty[item.id] ?? 0);
  const [delta, setDelta] = useState<1 | -1>(1);
  const h = Math.round(width * 0.66);
  const add = () => {
    setDelta(1);
    if (qty >= deal.left) {
      fx.error();
      toast(`Only ${deal.left} left`, 'hourglass-high-bold');
      return;
    }
    if (!useCart.getState().add(item.id)) {
      fx.error();
      onConflict(item.id);
    }
  };
  return (
    <View style={{ width, borderRadius: R.card, backgroundColor: C.card, overflow: 'hidden' }}>
      <Press onPress={() => router.push(`/stall/${item.stallId}`)} feedback="open" scale={0.985} accessibilityLabel={`${item.name}, last call deal`}>
        <Photo photo={item.photo} width={width} style={{ width, height: h }} alt={item.name} />
        <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, height: 26, borderRadius: R.pill, backgroundColor: C.saffron, justifyContent: 'center' }}>
          <T v="label" color={C.ink} tab>{percentOff(item.price, deal.price)}% off</T>
        </View>
      </Press>
      <View style={{ padding: 12, gap: 4 }}>
        <T v="h3" numberOfLines={1}>{item.name}</T>
        <T v="small" color={C.ink3} numberOfLines={1}>{stallById[item.stallId].name}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <T v="h2" tab color={C.accent}>{rupees(deal.price)}</T>
              <T v="small" tab color={C.ink4} style={{ textDecorationLine: 'line-through' }}>{rupees(item.price)}</T>
            </View>
            <T v="label" color={C.masala} tab>{deal.left} left, till {clock(deal.endsAt)}</T>
          </View>
          <Stepper qty={qty} compact lastDelta={delta} disabled={blocked && qty === 0} disabledLabel="Full" onAdd={add}
            onRemove={() => { setDelta(-1); useCart.getState().remove(item.id); }} />
        </View>
      </View>
    </View>
  );
}
