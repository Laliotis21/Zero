import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, Palette, radius, spacing, useTheme, weight } from '../../theme';

export interface SheetOption<T extends string | number> {
  value: T;
  label: string;
  sub?: string;
}

interface OptionSheetProps<T extends string | number> {
  visible: boolean;
  title: string;
  options: readonly SheetOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Optional footnote (e.g. a caveat). */
  note?: string;
}

/** Themed bottom-sheet single-select picker. */
export function OptionSheet<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  note,
}: OptionSheetProps<T>) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>

        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={String(opt.value)}
              style={styles.option}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                {opt.sub ? <Text style={styles.optionSub}>{opt.sub}</Text> : null}
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={c.primary} />
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })}

        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.bgElevated,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderColor: c.border,
      borderWidth: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      gap: spacing.xs,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: c.border,
      marginBottom: spacing.sm,
    },
    title: {
      color: c.text,
      fontSize: font.subtitle,
      fontWeight: weight.bold,
      marginBottom: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    optionText: { flexShrink: 1, gap: 2 },
    optionLabel: { color: c.text, fontSize: font.body, fontWeight: weight.medium },
    optionLabelActive: { color: c.primary, fontWeight: weight.bold },
    optionSub: { color: c.textMuted, fontSize: font.small },
    radio: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    note: {
      color: c.textMuted,
      fontSize: font.small,
      lineHeight: 18,
      marginTop: spacing.sm,
    },
  });
