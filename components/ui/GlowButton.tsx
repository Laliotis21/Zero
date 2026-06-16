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

interface GlowButtonProps {
  label: string;
  onPress?: () => void;
  color?: string;
  /** Outline (ghost) instead of filled neon. */
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
}

/** Full-width neon CTA with press-scale + haptic feedback. */
function GlowButtonBase({
  label,
  onPress,
  color = colors.neonGreen,
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
    ? { backgroundColor: color, ...glow(color, 0.6, 22) }
    : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color };

  const textStyle: TextStyle = { color: isSolid ? colors.bg : color };

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
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: font.subtitle,
    fontWeight: weight.bold,
    letterSpacing: 0.5,
  },
});

export const GlowButton = memo(GlowButtonBase);
