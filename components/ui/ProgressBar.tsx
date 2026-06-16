import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, glow, radius } from '../../theme';

interface ProgressBarProps {
  /** Ratio of the "good" (net) portion, 0..1. */
  ratio: number;
  goodColor?: string;
  badColor?: string;
  height?: number;
}

/** Ultra-thin neon-glow split bar — net (good) vs deductions (bad). */
function ProgressBarBase({
  ratio,
  goodColor = colors.neonGreen,
  badColor = colors.danger,
  height = 8,
}: ProgressBarProps) {
  const pct = useMemo(() => Math.max(0, Math.min(1, ratio)) * 100, [ratio]);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: badColor }, glow(badColor, 0.25, 10)]}>
      <View
        style={[
          styles.fill,
          glow(goodColor, 0.6, 12),
          { width: `${pct}%`, backgroundColor: goodColor, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  fill: {
    height: '100%',
  },
});

export const ProgressBar = memo(ProgressBarBase);
