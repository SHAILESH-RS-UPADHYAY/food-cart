import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import Animated, { cubicBezier, type CSSStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fx } from '@/lib/feedback';
import { useLayout } from '@/lib/layout';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import { AnimatedLogo, CartMark } from '@/ui/Logo';
import { CSS_EASE_IN_OUT, CSS_EASE_OUT } from '@/ui/motion';
import { Photo } from '@/ui/Photo';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { C, R } from '@/ui/theme';

const BOUNCE = cubicBezier(0.34, 1.56, 0.64, 1);

/** Schedules cues relative to mount; all cleared if the slide is left early. */
function useCues(cues: [number, () => void][]) {
  useEffect(() => {
    const ids = cues.map(([ms, fn]) => setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, []);
}

const rise = (delay: number, distance = 16): CSSStyle<ViewStyle> => ({
  opacity: 0,
  animationName: { from: { opacity: 0, transform: [{ translateY: distance }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } },
  animationDuration: '460ms', animationDelay: delay, animationTimingFunction: CSS_EASE_OUT, animationFillMode: 'forwards',
});

// ---------- 1. brand ----------

function BrandScene({ size }: { size: number }) {
  useCues([[250, fx.intro]]);
  return <AnimatedLogo size={size} delay={250} />;
}

// ---------- 2. pick a stall, fill the cart ----------

const FAN = [
  { photo: 'cover-tj' as const, name: 'TJ', eta: '~7 min', x: -86, r: -8, y: 14 },
  { photo: 'cover-creative' as const, name: 'Creative Food', eta: '~14 min', x: 0, r: 0, y: 0 },
  { photo: 'cover-books' as const, name: 'Books n Cooks', eta: '~17 min', x: 86, r: 8, y: 14 },
];

function OrderScene({ scale }: { scale: number }) {
  const [count, setCount] = useState(0);
  useCues([
    [1450, () => { setCount(1); fx.add(); }],
    [1950, () => { setCount(2); fx.add(); }],
  ]);
  return (
    <View style={{ width: 340, height: 330, transform: [{ scale }], alignItems: 'center' }}>
      {FAN.map((c, i) => (
        <Animated.View
          key={c.name}
          style={{
            position: 'absolute', top: 30 + c.y, width: 148, borderRadius: R.card, backgroundColor: C.night2, overflow: 'hidden',
            zIndex: i === 1 ? 2 : 1, opacity: 0,
            animationName: {
              from: { opacity: 0, transform: [{ translateX: c.x * 0.4 }, { translateY: 70 }, { rotate: '0deg' }] },
              to: { opacity: 1, transform: [{ translateX: c.x }, { translateY: 0 }, { rotate: `${c.r}deg` }] },
            },
            animationDuration: '560ms', animationDelay: 120 + i * 90, animationTimingFunction: BOUNCE, animationFillMode: 'forwards',
          }}
        >
          <Photo photo={c.photo} width={148} style={{ width: 148, height: 104 }} />
          <View style={{ padding: 12, gap: 4 }}>
            <T v="label" color={C.nightText} numberOfLines={1} style={{ fontSize: 13 }}>{c.name}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#5BD38B' }} />
              <T v="small" color={C.nightMuted}>{c.eta}</T>
            </View>
          </View>
          {i === 1 && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 54, top: 30, width: 40, height: 40, borderRadius: 20, backgroundColor: C.chalk, opacity: 0,
                animationName: { from: { opacity: 0.5, transform: [{ scale: 0.4 }] }, to: { opacity: 0, transform: [{ scale: 2.4 }] } },
                animationDuration: '520ms', animationDelay: 820, animationTimingFunction: CSS_EASE_OUT,
              }}
            />
          )}
        </Animated.View>
      ))}
      {(['steam-momos', 'oreo-shake'] as const).map((p, i) => (
        <Animated.View
          key={p}
          style={{
            position: 'absolute', top: 70, left: 147, width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
            borderWidth: 3, borderColor: C.haldi, zIndex: 3, opacity: 0,
            animationName: {
              '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.5 }] },
              '18%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: -34 }, { scale: 1.05 }] },
              '60%': { opacity: 1, transform: [{ translateX: 70 }, { translateY: -10 }, { scale: 0.9 }] },
              '100%': { opacity: 0, transform: [{ translateX: 112 }, { translateY: 178 }, { scale: 0.45 }] },
            },
            animationDuration: '640ms', animationDelay: 820 + i * 500, animationTimingFunction: CSS_EASE_IN_OUT, animationFillMode: 'forwards',
          }}
        >
          <Photo photo={p} width={46} style={{ width: 40, height: 40 }} />
        </Animated.View>
      ))}
      <Animated.View
        key={count}
        style={{
          position: 'absolute', right: 26, bottom: 18, width: 68, height: 68, borderRadius: 34, backgroundColor: C.haldi,
          alignItems: 'center', justifyContent: 'center', zIndex: 4,
          ...(count > 0
            ? { animationName: { '0%': { transform: [{ scale: 1 }] }, '40%': { transform: [{ scale: 1.2 }] }, '100%': { transform: [{ scale: 1 }] } }, animationDuration: '320ms', animationTimingFunction: CSS_EASE_OUT }
            : rise(700, 20)),
        }}
      >
        <Icon name="shopping-bag-fill" size={28} color={C.ink} />
        {count > 0 && (
          <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 26, height: 26, borderRadius: 13, backgroundColor: C.ink, borderWidth: 2, borderColor: C.haldi, alignItems: 'center', justifyContent: 'center' }}>
            <T v="label" color={C.chalk} tab>{count}</T>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ---------- 3. watch it cook ----------

const STEPS: { label: string; icon: IconName }[] = [
  { label: 'Placed', icon: 'receipt-fill' },
  { label: 'Cooking', icon: 'fire-fill' },
  { label: 'Ready', icon: 'check-bold' },
];

function TrackScene({ scale }: { scale: number }) {
  const [step, setStep] = useState(-1);
  const [stamped, setStamped] = useState(false);
  useCues([
    [350, () => { setStep(0); fx.tick(); }],
    [1000, () => { setStep(1); fx.tick(); }],
    [2150, () => { setStep(2); fx.tick(); }],
    [2300, () => { setStamped(true); fx.stamp(); }],
    [2450, fx.ready],
  ]);
  return (
    <View style={{ width: 320, height: 330, transform: [{ scale }], alignItems: 'center', justifyContent: 'center', gap: 26 }}>
      <Animated.View style={[{ width: 260, borderRadius: R.token, backgroundColor: C.chalk, padding: 20 }, rise(80, 30)]}>
        <T v="label" color={C.ink3}>BOOKS N COOKS</T>
        <T v="small" color={C.ink3} style={{ marginTop: 6 }}>Token</T>
        <T v="brand" size={54} tab>#047</T>
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 4 }}>
          {Array.from({ length: 16 }, (_, i) => <View key={i} style={{ width: 8, height: 2, borderRadius: 1, backgroundColor: C.line }} />)}
        </View>
        <T v="small" color={C.ink2} style={{ marginTop: 10 }}>White Sauce Penne, Lemon Iced Tea</T>
        {stamped && (
          <Animated.View
            style={{
              position: 'absolute', right: 16, top: 44, borderWidth: 3, borderColor: C.leaf, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
              transform: [{ rotate: '-12deg' }],
              animationName: {
                '0%': { opacity: 0, transform: [{ rotate: '-22deg' }, { scale: 2 }] },
                '70%': { opacity: 1, transform: [{ rotate: '-11deg' }, { scale: 0.93 }] },
                '100%': { opacity: 1, transform: [{ rotate: '-12deg' }, { scale: 1 }] },
              },
              animationDuration: '360ms', animationTimingFunction: CSS_EASE_OUT,
            }}
          >
            <T v="h2" color={C.leaf} style={{ letterSpacing: 1.5 }}>READY</T>
          </Animated.View>
        )}
      </Animated.View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: 280 }}>
        {STEPS.map((s, i) => {
          const on = step >= i;
          return (
            <View key={s.label} style={{ flex: i === 0 ? undefined : 1, flexDirection: 'row', alignItems: 'flex-start' }}>
              {i > 0 && (
                <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.night3, marginTop: 17, marginHorizontal: 6, overflow: 'hidden' }}>
                  <Animated.View style={{ flex: 1, backgroundColor: C.haldi, transformOrigin: 'left', transform: [{ scaleX: on ? 1 : 0 }], transitionProperty: 'transform', transitionDuration: 500, transitionTimingFunction: CSS_EASE_IN_OUT }} />
                </View>
              )}
              <View style={{ alignItems: 'center', gap: 8, width: 64 }}>
                <Animated.View
                  style={{
                    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: on ? (i === 2 ? C.leaf : C.haldi) : C.night3,
                    transform: [{ scale: on ? 1 : 0.86 }],
                    transitionProperty: ['backgroundColor', 'transform'], transitionDuration: 260, transitionTimingFunction: BOUNCE,
                  }}
                >
                  <Animated.View
                    style={i === 1 && step === 1 ? { animationName: { '0%': { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1.22 }, { rotate: '-6deg' }] }, '100%': { transform: [{ scale: 1 }] } }, animationDuration: '380ms', animationIterationCount: 3 } : undefined}
                  >
                    <Icon name={s.icon} size={18} color={on ? (i === 2 ? C.chalk : C.ink) : C.nightMuted} />
                  </Animated.View>
                </Animated.View>
                <T v="label" color={on ? C.nightText : C.nightMuted}>{s.label}</T>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------- 4. skip the queue, show the code ----------

