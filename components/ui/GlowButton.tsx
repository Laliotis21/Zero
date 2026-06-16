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
  style?: ViewStyle;
}

/** Full-width accent CTA with press-scale + haptic feedback. */
function GlowButtonBase({
  label,
  onPress,
  color = colors.primary,
  icon,
  variant = 'solid',
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
    // Haptic feedback placeholder — silently ignore on unsupported platforms (web).
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress?.();
  }, [onPress]);

  const containerStyle: ViewStyle = isSolid
    ? { backgroundColor: color, ...glow(color, 0.4, 18) }
    : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color };

  const tint = isSolid ? colors.bg : color;
  const textStyle: TextStyle = { color: tint };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        onPress={handlePress}
        style={[styles.btn, containerStyle]}
        accessibilityRole="button"
        accessibilityLabel={label}
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
  icon: { marginRight: spacing.sm },
  label: {
    fontSize: font.subtitle,
    fontWeight: weight.bold,
    letterSpacing: 0.3,
  },
});

export const GlowButton = memo(GlowButtonBase);
