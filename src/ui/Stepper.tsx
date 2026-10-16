import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { Icon } from './Icon';
import { EASE_OUT } from './motion';
import { Press } from './Press';
import { T } from './Text';
import { C, R, SHADOW } from './theme';

const MORPH = LinearTransition.duration(200).easing(EASE_OUT);
const SWAP_IN = FadeIn.duration(140);
const SWAP_OUT = FadeOut.duration(90);
const UP_IN = FadeInUp.duration(160).easing(EASE_OUT);
const UP_OUT = FadeOutUp.duration(120);
const DOWN_IN = FadeInDown.duration(160).easing(EASE_OUT);
const DOWN_OUT = FadeOutDown.duration(120);

type Props = { qty: number; onAdd: () => void; onRemove: () => void; disabled?: boolean; disabledLabel?: string; compact?: boolean; lastDelta?: 1 | -1 };

/** "Add" morphs into a stepper; the number rolls up on add and down on remove. */
export function Stepper({ qty, onAdd, onRemove, disabled, disabledLabel = 'Sold out', compact, lastDelta = 1 }: Props) {
  const h = compact ? 34 : 38;
  if (qty === 0) {
    return (
      <Animated.View layout={MORPH}>
        <Press onPress={onAdd} disabled={disabled} feedback="add" accessibilityRole="button" accessibilityLabel="Add to cart"
          style={[{ height: h, minWidth: compact ? 72 : 88, borderRadius: R.pill, backgroundColor: C.canvas, borderWidth: 1.5, borderColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 14 }, SHADOW.card]}>
          <Animated.View entering={SWAP_IN} exiting={SWAP_OUT} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <T v="bodyStrong" color={disabled ? C.ink3 : C.accent} style={{ fontSize: 14 }}>{disabled ? disabledLabel : 'Add'}</T>
            {!disabled && <Icon name="plus-bold" size={14} color={C.accent} />}
          </Animated.View>
        </Press>
      </Animated.View>
    );
  }
  return (
    <Animated.View layout={MORPH} style={{ height: h, minWidth: compact ? 92 : 104, borderRadius: R.pill, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Press onPress={onRemove} feedback="remove" accessibilityLabel="Remove one" hitSlop={10} style={{ width: h, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="minus-bold" size={14} color={C.chalk} />
      </Press>
      <View style={{ height: h, justifyContent: 'center', overflow: 'hidden', minWidth: 18, alignItems: 'center' }}>
        <Animated.View key={qty} entering={lastDelta > 0 ? UP_IN : DOWN_IN} exiting={lastDelta > 0 ? UP_OUT : DOWN_OUT}>
          <T v="bodyStrong" color={C.chalk} tab>{qty}</T>
        </Animated.View>
      </View>
      <Press onPress={onAdd} feedback="add" accessibilityLabel="Add one" hitSlop={10} style={{ width: h, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plus-bold" size={14} color={C.onAccent} />
      </Press>
    </Animated.View>
  );
}
