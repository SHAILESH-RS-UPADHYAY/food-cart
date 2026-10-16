import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { fx } from '@/lib/feedback';
import { useLikes } from '@/store/likes';

import { Icon } from './Icon';
import { CSS_EASE_OUT } from './motion';
import { Press } from './Press';
import { C } from './theme';

const BEAT = { '0%': { transform: [{ scale: 1 }] }, '30%': { transform: [{ scale: 1.32 }] }, '60%': { transform: [{ scale: 0.92 }] }, '100%': { transform: [{ scale: 1 }] } };
const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];

/** Heart with a beat and a six-spark burst on like. Burst replays per like via a changing key. */
export function LikeButton({ kind, id, size = 22, onPhoto }: { kind: 'stalls' | 'items'; id: string; size?: number; onPhoto?: boolean }) {
  const liked = useLikes((s) => s[kind].includes(id));
  const toggle = useLikes((s) => s.toggle);
  const [beat, setBeat] = useState(0);
  const box = size + 18;
  return (
    <Press
      feedback="none"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Remove from favourites' : 'Add to favourites'}
      onPress={() => {
        const now = toggle(kind, id);
        if (now) setBeat((b) => b + 1);
        (now ? fx.like : fx.unlike)();
      }}
      style={{
        width: box, height: box, borderRadius: box / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: onPhoto ? 'rgba(20,20,20,0.5)' : 'transparent',
      }}
    >
      {liked && beat > 0 && (
        <View key={beat} pointerEvents="none" style={{ position: 'absolute', width: box, height: box }}>
          {SPARK_ANGLES.map((a) => (
            <Animated.View
              key={a}
              style={{
                position: 'absolute', left: box / 2 - 2.5, top: box / 2 - 2.5, width: 5, height: 5, borderRadius: 3,
                backgroundColor: a % 120 === 0 ? C.haldi : C.chilli,
                animationName: {
                  from: { opacity: 1, transform: [{ rotate: `${a}deg` }, { translateY: 0 }, { scale: 1 }] },
                  to: { opacity: 0, transform: [{ rotate: `${a}deg` }, { translateY: -box * 0.62 }, { scale: 0.4 }] },
                },
                animationDuration: '520ms', animationTimingFunction: CSS_EASE_OUT, animationFillMode: 'forwards',
              }}
            />
          ))}
        </View>
      )}
      <Animated.View
        key={liked ? `on${beat}` : 'off'}
        style={liked && beat > 0 ? { animationName: BEAT, animationDuration: '420ms', animationTimingFunction: CSS_EASE_OUT } : undefined}
      >
        <Icon name={liked ? 'heart-fill' : 'heart-bold'} size={size} color={liked ? C.chilli : onPhoto ? C.chalk : C.ink} />
      </Animated.View>
    </Press>
  );
}
