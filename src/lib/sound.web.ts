import { Asset } from 'expo-asset';

import { SOUND_FILES, type SoundName } from './sound-files';

// Web: Web Audio buffers. Zero-latency and overlap-safe, unlike <audio> elements.
// Browsers only allow audio after a user gesture, so the context starts on the first pointer/key.
let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let started = false;

async function load(name: SoundName) {
  if (!ctx || buffers.has(name)) return;
  try {
    const asset = Asset.fromModule(SOUND_FILES[name]);
    const res = await fetch(asset.uri);
    buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()));
  } catch {
    // missing sound = silent, never an error
  }
}

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // small, frequent sounds first; rare long ones after
    const order = Object.keys(SOUND_FILES) as SoundName[];
    order.reduce((p, n) => p.then(() => load(n)), Promise.resolve());
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function initSound() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
}

/** False until the browser lets this page play audio (first tap or key press). */
export const soundUnlocked = () => ctx?.state === 'running';

export function playSound(name: SoundName, volume = 1) {
  if (!ctx || ctx.state !== 'running') return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(ctx.destination);
  src.start();
}
