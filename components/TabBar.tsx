import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, glow, radius, spacing, weight } from '../theme';
import { ScreenKey } from '../types';

interface TabDef {
  key: ScreenKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  active: ScreenKey;
  onChange: (key: ScreenKey) => void;
}

const TABS: readonly TabDef[] = [
  { key: 'home', label: 'Είσοδος', icon: 'calculator-outline' },
  { key: 'results', label: 'Αποτέλεσμα', icon: 'pie-chart-outline' },
  { key: 'budget', label: 'Budget', icon: 'sparkles-outline' },
];

function TabBarBase({ active, onChange }: TabBarProps) {
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
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive, isActive && glow(colors.neonGreen, 0.5, 14)]}>
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? colors.bg : colors.textMuted}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.border,
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
    backgroundColor: colors.neonGreen,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.micro,
    fontWeight: weight.medium,
  },
  labelActive: {
    color: colors.text,
    fontWeight: weight.bold,
  },
});

export const TabBar = memo(TabBarBase);
