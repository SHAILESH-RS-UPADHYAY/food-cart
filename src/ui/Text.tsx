import { Text, type TextProps, type TextStyle } from 'react-native';

import { C, F, TYPE } from './theme';

type Variant = keyof typeof TYPE | 'brand';

export type TProps = TextProps & {
  v?: Variant;
  color?: string;
  center?: boolean;
  /** tabular figures for prices, timers and codes */
  tab?: boolean;
  size?: number;
};

export function T({ v = 'body', color = C.ink, center, tab, size, style, children, ...rest }: TProps) {
  const base: TextStyle = v === 'brand' ? { fontFamily: F.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 } : TYPE[v];
  const fs = size ?? base.fontSize ?? 15;
  // "*phrase*" inside a string is set in italic serif: the reference's one-word emphasis.
  const content = typeof children === 'string' && children.includes('*')
    ? children.split(/(\*[^*]+\*)/).map((part, i) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2
        ? <Text key={i} style={{ fontFamily: F.serif, fontSize: fs * 1.12, letterSpacing: -0.2, color: color === C.ink ? C.ink3 : undefined }}>{part.slice(1, -1)}</Text>
        : part)
    : children;
  return (
    <Text
      {...rest}
      children={content}
      style={[
        base,
        { color },
        size ? { fontSize: size, lineHeight: Math.round(size * (v === 'brand' ? 1.18 : 1.12)) } : null,
        center && { textAlign: 'center' },
        tab && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
