import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from './Button';
import { Icon } from './Icon';
import { enterRise } from './motion';
import { PaperGrid } from './Surface';
import { T } from './Text';
import { C, R, SHADOW } from './theme';

/** Shown instead of silently redirecting, so a locked door reads as a locked door. */
export function NoAccess({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <PaperGrid />
      <Animated.View entering={enterRise(0)} accessibilityRole="alert"
        style={[{ width: '100%', maxWidth: 440, backgroundColor: C.card, borderRadius: R.card + 4, padding: 24, gap: 12 }, SHADOW.float]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock-simple-bold" size={18} color={C.chalk} />
          </View>
          <View style={{ height: 24, paddingHorizontal: 10, borderRadius: R.pill, backgroundColor: C.chilliSoft, justifyContent: 'center' }}>
            <T v="label" color={C.chilli}>No access</T>
          </View>
        </View>
        <T v="h1" style={{ marginTop: 4 }}>{title}</T>
        <T v="body" color={C.ink3}>{body}</T>
        <Button label={action} onPress={onAction} block style={{ marginTop: 6 }} />
      </Animated.View>
    </View>
  );
}
