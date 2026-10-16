import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { PhotoKey } from '@/data/images';

import { Icon, type IconName } from './Icon';
import { CSS_EASE_OUT } from './motion';
import { Photo } from './Photo';
import { Press } from './Press';
import { T } from './Text';
import { C, R } from './theme';

type Props = { label: string; active?: boolean; onPress: () => void; photo?: PhotoKey; icon?: IconName; count?: number };

/** Selectable chip. Active = ultramarine fill; colour change is a 180 ms transition. */
export function Pill({ label, active, onPress, photo, icon, count }: Props) {
  const bg = active ? C.accent : C.card;
  const fg = active ? C.onAccent : C.ink;
  return (
    <Press onPress={onPress} feedback="pill" accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Animated.View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8, height: 40,
          paddingLeft: photo ? 5 : 15, paddingRight: 15, borderRadius: R.pill,
          backgroundColor: bg, borderWidth: 1, borderColor: active ? bg : C.line,
          transitionProperty: ['backgroundColor', 'borderColor'], transitionDuration: 180, transitionTimingFunction: CSS_EASE_OUT,
        }}
      >
        {photo && <Photo photo={photo} width={30} style={{ width: 30, height: 30, borderRadius: 15 }} />}
        {icon && <Icon name={icon} size={16} color={fg} />}
        <T v="label" color={fg} style={{ fontSize: 13 }}>{label}</T>
        {count != null && count > 0 && (
          <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: active ? C.canvas : C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <T v="label" color={active ? C.accent : C.chalk} style={{ fontSize: 11 }} tab>{count}</T>
          </View>
        )}
      </Animated.View>
    </Press>
  );
}
