import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT, type StringKey } from '../../i18n/strings';
import { font, Palette, radius, spacing, useTheme, weight } from '../../theme';
import { IconName, Mode } from '../../types';

interface Segment {
  value: Mode;
  labelKey: StringKey;
  icon: IconName;
}

interface SegmentControlProps {
  value: Mode;
  onChange: (value: Mode) => void;
}

const SEGMENTS: readonly Segment[] = [
  { value: 'employee', labelKey: 'mode.employee', icon: 'briefcase-outline' },
  { value: 'freelancer', labelKey: 'mode.freelancer', icon: 'document-text-outline' },
];

function SegmentControlBase({ value, onChange }: SegmentControlProps) {
  const c = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
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
              color={active ? c.onAccent : c.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{t(seg.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderColor: c.border,
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
      backgroundColor: c.primary,
    },
    label: {
      color: c.textMuted,
      fontSize: font.body,
      fontWeight: weight.semibold,
    },
    labelActive: {
      color: c.onAccent,
      fontWeight: weight.bold,
    },
  });

export const SegmentControl = memo(SegmentControlBase);
