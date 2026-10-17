import { Platform } from 'react-native';

/**
 * Design tokens. Source of truth: docs/DESIGN.md. No colour literals outside this file.
 * Monochrome editorial system (paper, white, ink, hairlines). Colour is spent only on food
 * photography, saffron for Last call deals and green for live / veg. No blue, no violet.
 * Contrast checked to WCAG AA.
 */
export const C = {
  ink: '#111111',
  ink2: '#3F3F46',
  ink3: '#6B6B73',
  ink4: '#A1A1AA',
  line: '#E7E7E3',
  /** page background: warm-neutral paper */
  canvas: '#F7F7F5',
  /** cards, inputs, sheets */
  card: '#FFFFFF',
  /** light text on photos and ink */
  chalk: '#FFFFFF',
  /** the single interactive colour is ink, like the reference */
  accent: '#111111',
  accentDeep: '#000000',
  accentTint: '#F0F0ED',
  accentSoft: '#D6D6D1',
  onAccent: '#FFFFFF',
  /** Last call deals only */
  saffron: '#F2A007',
  saffronSoft: '#FFF5E1',
  leaf: '#15803D',
  leafSoft: '#DCFCE7',
  live: '#22C55E',
  masala: '#B45309',
  masalaSoft: '#FEF3C7',
  chilli: '#D92D20',
  chilliSoft: '#FEE4E2',
  grid: '#EBEBE6',
  /** the cookie in the consent card */
  cookie: '#E2B07A',
  cookieChip: '#6B3E26',
  scrim: 'rgba(17,17,17,0.45)',
} as const;

export const F = {
  /** italic serif for the one emphasised word in a headline, token numbers, the tagline */
  serif: 'InstrumentSerif_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Inter for everything, semibold headlines with tight tracking (AgentHub reference). */
export const TYPE = {
  display: { fontFamily: F.semi, fontSize: 38, lineHeight: 42, letterSpacing: -1.3 },
  h1: { fontFamily: F.semi, fontSize: 29, lineHeight: 34, letterSpacing: -0.9 },
  h2: { fontFamily: F.semi, fontSize: 21, lineHeight: 26, letterSpacing: -0.45 },
  h3: { fontFamily: F.semi, fontSize: 16.5, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: F.regular, fontSize: 15.5, lineHeight: 23, letterSpacing: -0.1 },
  bodyStrong: { fontFamily: F.semi, fontSize: 15, lineHeight: 21, letterSpacing: -0.15 },
  small: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  label: { fontFamily: F.medium, fontSize: 12.5, lineHeight: 16, letterSpacing: 0 },
  price: { fontFamily: F.semi, fontSize: 15, lineHeight: 19, letterSpacing: -0.2 },
} as const;

/** Soft corners, smaller than consumer-app defaults: 8 inputs, 14 cards, pill for chips/buttons. */
export const R = { pill: 999, card: 14, input: 8, sheet: 20, token: 14, thumb: 10 } as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Spatial elevation: hairline + soft ambient for tiles; layered depth only for floating UI. */
export const SHADOW = {
  card: Platform.select({
    web: { boxShadow: '0 0 0 1px rgba(17,17,17,0.06), 0 1px 2px rgba(17,17,17,0.04)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  }),
  lift: Platform.select({
    web: { boxShadow: '0 0 0 1px rgba(17,17,17,0.06), 0 12px 28px -8px rgba(17,17,17,0.18)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  }),
  float: Platform.select({
    web: { boxShadow: '0 0 0 1px rgba(17,17,17,0.06), 0 20px 44px -12px rgba(17,17,17,0.24), 0 2px 6px rgba(17,17,17,0.06)' },
    default: { shadowColor: C.ink, shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  }),
} as const;

export const MAX_W = 1180;
