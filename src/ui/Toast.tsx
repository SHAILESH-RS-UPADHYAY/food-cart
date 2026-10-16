import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useLayout } from '@/lib/layout';

import { Icon, type IconName } from './Icon';
import { EASE_OUT } from './motion';
import { T } from './Text';
import { C, R, SHADOW } from './theme';

type Toast = { id: number; text: string; icon: IconName; tone: 'ink' | 'leaf' | 'chilli' };
type Store = { toasts: Toast[]; show: (text: string, icon?: IconName, tone?: Toast['tone']) => void };

let seq = 0;

/** Transient, uninvited messages only: quick in, quicker out, max three on screen. */
export const useToast = create<Store>((set) => ({
  toasts: [],
  show: (text, icon = 'info-bold', tone = 'ink') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, icon, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
}));

export const toast = (text: string, icon?: IconName, tone?: Toast['tone']) => useToast.getState().show(text, icon, tone);

const IN = FadeInDown.duration(260).easing(EASE_OUT);
const OUT = FadeOutUp.duration(200);

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  const insets = useSafeAreaInsets();
  const { desktop } = useLayout();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + (desktop ? 84 : 10), left: 16, right: 16, alignItems: desktop ? 'flex-end' : 'center', gap: 8, zIndex: 50 }}>
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={IN}
          exiting={OUT}
          style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 440, backgroundColor: C.ink, paddingVertical: 12, paddingHorizontal: 16, borderRadius: R.pill }, SHADOW.float]}
        >
          <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tone === 'leaf' ? C.leaf : t.tone === 'chilli' ? C.chilli : C.accent }}>
            <Icon name={t.icon} size={15} color={C.chalk} />
          </View>
          <T v="bodyStrong" color={C.chalk} style={{ flexShrink: 1 }}>{t.text}</T>
        </Animated.View>
      ))}
    </View>
  );
}
