import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, glow } from '../../theme';

interface PulseDotProps {
  color?: string;
  size?: number;
}

/** Breathing neon dot — single Animated.loop, native-driven. */
function PulseDotBase({ color = colors.neonGreen, size = 9 }: PulseDotProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={[styles.wrap, { width: size * 2.6, height: size * 2.6 }]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <View
        style={[
          styles.core,
          glow(color, 0.9, 8),
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
  core: {},
});

export const PulseDot = memo(PulseDotBase);
