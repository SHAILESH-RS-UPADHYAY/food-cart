import Svg, { Path } from 'react-native-svg';

import { ICONS, type IconName } from './icon-data';
import { C } from './theme';

export type { IconName };

export function Icon({ name, size = 22, color = C.ink }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" pointerEvents="none">
      {ICONS[name].map((d, i) => (
        <Path key={i} d={d} fill={color} />
      ))}
    </Svg>
  );
}
