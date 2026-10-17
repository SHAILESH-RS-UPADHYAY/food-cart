import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { fx } from '@/lib/feedback';

import { CSS_EASE_OUT } from './motion';
import { SHADOW } from './theme';

export type Feedback = keyof typeof fx | 'none';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Sound + haptic on commit (press-out). Firing on press-in would click every time a list scroll starts. */
  feedback?: Feedback;
  scale?: number;
  /** subtle lift on hover (web, pointer devices) */
  hover?: boolean;
  /** spatial hover: raise the surface this many px with a deeper shadow (cards) */
  lift?: number;
};

// How this element sits in its parent belongs on the Pressable; how it looks belongs on the inner view.
const OUTER = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'position', 'top', 'left', 'right', 'bottom', 'zIndex', 'width', 'minWidth', 'maxWidth'] as const;

function split(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = { ...flat };
  for (const k of OUTER) {
    if (flat[k] === undefined) continue;
    outer[k] = flat[k];
    if (k !== 'width' && k !== 'minWidth' && k !== 'maxWidth') delete inner[k];
  }
  if (typeof flat.width === 'string') inner.width = '100%';
  if (outer.flex !== undefined || outer.flexGrow !== undefined) inner.flexGrow = 1;
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

/**
 * Every tappable thing: 3% scale-down on press-in (CSS transition, no worklet), sound on commit.
 * The Animated.View carries the visual style so the label and icons scale with it.
 */
export function Press({ style, children, feedback = 'tap', scale = 0.97, hover = true, lift = 1, onPress, onPressIn, onPressOut, disabled, ...rest }: Props) {
  const [down, setDown] = useState(false);
  const [over, setOver] = useState(false);
  const { outer, inner } = split(style);
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      hitSlop={rest.hitSlop ?? 6}
      pressRetentionOffset={16}
      onPress={(e) => {
        if (feedback !== 'none') fx[feedback]();
        onPress?.(e);
      }}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      onHoverIn={Platform.OS === 'web' && hover ? () => setOver(true) : undefined}
      onHoverOut={Platform.OS === 'web' && hover ? () => setOver(false) : undefined}
      style={[outer, Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as ViewStyle) : null]}
    >
      <Animated.View
        style={[
          inner,
          {
            transform: [{ translateY: over && !down ? -lift : 0 }, { scale: down ? scale : 1 }],
            transitionProperty: lift > 1 ? ['transform', 'boxShadow' as never] : 'transform',
            transitionDuration: down ? 100 : 160,
            transitionTimingFunction: CSS_EASE_OUT,
          },
          lift > 1 && over && !down && SHADOW.lift,
          disabled && { opacity: 0.45 },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
