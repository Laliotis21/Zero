import React, { memo, ReactNode, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Palette, radius, spacing, useTheme } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Tighter padding for dense rows. */
  compact?: boolean;
}

/** Bento card shell — elevated surface + subtle border. */
function CardBase({ children, style, compact = false }: CardProps) {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.card, compact && styles.compact, style]}>{children}</View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.xl,
    },
    compact: {
      padding: spacing.lg,
    },
  });

export const Card = memo(CardBase);
