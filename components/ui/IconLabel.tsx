import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, font, spacing, weight } from '../../theme';
import { IconName } from '../../types';

interface IconLabelProps {
  name: IconName;
  label: string;
  /** Icon + text color. Defaults to primary text. */
  color?: string;
  /** Icon glyph color when it should differ from the text. */
  iconColor?: string;
  size?: number;
  textStyle?: TextStyle | TextStyle[];
}

/**
 * Inline icon + label row — replaces emoji prefixes on titles and list items.
 * Icon is vertically centered with the text baseline.
 */
function IconLabelBase({
  name,
  label,
  color = colors.text,
  iconColor,
  size = 18,
  textStyle,
}: IconLabelProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={name} size={size} color={iconColor ?? color} />
      <Text style={[styles.text, { color }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  text: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    flexShrink: 1,
  },
});

export const IconLabel = memo(IconLabelBase);
