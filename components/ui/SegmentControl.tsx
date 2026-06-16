import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, glow, radius, spacing, weight } from '../../theme';
import { Mode } from '../../types';

interface Segment {
  value: Mode;
  label: string;
}

interface SegmentControlProps {
  value: Mode;
  onChange: (value: Mode) => void;
}

const SEGMENTS: readonly Segment[] = [
  { value: 'employee', label: '💼 Μισθωτός' },
  { value: 'freelancer', label: '🚀 Μπλοκάκι' },
];

function SegmentControlBase({ value, onChange }: SegmentControlProps) {
  const handle = useCallback((v: Mode) => () => onChange(v), [onChange]);

  return (
    <View style={styles.track}>
      {SEGMENTS.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={handle(seg.value)}
            style={[styles.pill, active && styles.pillActive, active && glow(colors.neonGreen, 0.35, 14)]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{seg.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  pill: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.neonGreen,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: weight.semibold,
  },
  labelActive: {
    color: colors.bg,
    fontWeight: weight.bold,
  },
});

export const SegmentControl = memo(SegmentControlBase);
