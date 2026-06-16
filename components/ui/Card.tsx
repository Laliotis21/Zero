import React, { memo, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Tighter padding for dense rows. */
  compact?: boolean;
}

/** Bento card shell — elevated surface + subtle border. */
function CardBase({ children, style, compact = false }: CardProps) {
  return (
    <View style={[styles.card, compact && styles.compact, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  compact: {
    padding: spacing.lg,
  },
});

export const Card = memo(CardBase);
