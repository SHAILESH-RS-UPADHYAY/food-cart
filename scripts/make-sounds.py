"""Synthesise the Food Cart sound kit into assets/sounds/*.wav.

Original sounds (no samples). Character: soft marimba + glass bell, A major pentatonic,
~3 ms attacks, quiet UI levels, louder "rare" moments. Run: python scripts/make-sounds.py
"""
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
rng = np.random.default_rng(7)  # fixed seed: the kit is reproducible

# A major pentatonic, Hz
N = {'C#4': 277.18, 'E4': 329.63, 'A4': 440.0, 'E5': 659.26, 'A5': 880.0, 'B5': 987.77,
     'C#6': 1108.73, 'E6': 1318.51, 'F#6': 1479.98, 'A6': 1760.0, 'B6': 1975.53,
     'C#7': 2217.46, 'E7': 2637.02}


def secs(d):
    return np.arange(int(SR * d)) / SR


def attack(x, ms=3.0):
    n = min(len(x), int(SR * ms / 1000))
    x[:n] *= np.linspace(0, 1, n)
    return x


def lowpass(x, hz):
    return sosfilt(butter(2, hz, 'low', fs=SR, output='sos'), x)


def bandpass(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def marimba(f, decay=0.2, dur=None):
    """Bar partials at 1, 3.93, 9.0 with faster-decaying overtones and a soft mallet."""
    t = secs(dur or decay * 4)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / decay)
         + 0.28 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / (decay * 0.22))
         + 0.07 * np.sin(2 * np.pi * f * 9.0 * t) * np.exp(-t / (decay * 0.07)))
    mallet = lowpass(rng.standard_normal(len(t)), 3800) * np.exp(-t / 0.0018) * 0.18
    return attack(x + mallet, 1.5)


def bell(f, decay=0.5, ratio=2.0, index=1.6, dur=None):
    """Two-operator FM: bright strike settling into a pure glassy tone."""
    t = secs(dur or decay * 3.2)
    idx = index * np.exp(-t / (decay * 0.35))
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t / decay)
    return attack(x, 2.5)


def pop(f0, f1, dur=0.16, glide=0.045):
    """Bubble: exponential pitch glide with a quick body."""
    t = secs(dur)
    k = np.clip(t / glide, 0, 1)
    f = f0 * (f1 / f0) ** k
    phase = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(phase) + 0.18 * np.sin(2 * phase)) * np.exp(-t / 0.05)
    return attack(x, 2)


def click(dur=0.03, center=3000):
    t = secs(dur)
    noise = bandpass(rng.standard_normal(len(t)), center * 0.6, center * 1.6) * np.exp(-t / 0.0025)
    body = np.sin(2 * np.pi * center * 0.85 * t) * np.exp(-t / 0.006) * 0.5
    return attack(noise * 0.6 + body, 0.6)


def whoosh(f_start, f_end, dur=0.24):
    """Noise through a sweeping band-pass, raised-cosine swell."""
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 24
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for b in range(blocks):
        c = f_start * (f_end / f_start) ** (b / (blocks - 1))
        seg = bandpass(noise, c * 0.7, min(c * 1.45, SR / 2 - 100))
        out[edges[b]:edges[b + 1]] = seg[edges[b]:edges[b + 1]]
    swell = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return lowpass(out, 6000) * swell


def thump(dur=0.25):
    t = secs(dur)
    f = 95 * (50 / 95) ** np.clip(t / 0.08, 0, 1)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07)
    slap = lowpass(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.012) * 0.55
    return attack(body + slap, 1)


def room(x, mix=0.14, length=0.35, tone=5000):
    t = secs(length)
    ir = lowpass(rng.standard_normal(len(t)), tone) * np.exp(-t / (length / 4.5))
    ir /= np.max(np.abs(ir))
    dry = np.concatenate([x, np.zeros(len(t))])
    wet = np.zeros(len(dry))
    conv = fftconvolve(x, ir)[:len(dry)]
    wet[:len(conv)] = conv
    wet *= np.max(np.abs(dry)) / (np.max(np.abs(wet)) + 1e-9)
    return dry * (1 - mix) + wet * mix


def layer(*parts):
    """parts: (signal, start_seconds, gain)."""
    end = max(int(s * SR) + len(sig) for sig, s, _ in parts)
    out = np.zeros(end)
    for sig, s, g in parts:
        i = int(s * SR)
        out[i:i + len(sig)] += sig * g
    return out


def finish(x, peak_db):
    x = x - np.mean(x)
    # trim trailing near-silence, then a short fade
    thresh = np.max(np.abs(x)) * 10 ** (-46 / 20)
    last = len(x) - np.argmax(np.abs(x[::-1]) > thresh)
    x = x[:max(last, int(SR * 0.02))]
    fade = min(int(len(x) * 0.3), int(SR * 0.03))
    x[-fade:] *= np.linspace(1, 0, fade)
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


