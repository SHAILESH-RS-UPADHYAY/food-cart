import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { stallById } from '@/data/catalog';
import { rupees } from '@/lib/format';
import { cartSummary, useCart } from '@/store/cart';

import { Icon } from './Icon';
import { CSS_EASE_OUT, EASE_OUT } from './motion';
import { Press } from './Press';
import { T } from './Text';
import { C, R, SHADOW } from './theme';

const IN = SlideInDown.duration(320).easing(EASE_OUT);
const OUT = SlideOutDown.duration(220);

/** Floating "view cart" bar. Bumps whenever the item count changes. */
export function CartBar({ bottom }: { bottom: number }) {
  const qty = useCart((s) => s.qty);
  const stallId = useCart((s) => s.stallId);
  const { count, total } = cartSummary(qty);
  if (!count || !stallId) return null;
  return (
    <Animated.View entering={IN} exiting={OUT} style={{ position: 'absolute', left: 14, right: 14, bottom, alignItems: 'center' }}>
      <Press onPress={() => router.push('/cart')} feedback="open" style={[{ width: '100%', maxWidth: 560 }, SHADOW.float]} accessibilityLabel={`View cart, ${count} items, ${rupees(total)}`}>
        <Animated.View
          key={count}
          style={{
            height: 62, borderRadius: R.pill, backgroundColor: C.haldi, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 20, gap: 12,
            animationName: { '0%': { transform: [{ scale: 1 }] }, '35%': { transform: [{ scale: 1.035 }] }, '100%': { transform: [{ scale: 1 }] } },
            animationDuration: '300ms', animationTimingFunction: CSS_EASE_OUT,
          }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <T v="h3" color={C.haldi} tab>{count}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" numberOfLines={1}>{rupees(total)}</T>
            <T v="small" color={C.ink2} numberOfLines={1}>from {stallById[stallId].name}</T>
          </View>
          <T v="bodyStrong">View cart</T>
          <Icon name="arrow-right-bold" size={18} />
        </Animated.View>
      </Press>
    </Animated.View>
  );
}
