import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, TextInput, View, type TextInputProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { CSS_EASE_OUT } from './motion';
import { T } from './Text';
import { C, F, R } from './theme';

type FieldProps = TextInputProps & { label: string; prefix?: string; dark?: boolean; error?: string; hint?: string };

const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

/** Label above, error below, never placeholder-as-label. */
export function Field({ label, prefix, dark, error, hint, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focus, setFocus] = useState(false);
  const fg = dark ? C.nightText : C.ink;
  return (
    <View style={{ gap: 8 }}>
      <T v="label" color={dark ? C.nightMuted : C.ink2}>{label}</T>
      <Animated.View
        style={{
          flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: R.input, paddingHorizontal: 16, gap: 10,
          backgroundColor: dark ? C.night2 : C.card, borderWidth: 1.5,
          borderColor: error ? C.chilli : focus ? (dark ? C.haldi : C.ink) : dark ? C.night3 : C.line,
          transitionProperty: 'borderColor', transitionDuration: 160, transitionTimingFunction: CSS_EASE_OUT,
        }}
      >
        {prefix && <T v="h3" color={fg} tab>{prefix}</T>}
        <TextInput
          {...rest}
          placeholderTextColor={dark ? C.nightMuted : C.ink3}
          selectionColor={C.haldi}
          onFocus={(e) => { setFocus(true); onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); onBlur?.(e); }}
          style={[{ flex: 1, height: '100%', color: fg, fontFamily: F.bold, fontSize: 18, letterSpacing: 0.2 }, noOutline, style]}
        />
      </Animated.View>
      {error ? <T v="small" color={C.chilli}>{error}</T> : hint ? <T v="small" color={dark ? C.nightMuted : C.ink3}>{hint}</T> : null}
    </View>
  );
}

/** Six boxes over one hidden input, so paste and SMS autofill both work. */
export function OtpBoxes({ value, onChange, dark, error, length = 6 }: { value: string; onChange: (v: string) => void; dark?: boolean; error?: boolean; length?: number }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focus, setFocus] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 250); // autoFocus is unreliable after a push on web
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code">
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {Array.from({ length }, (_, i) => {
          const ch = value[i];
          const active = focus && i === Math.min(value.length, length - 1);
          return (
            <Animated.View
              key={i}
              style={{
                flex: 1, maxWidth: 58, height: 64, borderRadius: R.input, alignItems: 'center', justifyContent: 'center',
                backgroundColor: dark ? C.night2 : C.card, borderWidth: 1.5,
                borderColor: error ? C.chilli : active ? C.haldi : ch ? (dark ? C.night3 : C.ink4) : dark ? C.night3 : C.line,
                transitionProperty: 'borderColor', transitionDuration: 140,
              }}
            >
              {ch ? (
                <Animated.View style={{ animationName: { from: { transform: [{ scale: 1.25 }], opacity: 0.4 }, to: { transform: [{ scale: 1 }], opacity: 1 } }, animationDuration: '180ms', animationTimingFunction: CSS_EASE_OUT }}>
                  <T v="h1" color={dark ? C.nightText : C.ink} tab>{ch}</T>
                </Animated.View>
              ) : active ? (
                <Animated.View style={{ width: 2, height: 26, backgroundColor: C.haldi, animationName: { '0%': { opacity: 1 }, '50%': { opacity: 0 }, '100%': { opacity: 1 } }, animationDuration: '1000ms', animationIterationCount: 'infinite' }} />
              ) : null}
            </Animated.View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        autoFocus
        maxLength={length}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        caretHidden
        style={{ position: 'absolute', opacity: 0.011, width: '100%', height: '100%' }}
      />
    </Pressable>
  );
}
