import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * ZERØ design system — single source of truth.
 * 2026 fintech dark: monochrome slate surfaces + single blue accent.
 * Restrained, high-contrast, professional. No neon.
 */

export const colors = {
  bg: '#0B0C10',
  bgElevated: '#111319',
  card: '#15171E',
  cardAlt: '#1B1E27',
  border: '#262A35',
  text: '#F5F6F8',
  textMuted: '#9094A1',
  /** Brand accent — primary actions, active states. */
  primary: '#3D7BFF',
  primaryDim: '#2B5FD9',
  /** Semantic — calm, not neon. */
  positive: '#2FB37A',
  negative: '#E5564E',
  warning: '#D9A441',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const font = {
  hero: 48,
  big: 32,
  title: 22,
  subtitle: 17,
  body: 15,
  small: 13,
  micro: 11,
} as const;

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/**
 * Subtle accent shadow — cross-platform shadow + Android elevation.
 * Use sparingly on primary CTAs and active states. Kept restrained for a
 * professional look (no neon bloom).
 */
export function glow(color: string, intensity = 0.3, radiusPx = 16): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: intensity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      shadowColor: color,
      elevation: Math.round(radiusPx * 0.8),
    },
    default: {},
  }) as ViewStyle;
}
