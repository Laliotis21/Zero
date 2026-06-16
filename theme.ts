import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * ZERØ design system — single source of truth.
 * 2026 OLED dark / Bento / glassmorphism / neon micro-accents.
 */

export const colors = {
  bg: '#0D0E15',
  bgElevated: '#12131C',
  card: '#1A1C28',
  cardAlt: '#1E2030',
  border: '#222538',
  text: '#FFFFFF',
  textMuted: '#8E92A7',
  neonGreen: '#00E676',
  cyan: '#00E5FF',
  danger: '#FF5470',
  amber: '#FFB020',
  glassFill: 'rgba(255,255,255,0.04)',
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
  hero: 56,
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
 * Neon glow helper — cross-platform shadow + Android elevation.
 * Use on CTAs, active tabs, hero numbers.
 */
export function glow(color: string, intensity = 0.55, radiusPx = 16): ViewStyle {
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
