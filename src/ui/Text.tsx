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

export function T({ v = 'body', color = C.ink, center, tab, size, style, ...rest }: TProps) {
  const base: TextStyle = v === 'brand' ? { fontFamily: F.brand, fontSize: 30, lineHeight: 40 } : TYPE[v];
  return (
    <Text
      {...rest}
      style={[
        base,
        { color },
        size ? { fontSize: size, lineHeight: Math.round(size * (v === 'brand' ? 1.3 : 1.12)) } : null,
        center && { textAlign: 'center' },
        tab && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
