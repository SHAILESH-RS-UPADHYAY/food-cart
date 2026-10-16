import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeOutDown, SlideInDown, cubicBezier } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { fx } from '@/lib/feedback';
import { useLayout } from '@/lib/layout';

import { Button } from './Button';
import { CSS_EASE_OUT, EASE_OUT } from './motion';
import { Press } from './Press';
import { T } from './Text';
import { Toggle } from './Toggle';
import { C, R, SHADOW } from './theme';

// Website only: the native app has no cookies. Choice is kept in localStorage.
type Consent = { essential: true; analytics: boolean; personal: boolean; at: number };
const KEY = 'fc-consent';

function read(): Consent | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

function write(c: Omit<Consent, 'essential' | 'at'>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ essential: true, ...c, at: Date.now() }));
  } catch {}
}

/** Lets the profile screen reopen the preferences. */
export const useCookiePrefs = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

const BOUNCE = cubicBezier(0.34, 1.56, 0.64, 1);
const ENTER = SlideInDown.duration(520).easing(EASE_OUT);
const EXIT = FadeOutDown.duration(260);
const CHIPS: [number, number][] = [[18, 16], [34, 30], [14, 36], [38, 14], [26, 44]];
const CRUMBS = [[-26, 40], [-8, 52], [12, 46], [-18, 60]];

/** A cookie that wobbles hello, and loses a bite (with crumbs) when you accept. */
function Cookie({ bitten }: { bitten: boolean }) {
  return (
    <View style={{ width: 64, height: 64 }}>
      <Animated.View
        style={{
          width: 56, height: 56, borderRadius: 28, backgroundColor: C.cookie, margin: 4,
          animationName: { '0%': { transform: [{ rotate: '0deg' }] }, '25%': { transform: [{ rotate: '-10deg' }] }, '75%': { transform: [{ rotate: '8deg' }] }, '100%': { transform: [{ rotate: '0deg' }] } },
          animationDuration: '900ms', animationDelay: 500, animationIterationCount: 2, animationTimingFunction: CSS_EASE_OUT,
        }}
      >
        {CHIPS.map(([x, y], i) => (
          <View key={i} style={{ position: 'absolute', left: x, top: y, width: 7, height: 6, borderRadius: 3, backgroundColor: C.cookieChip }} />
        ))}
        {bitten && (
          <Animated.View
            style={{
              position: 'absolute', right: -10, top: -10, width: 30, height: 30, borderRadius: 15, backgroundColor: C.canvas,
              animationName: { from: { transform: [{ scale: 0 }] }, to: { transform: [{ scale: 1 }] } }, animationDuration: '220ms', animationTimingFunction: BOUNCE,
            }}
          />
        )}
      </Animated.View>
      {bitten && CRUMBS.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: 46, top: 8, width: 5, height: 5, borderRadius: 3, backgroundColor: C.cookie, opacity: 0,
            animationName: { from: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }] }, to: { opacity: 0, transform: [{ translateX: x }, { translateY: y }] } },
            animationDuration: '560ms', animationDelay: i * 30, animationTimingFunction: CSS_EASE_OUT,
          }}
        />
      ))}
    </View>
  );
}

export function CookieConsent({ delay = 1800 }: { delay?: number }) {
  const insets = useSafeAreaInsets();
  const { desktop, tablet } = useLayout();
  const reopen = useCookiePrefs((s) => s.open);
  const [visible, setVisible] = useState(false);
  const [custom, setCustom] = useState(false);
  const [bitten, setBitten] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [personal, setPersonal] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const saved = read();
    if (saved && !reopen) return;
    if (saved) {
      setAnalytics(saved.analytics);
      setPersonal(saved.personal);
      setCustom(true);
    }
    const t = setTimeout(() => setVisible(true), saved ? 0 : delay);
    return () => clearTimeout(t);
  }, [reopen]);

  if (Platform.OS !== 'web' || !visible) return null;

  const done = (choice: { analytics: boolean; personal: boolean }) => {
    write(choice);
    setBitten(true);
    fx.crunch();
    setTimeout(() => {
      setVisible(false);
      setBitten(false);
      useCookiePrefs.getState().hide();
    }, 650);
  };

  return (
    <Animated.View
      entering={ENTER}
      exiting={EXIT}
      accessibilityRole="alert"
      accessibilityLabel="Cookie preferences"
      style={[
        {
          position: 'absolute', zIndex: 60, bottom: insets.bottom + 16,
          left: 12, right: desktop || tablet ? undefined : 12, width: desktop || tablet ? 440 : undefined,
          marginLeft: desktop ? 20 : 0, borderRadius: R.sheet, backgroundColor: C.canvas, padding: 18, borderWidth: 1, borderColor: C.line,
        },
        SHADOW.float,
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Cookie bitten={bitten} />
        <View style={{ flex: 1 }}>
          <T v="h3">Ek cookie le lein?</T>
          <T v="small" color={C.ink2} style={{ marginTop: 4, lineHeight: 18 }}>
            Essential cookies keep you logged in and your cart safe. Optional ones help us make lunch faster. No ads, ever.
          </T>
        </View>
      </View>

      {custom && (
        <View style={{ marginTop: 14, gap: 4 }}>
          {[
            { k: 'Essential', d: 'Login, cart and security', v: true, set: undefined },
            { k: 'Analytics', d: 'Anonymous usage, to speed things up', v: analytics, set: setAnalytics },
            { k: 'Personalisation', d: 'Remember your favourite stalls', v: personal, set: setPersonal },
          ].map((r) => (
            <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ flex: 1 }}>
                <T v="bodyStrong">{r.k}</T>
                <T v="small" color={C.ink3}>{r.d}</T>
              </View>
              {r.set ? <Toggle label={r.k} value={r.v} onChange={r.set} /> : <T v="label" color={C.ink3}>Always on</T>}
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {custom ? (
          <Button label="Save choices" size="md" onPress={() => done({ analytics, personal })} style={{ flex: 1 }} feedback="none" />
        ) : (
          <>
            <Button label="Accept all" size="md" onPress={() => done({ analytics: true, personal: true })} style={{ flex: 1 }} feedback="none" />
            <Button label="Essential only" kind="light" size="md" onPress={() => done({ analytics: false, personal: false })} style={{ flex: 1 }} feedback="none" />
          </>
        )}
      </View>
      {!custom && (
        <Press onPress={() => setCustom(true)} feedback="tap" style={{ alignSelf: 'center', marginTop: 10, paddingHorizontal: 8, height: 28, justifyContent: 'center' }}>
          <T v="label" color={C.accent}>Customise</T>
        </Press>
      )}
    </Animated.View>
  );
}
