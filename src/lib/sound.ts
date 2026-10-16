import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { POOLED, SOUND_FILES, type SoundName } from './sound-files';

// Native: preloaded expo-audio players, created once for the app's lifetime (never released).
const pools = new Map<SoundName, AudioPlayer[]>();
let started = false;

export function initSound() {
  if (started) return;
  started = true;
  // Respect the silent switch and never interrupt the user's music.
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const name of Object.keys(SOUND_FILES) as SoundName[]) {
    const n = POOLED.includes(name) ? 2 : 1;
    pools.set(name, Array.from({ length: n }, () => createAudioPlayer(SOUND_FILES[name])));
  }
}

export function playSound(name: SoundName, volume = 1) {
  const pool = pools.get(name);
  if (!pool) return;
  const p = pool.find((x) => !x.playing) ?? pool[0];
  try {
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {
    // a sound must never break the UI
  }
}
