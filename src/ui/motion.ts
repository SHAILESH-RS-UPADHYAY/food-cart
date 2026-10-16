import { cubicBezier, Easing, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

/** Curves and springs from the expo-animation skill tables. Never approximate. */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const CSS_EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

export const SPRING_SETTLE = { duration: 400, dampingRatio: 1 } as const;
export const SPRING_SNAP = { duration: 400, dampingRatio: 0.8 } as const;
export const SPRING_SHEET = { duration: 300, dampingRatio: 0.8 } as const;
export const SPRING_POP = { duration: 420, dampingRatio: 0.55 } as const;

// Layout-animation builders live at module scope (rebuilding them per render costs every render).
export const ENTER_FADE = FadeIn.duration(160).easing(EASE_OUT);
export const EXIT_FADE = FadeOut.duration(130).easing(EASE_OUT);
export const enterRise = (index = 0, base = 0) =>
  FadeInDown.duration(280).delay(base + Math.min(index, 10) * 40).easing(EASE_OUT);
