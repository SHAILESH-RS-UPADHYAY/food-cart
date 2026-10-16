import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** phone < 700 <= tablet < 1100 <= desktop */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 1100;
  const tablet = !desktop && width >= 700;
  return { width, height, phone: !desktop && !tablet, tablet, desktop, wide: tablet || desktop };
}

export const TAB_BAR_H = 66;
export const TOP_NAV_H = 72;

/** Space a tab screen leaves for the bars: floating tab bar (phone) or top nav (desktop). */
export function useTabInsets() {
  const insets = useSafeAreaInsets();
  const { desktop } = useLayout();
  return desktop ? { top: TOP_NAV_H + 8, bottom: 48 } : { top: insets.top + 8, bottom: insets.bottom + TAB_BAR_H + 30 };
}
