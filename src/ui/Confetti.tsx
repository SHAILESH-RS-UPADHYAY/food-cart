import { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { C } from './theme';

const COLORS = [C.haldi, C.haldi, C.chalk, C.leaf, C.chilli, C.ink];
const COUNT = 44;
const DURATION = 2200;

type P = { vx: number; vy: number; spin: number; color: string; w: number; h: number; round: boolean; delay: number };

/** One shared clock, real projectile physics per piece: up and out, then gravity and spin. */
function Piece({ t, p, ox, oy }: { t: SharedValue<number>; p: P; ox: number; oy: number }) {
  const style = useAnimatedStyle(() => {
    const s = Math.max(0, t.get() * (DURATION / 1000) - p.delay);
    const x = p.vx * s;
    const y = p.vy * s + 0.5 * 1500 * s * s;
    return {
      opacity: s <= 0 ? 0 : Math.max(0, 1 - Math.max(0, s - 1.2) / 0.8),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.spin * s}deg` }, { scaleX: Math.cos(p.spin * s * 0.03) }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: ox - p.w / 2, top: oy - p.h / 2, width: p.w, height: p.h, borderRadius: p.round ? p.w : 2, backgroundColor: p.color }, style]}
    />
  );
}

/** Burst from a point (default: upper-middle of the screen). Renders nothing under reduced motion. */
export function Confetti({ origin }: { origin?: { x: number; y: number } }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const pieces = useMemo<P[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (-90 + (Math.random() - 0.5) * 130) * (Math.PI / 180);
        const speed = 520 + Math.random() * 560;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          spin: (Math.random() - 0.5) * 900,
          color: COLORS[i % COLORS.length],
          w: 7 + Math.random() * 6,
          h: 9 + Math.random() * 9,
          round: i % 5 === 0,
          delay: Math.random() * 0.12,
        };
      }),
    [],
  );
  useEffect(() => {
    t.set(withTiming(1, { duration: DURATION, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
  }, []);
  if (reduced) return null;
  const ox = origin?.x ?? width / 2;
  const oy = origin?.y ?? height * 0.42;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
      {pieces.map((p, i) => <Piece key={i} t={t} p={p} ox={ox} oy={oy} />)}
    </View>
  );
}
