import { Platform, TextStyle, useColorScheme, ViewStyle } from 'react-native';
import { useSettings } from './settings/SettingsContext';

/**
 * ZERØ design system — single source of truth.
 * 2026 fintech: monochrome surfaces + single blue accent. System-adaptive
 * (light/dark follow the OS). Accent + semantic colors are identical in both
 * modes; only surfaces and text swap. Restrained, high-contrast, no neon.
 */

/** Brand + semantic — same in light and dark (tuned to read on both). */
const accent = {
  /** Brand accent — primary actions, active states. */
  primary: '#3D7BFF',
  primaryDim: '#2B5FD9',
  /** Text/icon color that sits on top of a filled accent surface. */
  onAccent: '#FFFFFF',
  /** Semantic — calm, not neon. */
  positive: '#2FB37A',
  negative: '#E5564E',
  warning: '#D9A441',
} as const;

/** Mode-specific surfaces + text. */
const darkSurfaces = {
  bg: '#0B0C10',
  bgElevated: '#111319',
  card: '#15171E',
  cardAlt: '#1B1E27',
  border: '#262A35',
  text: '#F5F6F8',
  textMuted: '#9094A1',
} as const;

const lightSurfaces = {
  bg: '#F7F8FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#EEF1F5',
  border: '#E3E6EC',
  text: '#0E1116',
  textMuted: '#5B6270',
} as const;

export type Palette = Record<keyof typeof accent | keyof typeof darkSurfaces, string>;

export const palettes: Record<'dark' | 'light', Palette> = {
  dark: { ...accent, ...darkSurfaces },
  light: { ...accent, ...lightSurfaces },
};

/**
 * Resolved color scheme ('light' | 'dark'), honoring the appearance preference:
 *   - 'system' → follow the OS color scheme (re-renders on OS toggle)
 *   - 'light' / 'dark' → forced override
 */
export function useResolvedMode(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const { settings } = useSettings();
  const mode = settings.themeMode === 'system' ? scheme : settings.themeMode;
  return mode === 'light' ? 'light' : 'dark';
}

/** Active palette for the resolved color scheme. */
export function useTheme(): Palette {
  return palettes[useResolvedMode()];
}

/**
 * Static dark palette. Safe only for accent/semantic colors (identical in both
 * modes). For surfaces/text inside a component, use `useTheme()` instead.
 */
export const colors = palettes.dark;

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
