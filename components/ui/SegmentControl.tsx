import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing, weight } from '../../theme';
import { IconName, Mode } from '../../types';

interface Segment {
  value: Mode;
  label: string;
  icon: IconName;
}

interface SegmentControlProps {
  value: Mode;
  onChange: (value: Mode) => void;
}

const SEGMENTS: readonly Segment[] = [
  { value: 'employee', label: 'Μισθωτός', icon: 'briefcase-outline' },
  { value: 'freelancer', label: 'Μπλοκάκι', icon: 'document-text-outline' },
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
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={seg.icon}
              size={18}
              color={active ? colors.bg : colors.textMuted}
            />
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
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
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
