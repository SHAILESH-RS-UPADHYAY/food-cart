import Animated from 'react-native-reanimated';

import { fx } from '@/lib/feedback';

import { CSS_EASE_OUT } from './motion';
import { Press } from './Press';
import { C } from './theme';

/** A switch in the brand: ultramarine track when on. State change is a 180 ms transition. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Press
      feedback="none"
      scale={0.94}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => {
        fx.tick();
        onChange(!value);
      }}
    >
      <Animated.View style={{ width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: value ? C.accent : C.line, transitionProperty: 'backgroundColor', transitionDuration: 180 }}>
        <Animated.View
          style={{
            width: 26, height: 26, borderRadius: 13, backgroundColor: C.canvas,
            transform: [{ translateX: value ? 20 : 0 }],
            transitionProperty: ['transform', 'backgroundColor'], transitionDuration: 180, transitionTimingFunction: CSS_EASE_OUT,
          }}
        />
      </Animated.View>
    </Press>
  );
}
