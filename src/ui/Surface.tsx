import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { C } from './theme';

/** Graph-paper backdrop from the reference: faint 32px grid, fades nothing, costs one SVG. */
export function PaperGrid({ size = 32, color = C.grid }: { size?: number; color?: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="fc-grid" width={size} height={size} patternUnits="userSpaceOnUse">
            <Path d={`M${size} 0H0V${size}`} fill="none" stroke={color} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fc-grid)" />
      </Svg>
    </View>
  );
}

/**
 * Frosted glass: real blur (backdrop-filter on web, native blur on iOS/Android), a translucent
 * fill so text stays readable when blur is unavailable, a hairline edge and a top highlight.
 */
export function Glass({ children, style, dark, radius = 0 }: { children?: ReactNode; style?: ViewStyle | ViewStyle[]; dark?: boolean; radius?: number }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={Platform.OS === 'web' ? 40 : 60}
        tint={dark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          backgroundColor: dark ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.72)',
          borderRadius: radius, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,17,0.07)',
        }]}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radius / 2, right: radius / 2, height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)' }} />
      {children}
    </View>
  );
}
