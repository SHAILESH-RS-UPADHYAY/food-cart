import { Image, type ImageStyle } from 'expo-image';
import { PixelRatio, type StyleProp } from 'react-native';

import { PHOTOS, type Photo as PhotoData, type PhotoKey } from '@/data/images';

import { C } from './theme';

/** Request the width we actually draw (device pixels), so phones never download desktop images. */
export function photoSource(key: PhotoKey, width: number) {
  const p: PhotoData = PHOTOS[key];
  if (p.local) return p.local;
  const w = Math.min(1600, Math.ceil((width * PixelRatio.get()) / 80) * 80);
  return { uri: `https://images.unsplash.com/${p.unsplash}?w=${w}&q=72&auto=format&fit=crop` };
}

type Props = { photo: PhotoKey; width: number; style?: StyleProp<ImageStyle>; priority?: 'low' | 'normal' | 'high'; alt?: string };

export function Photo({ photo, width, style, priority = 'normal', alt }: Props) {
  return (
    <Image
      source={photoSource(photo, width)}
      placeholder={{ blurhash: PHOTOS[photo].blurhash }}
      placeholderContentFit="cover"
      contentFit="cover"
      transition={260}
      cachePolicy="memory-disk"
      recyclingKey={photo}
      priority={priority}
      accessibilityLabel={alt}
      style={[{ backgroundColor: C.line }, style]}
    />
  );
}
