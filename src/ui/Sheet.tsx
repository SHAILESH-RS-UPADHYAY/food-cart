import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { fx } from '@/lib/feedback';
import { useLayout } from '@/lib/layout';

import { Icon } from './Icon';
import { EASE_OUT, SPRING_SHEET } from './motion';
import { Press } from './Press';
import { T } from './Text';
import { C, R } from './theme';

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode; dark?: boolean };

/**
 * Bottom sheet on phones (drag down or tap outside to close), centred dialog on desktop.
 * One shared value drives panel and backdrop so they can never drift apart.
 */
export function Sheet({ visible, onClose, title, children, dark }: Props) {
  const [mounted, setMounted] = useState(visible);
  const { height } = useWindowDimensions();
  const { desktop } = useLayout();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(height);
  const start = useSharedValue(0);
  const travel = desktop ? 40 : height;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      fx.open();
      y.set(travel);
      y.set(withSpring(0, SPRING_SHEET));
    } else if (mounted) {
      y.set(withTiming(travel, { duration: 200, easing: EASE_OUT }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      }));
    }
  }, [visible]);

  const close = () => {
    fx.close();
    onClose();
  };

  const pan = usePanGesture({
    enabled: !desktop,
    activeOffsetY: [-8, 8],
    onActivate: () => {
      'worklet';
      start.set(y.get());
    },
    onUpdate: (e) => {
      'worklet';
      const next = start.get() + e.translationY;
      y.set(next >= 0 ? next : next * 0.2);
    },
    onDeactivate: (e) => {
      'worklet';
      if (y.get() + e.velocityY * 0.12 > 140) {
        y.set(withSpring(travel, { ...SPRING_SHEET, dampingRatio: 1, overshootClamping: true, velocity: e.velocityY }));
        scheduleOnRN(close);
      } else {
        y.set(withSpring(0, { ...SPRING_SHEET, velocity: e.velocityY }));
      }
    },
  });

  const panel = useAnimatedStyle(() =>
    desktop
      ? { opacity: interpolate(y.get(), [0, travel], [1, 0], Extrapolation.CLAMP), transform: [{ translateY: y.get() * 0.4 }, { scale: interpolate(y.get(), [0, travel], [1, 0.97], Extrapolation.CLAMP) }] }
      : { transform: [{ translateY: Math.max(-24, y.get()) }] },
  );
  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(y.get(), [0, travel], [1, 0], Extrapolation.CLAMP) }));

  if (!mounted) return null;
  const bg = dark ? C.night : C.card;
  const fg = dark ? C.nightText : C.ink;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: C.scrim }, backdrop]}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
      </Animated.View>
      <View pointerEvents="box-none" style={{ flex: 1, justifyContent: desktop ? 'center' : 'flex-end', alignItems: 'center' }}>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              {
                width: '100%', maxWidth: desktop ? 520 : 680, maxHeight: desktop ? '86%' : '92%', backgroundColor: bg,
                borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet,
                borderBottomLeftRadius: desktop ? R.sheet : 0, borderBottomRightRadius: desktop ? R.sheet : 0,
                paddingBottom: desktop ? 20 : insets.bottom + 16,
              },
              panel,
            ]}
          >
            {!desktop && <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: dark ? C.night3 : C.line, marginTop: 10 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: desktop ? 20 : 12, paddingBottom: 6, gap: 12 }}>
              <T v="h2" color={fg} style={{ flex: 1 }}>{title}</T>
              <Press onPress={close} feedback="none" accessibilityLabel="Close" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: dark ? C.night2 : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x-bold" size={16} color={fg} />
              </Press>
            </View>
            <ScrollView bounces={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
