import { View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { StallState } from '@/api/rules';
import type { Tag } from '@/data/catalog';

import { Icon, type IconName } from './Icon';
import { CSS_EASE_OUT } from './motion';
import { T } from './Text';
import { C, R } from './theme';

/** India's veg mark: green square, green dot. */
export function VegMark({ size = 14 }: { size?: number }) {
  return (
    <View
      accessibilityLabel="Vegetarian"
      style={{ width: size, height: size, borderWidth: 1.5, borderColor: C.leaf, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: size * 0.45, height: size * 0.45, borderRadius: size, backgroundColor: C.leaf }} />
    </View>
  );
}

const STATE: Record<StallState, { label: string; fg: string; bg: string }> = {
  open: { label: 'Open', fg: C.leaf, bg: C.leafSoft },
  busy: { label: 'Busy', fg: C.masala, bg: C.masalaSoft },
  full: { label: 'Kitchen full', fg: C.chilli, bg: C.chilliSoft },
  paused: { label: 'Taking a break', fg: C.ink2, bg: C.line },
  closed: { label: 'Closed', fg: C.ink2, bg: C.line },
};

export const stateColor = (s: StallState) => STATE[s].fg;

/** Live stall state. The dot is semantic (real-time status), and only pulses when asked. */
export function StatusChip({ state, pulse, onDark }: { state: StallState; pulse?: boolean; onDark?: boolean }) {
  const s = STATE[state];
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: R.pill, backgroundColor: onDark ? 'rgba(21,22,28,0.62)' : s.bg }}>
      <View style={{ width: 8, height: 8 }}>
        {pulse && (
          <Animated.View
            style={{
              position: 'absolute', inset: 0, borderRadius: 4, backgroundColor: s.fg,
              animationName: { from: { opacity: 0.55, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scale: 2.6 }] } },
              animationDuration: '1400ms', animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT,
            }}
          />
        )}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: onDark && state === 'open' ? '#5BD38B' : s.fg }} />
      </View>
      <T v="label" color={onDark ? C.chalk : s.fg}>{s.label}</T>
    </View>
  );
}

const TICKS = 20;

/** Kitchen load as a ticket rail: 20 ticks, filled by live orders. */
export function CapacityMeter({ active, max, state, style }: { active: number; max: number; state: StallState; style?: ViewStyle }) {
  const filled = Math.min(TICKS, Math.round((active / Math.max(1, max)) * TICKS));
  const fill = state === 'full' ? C.chilli : state === 'busy' ? C.masala : C.leaf;
  return (
    <View style={[{ flexDirection: 'row', gap: 3 }, style]} accessibilityLabel={`${active} of ${max} orders cooking`}>
      {Array.from({ length: TICKS }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            flex: 1, height: 10, borderRadius: 3,
            backgroundColor: i < filled ? fill : C.line,
            transitionProperty: 'backgroundColor', transitionDuration: 300, transitionDelay: i * 12,
          }}
        />
      ))}
    </View>
  );
}

const TAG: Record<Tag, { label: string; icon: IconName; fg: string; bg: string }> = {
  bestseller: { label: 'Bestseller', icon: 'star-fill', fg: C.accent, bg: C.accentTint },
  spicy: { label: 'Spicy', icon: 'fire-fill', fg: C.chilli, bg: C.chilliSoft },
  new: { label: 'New', icon: 'sparkle-fill', fg: C.leaf, bg: C.leafSoft },
};

export function TagChip({ tag }: { tag: Tag }) {
  const t = TAG[tag];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: R.pill, backgroundColor: t.bg }}>
      <Icon name={t.icon} size={12} color={t.fg} />
      <T v="label" color={t.fg} style={{ fontSize: 11 }}>{t.label}</T>
    </View>
  );
}

export function Hairline({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: C.line }, style]} />;
}
