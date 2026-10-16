import { Linking, View } from 'react-native';

import { PHOTO_CREDITS } from '@/data/images';
import { Hairline } from '@/ui/bits';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { StackPage } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R, SHADOW } from '@/ui/theme';
import type { PhotoKey } from '@/data/images';

/** Required attribution for the Creative Commons photos; Unsplash photos are credited as a courtesy. */
export default function Credits() {
  return (
    <StackPage title="Photo credits">
      <T v="body" color={C.ink2}>
        Most food photography comes from Unsplash photographers under the Unsplash License. These photos are used under Creative Commons licences:
      </T>
      <View style={[{ marginTop: 18, backgroundColor: C.card, borderRadius: R.card, paddingHorizontal: 16 }, SHADOW.card]}>
        {PHOTO_CREDITS.map((c, i) => (
          <View key={c.key}>
            {i > 0 && <Hairline />}
            <Press onPress={() => Linking.openURL(c.source)} feedback="tap" scale={0.99} style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Photo photo={c.key as PhotoKey} width={56} style={{ width: 56, height: 56, borderRadius: 12 }} />
              <View style={{ flex: 1 }}>
                <T v="bodyStrong" numberOfLines={1}>{c.title}</T>
                <T v="small" color={C.ink3}>{c.creator}, {c.license}</T>
              </View>
            </Press>
          </View>
        ))}
      </View>
      <T v="small" color={C.ink3} style={{ marginTop: 18 }}>Icons: Phosphor Icons (MIT). Fonts: Shrikhand and Schibsted Grotesk (SIL Open Font License).</T>
    </StackPage>
  );
}
