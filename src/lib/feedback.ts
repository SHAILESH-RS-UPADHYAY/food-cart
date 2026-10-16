import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettings } from '@/store/settings';

import { playSound } from './sound';
import type { SoundName } from './sound-files';

type Haptic = 'select' | 'light' | 'medium' | 'success' | 'error' | null;

const native = Platform.OS !== 'web';

function haptic(kind: Haptic) {
  if (!kind || !native || !useSettings.getState().haptics) return;
  const run =
    kind === 'select' ? Haptics.selectionAsync()
    : kind === 'light' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    : kind === 'medium' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    : Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  run.catch(() => {});
}

function cue(sound: SoundName | null, h: Haptic, volume = 1) {
  return () => {
    if (sound && useSettings.getState().sound) playSound(sound, volume);
    haptic(h);
  };
}

/** One call per user action: sound and haptic fire in the same frame as the visual. */
export const fx = {
  tap: cue('tap', null, 0.9),
  press: cue('tap', 'light', 0.9),
  pill: cue('pill', 'select'),
  tick: cue('tick', 'select'),
  add: cue('add', 'light'),
  remove: cue('remove', 'select'),
  like: cue('like', 'light'),
  unlike: cue('unlike', null),
  open: cue('open', null),
  close: cue('close', null),
  swipe: cue('swipe', 'select'),
  error: cue('error', 'error'),
  success: cue('success', 'success'),
  ready: cue('ready', 'success'),
  stamp: cue('stamp', 'medium'),
  crunch: cue('crunch', 'light'),
  coin: cue('coin', 'success'),
  alert: cue('alert', 'medium'),
  intro: cue('intro', null),
  detent: cue('tick', 'light', 0.7),
};