const QUEUE = 5;

function PickupScene({ scale }: { scale: number }) {
  const [digits, setDigits] = useState(0);
  const [done, setDone] = useState(false);
  useCues([
    [520, fx.swipe],
    ...[0, 1, 2, 3].map((i) => [1350 + i * 110, () => { setDigits(i + 1); fx.tick(); }] as [number, () => void]),
    [2050, () => { setDone(true); fx.success(); }],
  ]);
  const hop = 6 + QUEUE * 30;
  return (
    <View style={{ width: 330, height: 330, transform: [{ scale }], alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 96 }}>
        <Animated.View style={[{ marginRight: 14 }, rise(60, 10)]}>
          <CartMark size={64} awning={C.haldi} stripe={C.chalk} cart={C.chalk} />
        </Animated.View>
        <View style={{ width: 30 }} />
        {Array.from({ length: QUEUE }, (_, i) => (
          <Animated.View key={i} style={[{ width: 30, alignItems: 'center' }, rise(100 + i * 50, 10)]}>
            <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: C.night3 }} />
            <View style={{ width: 22, height: 30, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderRadius: 4, backgroundColor: C.night3, marginTop: 3 }} />
          </Animated.View>
        ))}
        <Animated.View
          style={{
            width: 30, alignItems: 'center', opacity: 0,
            animationName: {
              '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] },
              '12%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }] },
              '55%': { opacity: 1, transform: [{ translateX: -hop * 0.55 }, { translateY: -54 }] },
              '100%': { opacity: 1, transform: [{ translateX: -hop }, { translateY: 0 }] },
            },
            animationDuration: '820ms', animationDelay: 380, animationTimingFunction: CSS_EASE_IN_OUT, animationFillMode: 'forwards',
          }}
        >
          <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: C.haldi }} />
          <View style={{ width: 22, height: 30, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderRadius: 4, backgroundColor: C.haldi, marginTop: 3 }} />
        </Animated.View>
      </View>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.chalk, borderRadius: R.token, padding: 16 }, rise(1150, 24)]}>
        <View style={{ gap: 6 }}>
          <T v="small" color={C.ink3}>Pickup code</T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {'4821'.split('').map((d, i) => (
              <View key={i} style={{ width: 36, height: 46, borderRadius: 10, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {digits > i && (
                  <Animated.View style={{ animationName: { from: { opacity: 0, transform: [{ translateY: -18 }, { rotateX: '80deg' }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { rotateX: '0deg' }] } }, animationDuration: '220ms', animationTimingFunction: CSS_EASE_OUT }}>
                    <T v="h1" tab>{d}</T>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        </View>
        <Animated.View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: done ? C.leaf : C.line, alignItems: 'center', justifyContent: 'center', transitionProperty: 'backgroundColor', transitionDuration: 200 }}>
          {done && (
            <Animated.View style={{ animationName: { from: { opacity: 0, transform: [{ scale: 0.4 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } }, animationDuration: '300ms', animationTimingFunction: BOUNCE }}>
              <Icon name="check-bold" size={28} color={C.chalk} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ---------- screen ----------

const SLIDES = [
  { title: 'Skip the lunch queue.', body: "Order ahead from every stall at CU and pick it up the moment it's hot." },
  { title: 'Pick a stall. Fill your cart.', body: 'Seven campus stalls with live menus, prices and wait times. One tap to add.' },
  { title: 'Watch it cook, live.', body: 'Your token moves from kitchen to counter in real time. We buzz you when it is ready.' },
  { title: 'Show your code. Grab it.', body: 'Walk past the line, flash your 4-digit code at the counter, done.' },
];

export default function Onboarding() {
  const { width, height, desktop, wide } = useLayout();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const done = () => {
    useSettings.getState().set({ onboarded: true });
    router.replace('/login');
  };
  const go = (i: number) => {
    if (i >= SLIDES.length) return done();
    const next = Math.max(0, i);
    scroller.current?.scrollTo({ x: next * width, animated: true });
    if (next !== index) {
      fx.swipe();
      setIndex(next);
    }
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      fx.swipe();
      setIndex(i);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const sceneH = desktop ? Math.min(520, height * 0.62) : Math.min(380, height * 0.46);
  const sceneScale = Math.min(1.25, Math.max(0.72, Math.min(width * (desktop ? 0.5 : 0.86), sceneH) / 360));
  const logoSize = Math.min(desktop ? 300 : 230, width * 0.56);

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={Platform.OS === 'web' ? onEnd : undefined}
        scrollEventThrottle={32}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <View
              key={i}
              style={{
                width, flex: 1, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 120,
                flexDirection: wide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: desktop ? 72 : 24, gap: desktop ? 64 : 12,
              }}
            >
              <View style={{ flex: wide ? 1.1 : undefined, height: sceneH, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                {active && (i === 0 ? <BrandScene key="b" size={logoSize} /> : i === 1 ? <OrderScene scale={sceneScale} /> : i === 2 ? <TrackScene scale={sceneScale} /> : <PickupScene scale={sceneScale} />)}
              </View>
              <View style={{ flex: wide ? 1 : undefined, maxWidth: 460, alignSelf: wide ? 'center' : 'stretch' }} key={active ? `on${i}` : `off${i}`}>
                <Animated.View style={rise(i === 0 ? 1350 : 120)}>
                  <T v="display" color={C.nightText} style={desktop ? { fontSize: 54, lineHeight: 56, letterSpacing: -2.2 } : undefined}>{s.title}</T>
                </Animated.View>
                <Animated.View style={rise(i === 0 ? 1450 : 200)}>
                  <T v="body" color={C.nightMuted} style={{ marginTop: 14, fontSize: desktop ? 18 : 16, lineHeight: desktop ? 26 : 23 }}>{s.body}</T>
                </Animated.View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ position: 'absolute', top: insets.top + 12, right: desktop ? 40 : 16 }}>
        {index < SLIDES.length - 1 && (
          <Press onPress={done} feedback="tap" style={{ paddingHorizontal: 16, height: 40, borderRadius: R.pill, backgroundColor: C.night2, justifyContent: 'center' }}>
            <T v="label" color={C.nightText}>Skip</T>
          </Press>
        )}
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 24, paddingHorizontal: desktop ? 72 : 24 }}>
        <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}>
            {SLIDES.map((_, i) => (
              <Press key={i} onPress={() => go(i)} feedback="none" hitSlop={10} accessibilityLabel={`Go to step ${i + 1}`}>
                <Animated.View style={{ width: i === index ? 30 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? C.haldi : C.night3, transitionProperty: ['width', 'backgroundColor'], transitionDuration: 260, transitionTimingFunction: CSS_EASE_OUT }} />
              </Press>
            ))}
          </View>
          <Button
            label={index === SLIDES.length - 1 ? 'Get started' : 'Next'}
            iconRight="arrow-right-bold"
            onPress={() => go(index + 1)}
            feedback="none"
            style={{ minWidth: 150 }}
          />
        </View>
      </View>
    </View>
  );
}
