import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { fx } from '@/lib/feedback';

import { Icon } from './Icon';
import { SPRING_SNAP } from './motion';
import { T } from './Text';
import { C, R } from './theme';

const KNOB = 56;
const PAD = 5;

/**
 * Slide to place an order: a deliberate gesture for the one irreversible action in the app.
 * Velocity or distance commits; a detent haptic fires once when the threshold is crossed.
 */
export function SlideToConfirm({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const max = Math.max(1, width - KNOB - PAD * 2);

  useAnimatedReaction(
    () => x.get() > max * 0.82,
    (armed, was) => {
      if (was !== null && armed !== was) scheduleOnRN(fx.detent);
    },
    [max],
  );

  const pan = usePanGesture({
    enabled: !disabled,
    activeOffsetX: [-6, 6],
    onActivate: () => {
      'worklet';
      start.set(x.get());
    },
    onUpdate: (e) => {
      'worklet';
      x.set(Math.min(max, Math.max(0, start.get() + e.translationX)));
    },
    onDeactivate: (e) => {
      'worklet';
      if (x.get() + e.velocityX * 0.1 > max * 0.82) {
        x.set(withSpring(max, { ...SPRING_SNAP, overshootClamping: true, velocity: e.velocityX }));
        scheduleOnRN(onConfirm);
      } else {
        x.set(withSpring(0, { ...SPRING_SNAP, velocity: e.velocityX }));
      }
    },
  });

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const fill = useAnimatedStyle(() => ({ width: x.get() + KNOB + PAD }));
  const text = useAnimatedStyle(() => ({ opacity: interpolate(x.get(), [0, max * 0.5], [1, 0], Extrapolation.CLAMP) }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => !disabled && onConfirm()}
      style={{ height: KNOB + PAD * 2, borderRadius: R.pill, backgroundColor: disabled ? C.ink4 : C.accent, justifyContent: 'center', overflow: 'hidden' }}
    >
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: R.pill, backgroundColor: '#FFFFFF', opacity: 0.16 }, fill]} />
      <Animated.View style={[{ position: 'absolute', left: KNOB + 18, right: 18, alignItems: 'center' }, text]} pointerEvents="none">
        <T v="bodyStrong" color={C.chalk} numberOfLines={1} style={{ fontSize: 16 }}>{label}</T>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ position: 'absolute', left: PAD, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }, knob]}>
          <Icon name="arrow-right-bold" size={24} color={C.accent} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
