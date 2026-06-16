import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, font, glow, radius, spacing, weight } from '../../theme';
import { IconName } from '../../types';

interface GlowButtonProps {
  label: string;
  onPress?: () => void;
  color?: string;
  /** Optional leading icon (Ionicons). */
  icon?: IconName;
  /** Outline (ghost) instead of filled accent. */
  variant?: 'solid' | 'outline';
  /** Non-interactive + dimmed (e.g. invalid form). */
  disabled?: boolean;
  style?: ViewStyle;
}

/** Full-width accent CTA with press-scale + haptic feedback. */
function GlowButtonBase({
  label,
  onPress,
  color = colors.primary,
  icon,
  variant = 'solid',
  disabled = false,
  style,
}: GlowButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isSolid = variant === 'solid';

  const animate = useCallback(
    (to: number) => {
      Animated.spring(scale, {
        toValue: to,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
    },
    [scale],
  );

  const handlePress = useCallback(() => {
    if (disabled) return;
    // Haptic feedback placeholder — silently ignore on unsupported platforms (web).
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress?.();
  }, [disabled, onPress]);

  const containerStyle: ViewStyle = isSolid
    ? { backgroundColor: color, ...(disabled ? null : glow(color, 0.4, 18)) }
    : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color };

  const tint = isSolid ? colors.onAccent : color;
  const textStyle: TextStyle = { color: tint };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, disabled && styles.disabled, style]}>
      <Pressable
        onPressIn={() => !disabled && animate(0.97)}
        onPressOut={() => !disabled && animate(1)}
        onPress={handlePress}
        disabled={disabled}
        style={[styles.btn, containerStyle]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        {icon ? <Ionicons name={icon} size={20} color={tint} style={styles.icon} /> : null}
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  disabled: { opacity: 0.4 },
  icon: { marginRight: spacing.sm },
  label: {
    fontSize: font.subtitle,
    fontWeight: weight.bold,
    letterSpacing: 0.3,
  },
});

export const GlowButton = memo(GlowButtonBase);
