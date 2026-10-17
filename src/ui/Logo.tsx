import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

import { BODY, HANDLE, POLES, TABS, VIEWBOX, WHEEL_CENTERS, WHEEL_HUB, WHEEL_RING, WHEEL_SPOKES } from './logo-geometry';
import { CSS_EASE_OUT } from './motion';
import { T } from './Text';
import { C } from './theme';

type Colors = { awning?: string; stripe?: string; cart?: string };

function Wheel({ color }: { color: string }) {
  return (
    <>
      <Path d={WHEEL_RING} fill={color} fillRule="evenodd" />
      <Path d={WHEEL_HUB} fill={color} />
      <Path d={WHEEL_SPOKES} stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </>
  );
}

/** The static mark. */
export function CartMark({ size = 40, awning = C.accent, stripe = C.accentSoft, cart = C.ink }: Colors & { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={VIEWBOX} accessibilityLabel="Food Cart">
      {TABS.map((d, i) => <Path key={i} d={d} fill={i % 2 ? stripe : awning} />)}
      {POLES.map((d) => <Path key={d} d={d} fill={cart} />)}
      <Path d={BODY} fill={cart} fillRule="evenodd" />
      <Path d={HANDLE} stroke={cart} strokeWidth={6} strokeLinecap="round" />
      {WHEEL_CENTERS.map(([x, y]) => <G key={x} transform={`translate(${x} ${y})`}><Wheel color={cart} /></G>)}
    </Svg>
  );
}

export function Wordmark({ size = 22, color = C.ink }: { size?: number; color?: string }) {
  return <T v="h1" size={size} color={color} style={{ letterSpacing: -0.04 * size, includeFontPadding: false }}>Food Cart</T>;
}

/** Mark, name, and the italic-serif tagline under it (the reference's lockup). */
export function Lockup({ size = 34, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: size + 8, height: size + 8, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
        <CartMark size={size - 2} awning={C.chalk} stripe={C.ink4} cart={C.chalk} />
      </View>
      <View>
        <Wordmark size={size * 0.56} />
        {tagline && <T v="brand" size={size * 0.42} color={C.ink3} style={{ marginTop: -2 }}>Order ahead, skip the line</T>}
      </View>
    </View>
  );
}

// ---------- animated build (onboarding + splash hand-off) ----------

const BOUNCE = cubicBezier(0.34, 1.56, 0.64, 1);
const LETTERS = 'Food Cart'.split('');

/**
 * The cart assembles itself in time with the sonic logo (assets/sounds/intro.wav):
 * awning stripes drop on the four notes (0/90/180/270 ms), the body rises, the wheels
 * roll in spinning, then the wordmark lands on the final bell (820 ms).
 */
export function AnimatedLogo({ size = 200, delay = 0, tagline }: { size?: number; delay?: number; tagline?: string }) {
  const k = size / 120;
  const [vx, vy] = VIEWBOX.split(' ').map(Number);
  const layer = (children: ReactNode, anim: object) => (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, opacity: 0, animationFillMode: 'forwards' }, anim]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={VIEWBOX}>{children}</Svg>
    </Animated.View>
  );
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Animated.View
          style={{
            position: 'absolute', left: size * 0.06, top: size * 0.06, width: size * 0.88, height: size * 0.88, borderRadius: size,
            backgroundColor: C.card, opacity: 0, animationFillMode: 'forwards',
            animationName: { from: { opacity: 0, transform: [{ scale: 0.86 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } },
            animationDuration: '520ms', animationDelay: delay, animationTimingFunction: CSS_EASE_OUT,
          }}
        />
        {TABS.map((d, i) => (
          <View key={i} style={{ position: 'absolute', inset: 0 }}>
            {layer(<Path d={d} fill={i % 2 ? C.accentSoft : C.accent} />, {
              animationName: { '0%': { opacity: 0, transform: [{ translateY: -26 * k }] }, '55%': { opacity: 1, transform: [{ translateY: 3 * k }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }] } },
              animationDuration: '420ms', animationDelay: delay + i * 90, animationTimingFunction: CSS_EASE_OUT,
            })}
          </View>
        ))}
        {layer(<>{POLES.map((d) => <Path key={d} d={d} fill={C.ink} />)}</>, {
          animationName: { from: { opacity: 0, transform: [{ translateY: 12 * k }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } },
          animationDuration: '300ms', animationDelay: delay + 330, animationTimingFunction: CSS_EASE_OUT,
        })}
        {layer(<Path d={BODY} fill={C.ink} fillRule="evenodd" />, {
          animationName: { '0%': { opacity: 0, transform: [{ translateY: 20 * k }] }, '60%': { opacity: 1, transform: [{ translateY: -2.5 * k }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }] } },
          animationDuration: '420ms', animationDelay: delay + 360, animationTimingFunction: CSS_EASE_OUT,
        })}
        {layer(<Path d={HANDLE} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />, {
          animationName: { from: { opacity: 0, transform: [{ translateX: -6 * k }, { rotate: '-8deg' }] }, to: { opacity: 1, transform: [{ translateX: 0 }, { rotate: '0deg' }] } },
          animationDuration: '280ms', animationDelay: delay + 640, animationTimingFunction: BOUNCE,
        })}
        {WHEEL_CENTERS.map(([cx, cy], i) => (
          <Animated.View
            key={cx}
            pointerEvents="none"
            style={{
              position: 'absolute', left: (cx - vx - 12) * k, top: (cy - vy - 12) * k, width: 24 * k, height: 24 * k, opacity: 0,
              animationName: {
                '0%': { opacity: 0, transform: [{ translateX: -70 * k }, { rotate: '-540deg' }] },
                '20%': { opacity: 1 },
                '100%': { opacity: 1, transform: [{ translateX: 0 }, { rotate: '0deg' }] },
              },
              animationDuration: '620ms', animationDelay: delay + 380 + i * 60, animationTimingFunction: CSS_EASE_OUT, animationFillMode: 'forwards',
            }}
          >
            <Svg width={24 * k} height={24 * k} viewBox="-12 -12 24 24"><Wheel color={C.ink} /></Svg>
          </Animated.View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: size * 0.02 }} accessibilityLabel="food cart">
        {LETTERS.map((ch, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: 0, animationFillMode: 'forwards',
              animationName: { from: { opacity: 0, transform: [{ translateY: 18 }, { rotate: '-8deg' }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }] } },
              animationDuration: '420ms', animationDelay: delay + 820 + i * 38, animationTimingFunction: BOUNCE,
            }}
          >
            {ch === ' ' ? <View style={{ width: size * 0.05 }} /> : <T v="display" size={size * 0.22} color={C.ink} style={{ letterSpacing: -1 }}>{ch}</T>}
          </Animated.View>
        ))}
      </View>
      {tagline && (
        <Animated.View
          style={{
            opacity: 0, marginTop: 6, animationFillMode: 'forwards',
            animationName: { from: { opacity: 0, transform: [{ translateY: 10 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } },
            animationDuration: '400ms', animationDelay: delay + 1250, animationTimingFunction: CSS_EASE_OUT,
          }}
        >
          <T v="h3" color={C.ink3} center>{tagline}</T>
        </Animated.View>
      )}
    </View>
  );
}
