import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
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
  /** Shows a spinner (in place of the label) and blocks taps while async work runs. */
  loading?: boolean;
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
  loading = false,
  disabled = false,
  style,
}: GlowButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isSolid = variant === 'solid';
  // A spinner in flight is also non-interactive — fold it into `disabled`.
  const blocked = disabled || loading;

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
    if (blocked) return;
    // Haptic feedback placeholder — silently ignore on unsupported platforms (web).
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress?.();
  }, [blocked, onPress]);

  const containerStyle: ViewStyle = isSolid
    ? { backgroundColor: color, ...(blocked ? null : glow(color, 0.4, 18)) }
    : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color };

  const tint = isSolid ? colors.onAccent : color;
  const textStyle: TextStyle = { color: tint };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, blocked && styles.disabled, style]}>
      <Pressable
        onPressIn={() => !blocked && animate(0.97)}
        onPressOut={() => !blocked && animate(1)}
        onPress={handlePress}
        disabled={blocked}
        style={[styles.btn, containerStyle]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={tint} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={20} color={tint} style={styles.icon} /> : null}
            <Text style={[styles.label, textStyle]}>{label}</Text>
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
