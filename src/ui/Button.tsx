import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Press, type Feedback } from './Press';
import { T } from './Text';
import { C } from './theme';

type Kind = 'primary' | 'dark' | 'light' | 'ghost' | 'quiet' | 'danger';

const KIND: Record<Kind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.accent, fg: C.onAccent },
  dark: { bg: C.ink, fg: C.chalk },
  light: { bg: C.card, fg: C.ink, border: C.line },
  ghost: { bg: 'transparent', fg: C.ink, border: C.ink },
  quiet: { bg: 'transparent', fg: C.ink },
  danger: { bg: C.chilliSoft, fg: C.chilli },
};

type Props = {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  feedback?: Feedback;
  style?: StyleProp<ViewStyle>;
  /** stretch to the container width */
  block?: boolean;
};

/** Three dots that breathe while a request runs (no generic spinner). */
function Dots({ color }: { color: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % 3), 220);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, height: 20, alignItems: 'center' }}>
      {[0, 1, 2].map((k) => (
        <View key={k} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: k === i ? 1 : 0.3 }} />
      ))}
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', size = 'lg', icon, iconRight, loading, disabled, feedback = 'press', style, block }: Props) {
  const k = KIND[kind];
  const h = size === 'lg' ? 54 : size === 'md' ? 46 : 36;
  const solid = kind === 'primary' || kind === 'dark';
  return (
    <Press
      onPress={loading ? undefined : onPress}
      disabled={disabled}
      feedback={loading ? 'none' : feedback}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.base,
        { height: h, backgroundColor: k.bg, paddingHorizontal: size === 'sm' ? 14 : 22 },
        solid && TACTILE,
        k.border && { borderWidth: 1.5, borderColor: k.border },
        block && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {solid && (
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']} locations={[0, 0.6]} style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} />
      )}
      {loading ? (
        <Dots color={k.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} color={k.fg} />}
          <T v={size === 'sm' ? 'label' : 'bodyStrong'} color={k.fg} numberOfLines={1} style={size === 'lg' && { fontSize: 16 }}>
            {label}
          </T>
          {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 20} color={k.fg} />}
        </>
      )}
    </Press>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
});

/** Skeuomorphic touch: an inner top light and a soft cast shadow, so solid buttons read as pressable. */
const TACTILE = Platform.select({
  web: { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(17,17,17,0.2), 0 6px 14px -6px rgba(17,17,17,0.45)' },
  default: { shadowColor: C.ink, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
}) as ViewStyle;
