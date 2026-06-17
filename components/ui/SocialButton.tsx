import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { font, radius, spacing, useResolvedMode, useTheme, weight } from '../../theme';

type Brand = 'google' | 'apple';

interface SocialButtonProps {
  brand: Brand;
  label: string;
  onPress: () => void;
  /** Shows a spinner and blocks taps while a sign-in is in flight. */
  loading?: boolean;
  /** Dimmed + non-interactive (e.g. another provider is signing in). */
  disabled?: boolean;
}

/**
 * Provider sign-in button styled to each brand's convention:
 *   • Google → light surface, full-color "G".
 *   • Apple  → solid black (light mode) / white (dark mode) per Apple HIG.
 * Mirrors GlowButton's press-scale + haptic interaction.
 */
function SocialButtonBase({ brand, label, onPress, loading = false, disabled = false }: SocialButtonProps) {
  const c = useTheme();
  const isLight = useResolvedMode() === 'light';
  const scale = useRef(new Animated.Value(1)).current;
  const blocked = loading || disabled;

  const animate = useCallback(
    (to: number) => {
      Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    },
    [scale],
  );

  const handlePress = useCallback(() => {
    if (blocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress();
  }, [blocked, onPress]);

  // Apple flips with the scheme; Google stays a light chip in both modes.
  const appleBg = isLight ? '#000000' : '#FFFFFF';
  const appleFg = isLight ? '#FFFFFF' : '#000000';
  const bg = brand === 'apple' ? appleBg : '#FFFFFF';
  const fg = brand === 'apple' ? appleFg : '#1F1F1F';
  const iconColor = brand === 'apple' ? appleFg : '#4285F4';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => !blocked && animate(0.97)}
        onPressOut={() => !blocked && animate(1)}
        onPress={handlePress}
        disabled={blocked}
        style={[
          styles.btn,
          { backgroundColor: bg, borderColor: c.border },
          disabled && styles.dimmed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            <Ionicons name={brand === 'apple' ? 'logo-apple' : 'logo-google'} size={20} color={iconColor} />
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  dimmed: { opacity: 0.4 },
  label: { fontSize: font.subtitle, fontWeight: weight.semibold, letterSpacing: 0.2 },
});

export const SocialButton = memo(SocialButtonBase);