KIT = {
    # everyday UI: short and quiet
    'tap': lambda: finish(layer((marimba(N['E6'], 0.022, 0.09), 0, 0.6), (click(0.03, 2600), 0, 0.5)), -17),
    'pill': lambda: finish(layer((marimba(N['C#6'], 0.05, 0.16), 0, 1), (click(0.02, 3200), 0, 0.25)), -15),
    'tick': lambda: finish(click(0.03, 3400), -21),
    'add': lambda: finish(room(layer((pop(520, 1180), 0, 1), (marimba(N['A6'], 0.06, 0.22), 0.035, 0.45)), 0.1, 0.2), -12),
    'remove': lambda: finish(pop(900, 420, 0.15, 0.06), -15),
    'like': lambda: finish(room(layer((bell(N['E6'], 0.12, 2.0, 1.2), 0, 0.8), (bell(N['A6'], 0.16, 2.0, 1.2), 0.07, 1),
                                      (bell(N['C#7'], 0.12, 2.0, 0.8), 0.14, 0.3)), 0.12, 0.3), -12),
    'unlike': lambda: finish(marimba(N['E5'], 0.05, 0.18), -17),
    'open': lambda: finish(whoosh(500, 2600, 0.24), -19),
    'close': lambda: finish(whoosh(2400, 600, 0.2), -21),
    'swipe': lambda: finish(layer((whoosh(900, 2100, 0.16), 0, 1), (click(0.02, 3000), 0.1, 0.3)), -19),
    'error': lambda: finish(layer((marimba(N['E4'], 0.12, 0.3), 0, 1), (marimba(N['C#4'], 0.14, 0.35), 0.12, 1)), -12),
    # rare moments: fuller, with a little room
    'success': lambda: finish(room(layer(
        (marimba(N['A5'], 0.3), 0.00, 0.8), (marimba(N['C#6'], 0.3), 0.07, 0.8),
        (marimba(N['E6'], 0.32), 0.14, 0.85), (marimba(N['A6'], 0.45), 0.21, 1),
        (bell(N['A6'], 0.6, 2.0, 0.9), 0.30, 0.22), (bell(N['E7'], 0.5, 2.0, 0.6), 0.30, 0.12)), 0.18, 0.5), -6),
    'ready': lambda: finish(room(layer(
        (bell(N['E6'], 0.5, 2.0, 1.3), 0.00, 0.7), (bell(N['A6'], 0.55, 2.0, 1.3), 0.00, 0.6),
        (bell(N['C#7'], 0.6, 2.0, 1.1), 0.18, 0.7),
        (marimba(N['F#6'], 0.12), 0.34, 0.25), (marimba(N['A6'], 0.12), 0.37, 0.25),
        (marimba(N['C#7'], 0.16), 0.40, 0.25)), 0.2, 0.6), -5),
    'stamp': lambda: finish(thump(), -8),
    # cookie consent: three quick, dry crunches
    'crunch': lambda: finish(layer(*[(bandpass(rng.standard_normal(int(SR * 0.05)), 900, 5200) * np.exp(-secs(0.05) / 0.012), t, g)
                                    for t, g in ((0, 1), (0.06, 0.8), (0.13, 0.65))]), -12),
    'coin': lambda: finish(room(layer((bell(N['B6'], 0.16, 2.4, 2.2), 0, 1), (bell(N['E7'], 0.22, 2.4, 2.0), 0.09, 1)), 0.15, 0.3), -8),
    'alert': lambda: finish(room(layer(
        (layer((bell(N['A5'], 0.4, 2.0, 1.4), 0, 0.8), (marimba(N['A5'], 0.3), 0, 0.6)), 0.00, 1),
        (layer((bell(N['C#6'], 0.4, 2.0, 1.4), 0, 0.8), (marimba(N['C#6'], 0.3), 0, 0.6)), 0.13, 1),
        (layer((bell(N['E6'], 0.5, 2.0, 1.4), 0, 0.8), (marimba(N['E6'], 0.35), 0, 0.6)), 0.26, 1)), 0.16, 0.5), -4),
    # staff console, an online order just landed: bubble pop, rising kalimba E-A, glassy C# ding, sparkle
    'order': lambda: finish(room(layer(
        (pop(420, 1250, 0.14, 0.045), 0.00, 0.5),
        (marimba(N['E6'], 0.08, 0.28), 0.05, 0.85),
        (marimba(N['A6'], 0.08, 0.28), 0.14, 0.85),
        (layer((bell(N['C#7'], 0.32, 2.0, 1.2), 0, 0.9), (marimba(N['C#7'], 0.12, 0.4), 0, 0.4)), 0.23, 1),
        (bell(N['E7'], 0.24, 2.0, 0.8), 0.31, 0.3)), 0.16, 0.45), -5),
    # sonic logo, timed to the onboarding logo build (scallops 0/90/180/270 ms, roll 360 ms, ding 820 ms)
    'intro': lambda: finish(room(layer(
        (marimba(N['A5'], 0.16), 0.00, 0.7), (marimba(N['C#6'], 0.16), 0.09, 0.7),
        (marimba(N['E6'], 0.16), 0.18, 0.7), (marimba(N['F#6'], 0.18), 0.27, 0.75),
        (lowpass(whoosh(180, 700, 0.34), 1200), 0.36, 0.35),
        (click(0.02, 1800), 0.52, 0.25), (click(0.02, 1800), 0.62, 0.22),
        (bell(N['A6'], 0.7, 2.0, 1.0), 0.82, 0.7), (bell(N['E6'], 0.7, 2.0, 0.9), 0.82, 0.45),
        (bell(N['C#7'], 0.6, 2.0, 0.7), 0.95, 0.22)), 0.18, 0.5), -7),
}


def write(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, make in KIT.items():
        x = make()
        write(name, x)
        print(f'{name:8} {len(x) / SR:5.2f}s peak {20 * np.log10(np.max(np.abs(x))):6.1f} dB')
