import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT, type StringKey } from '../i18n/strings';
import { font, glow, Palette, radius, spacing, useTheme, weight } from '../theme';
import { ScreenKey } from '../types';

interface TabDef {
  key: ScreenKey;
  labelKey: StringKey;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  active: ScreenKey;
  onChange: (key: ScreenKey) => void;
}

const TABS: readonly TabDef[] = [
  { key: 'home', labelKey: 'tab.home', icon: 'calculator-outline' },
  { key: 'results', labelKey: 'tab.results', icon: 'pie-chart-outline' },
  { key: 'budget', labelKey: 'tab.budget', icon: 'sparkles-outline' },
  { key: 'profile', labelKey: 'tab.profile', icon: 'person-outline' },
];

function TabBarBase({ active, onChange }: TabBarProps) {
  const c = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const handle = useCallback((k: ScreenKey) => () => onChange(k), [onChange]);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={handle(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive, isActive && glow(c.primary, 0.4, 14)]}>
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? c.onAccent : c.textMuted}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: c.bgElevated,
      borderTopColor: c.border,
      borderTopWidth: 1,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconWrap: {
      width: 46,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: c.primary,
    },
    label: {
      color: c.textMuted,
      fontSize: font.micro,
      fontWeight: weight.medium,
    },
    labelActive: {
      color: c.text,
      fontWeight: weight.bold,
    },
  });

export const TabBar = memo(TabBarBase);
