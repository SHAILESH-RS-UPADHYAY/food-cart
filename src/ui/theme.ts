import { Platform } from 'react-native';

/**
 * Design tokens. Source of truth: docs/DESIGN.md. No colour literals outside this file.
 * Brand: clean white, graphite type, one deep ultramarine accent. Ultramarine is the
 * complement of food tones (oranges, browns, yellows), so photography looks richer next to it.
 * Contrast checked to WCAG AA (docs/DESIGN.md).
 */
export const C = {
  ink: '#15161C',
  ink2: '#3F4250',
  ink3: '#666A79',
  ink4: '#A3A7B5',
  line: '#E6E8EF',
  /** page background */
  canvas: '#FFFFFF',
  /** tiles, inputs, inactive chips */
  card: '#F5F6FA',
  /** light text on photos, ultramarine and graphite */
  chalk: '#FFFFFF',
  accent: '#2E4BFF',
  accentDeep: '#2238D6',
  accentTint: '#ECEFFF',
  /** awning stripe, confetti, soft fills */
  accentSoft: '#C9D2FF',
  onAccent: '#FFFFFF',
  leaf: '#137A47',
  leafSoft: '#DCF1E4',
  masala: '#A85208',
  masalaSoft: '#FBE8D3',
  chilli: '#C42E1C',
  chilliSoft: '#FBE1DC',
  /** the cookie in the consent card */
  cookie: '#E2B07A',
  cookieChip: '#6B3E26',
  scrim: 'rgba(21,22,28,0.5)',
} as const;

export const F = {
  brand: 'Shrikhand_400Regular',
  display: 'AnekLatin_800ExtraBold',
  displayBold: 'AnekLatin_700Bold',
  displaySemi: 'AnekLatin_600SemiBold',
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  bold: 'SchibstedGrotesk_700Bold',
  heavy: 'SchibstedGrotesk_800ExtraBold',
  black: 'SchibstedGrotesk_900Black',
} as const;

/** Display sizes use Anek Latin (Ek Type, Mumbai); reading sizes use Schibsted Grotesk. */
export const TYPE = {
  display: { fontFamily: F.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.6 },
  h1: { fontFamily: F.display, fontSize: 30, lineHeight: 33, letterSpacing: -0.4 },
  h2: { fontFamily: F.displayBold, fontSize: 23, lineHeight: 27, letterSpacing: -0.2 },
  h3: { fontFamily: F.displayBold, fontSize: 18, lineHeight: 22, letterSpacing: 0 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  bodyStrong: { fontFamily: F.bold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  small: { fontFamily: F.medium, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  label: { fontFamily: F.bold, fontSize: 12, lineHeight: 15, letterSpacing: 0.2 },
  price: { fontFamily: F.heavy, fontSize: 15, lineHeight: 19, letterSpacing: -0.2 },
} as const;

export const R = { pill: 999, card: 22, input: 16, sheet: 28, token: 18, thumb: 16 } as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Barely-there elevation: tiles are flat cloud-grey; only floating UI casts a real shadow. */
export const SHADOW = {
  card: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(21,22,28,0.04)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 0 },
  }),
  float: Platform.select({
    web: { boxShadow: '0 12px 32px rgba(21,22,28,0.14), 0 2px 6px rgba(21,22,28,0.06)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  }),
} as const;

export const MAX_W = 1180;
