import { Platform } from 'react-native';

/** Design tokens. Source of truth: docs/DESIGN.md. No colour literals outside this file. */
export const C = {
  ink: '#141414',
  ink2: '#3D3D3A',
  ink3: '#6E6E68',
  ink4: '#A3A39C',
  line: '#E3E3DE',
  canvas: '#F1F1EC',
  card: '#FCFCFA',
  chalk: '#F4F4EF',
  haldi: '#FFC21A',
  haldiDeep: '#E5A800',
  haldiSoft: '#FFF1C2',
  leaf: '#1F8A4C',
  leafSoft: '#E1F2E6',
  masala: '#E07B10',
  masalaSoft: '#FCEBD5',
  chilli: '#D93A26',
  chilliSoft: '#FBE3DF',
  night: '#141414',
  night2: '#1F1F1D',
  night3: '#2C2C29',
  nightText: '#F4F4EF',
  nightMuted: '#A6A69F',
  scrim: 'rgba(20,20,20,0.55)',
} as const;

export const F = {
  brand: 'Shrikhand_400Regular',
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  bold: 'SchibstedGrotesk_700Bold',
  heavy: 'SchibstedGrotesk_800ExtraBold',
  black: 'SchibstedGrotesk_900Black',
} as const;

/** Type scale: [fontSize, lineHeight, letterSpacing]. */
export const TYPE = {
  display: { fontFamily: F.black, fontSize: 40, lineHeight: 42, letterSpacing: -1.6 },
  h1: { fontFamily: F.black, fontSize: 30, lineHeight: 33, letterSpacing: -1.1 },
  h2: { fontFamily: F.heavy, fontSize: 22, lineHeight: 26, letterSpacing: -0.6 },
  h3: { fontFamily: F.heavy, fontSize: 17, lineHeight: 21, letterSpacing: -0.3 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  bodyStrong: { fontFamily: F.bold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  small: { fontFamily: F.medium, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  label: { fontFamily: F.bold, fontSize: 12, lineHeight: 15, letterSpacing: 0.2 },
  price: { fontFamily: F.heavy, fontSize: 15, lineHeight: 19, letterSpacing: -0.2 },
} as const;

export const R = { pill: 999, card: 22, input: 16, sheet: 28, token: 18, thumb: 16 } as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Tinted, soft elevation. Android gets a low elevation; web a CSS shadow. */
export const SHADOW = {
  card: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(20,20,20,0.05), 0 8px 24px rgba(20,20,20,0.06)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  }),
  float: Platform.select({
    web: { boxShadow: '0 10px 30px rgba(20,20,20,0.18)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  }),
} as const;

export const MAX_W = 1180;
