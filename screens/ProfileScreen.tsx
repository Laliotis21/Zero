import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { OptionSheet, SheetOption } from '../components/ui/OptionSheet';
import { useT, type StringKey } from '../i18n/strings';
import {
  Currency,
  Language,
  TaxYear,
  ThemeMode,
  useSettings,
} from '../settings/SettingsContext';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';
import { IconName } from '../types';
import { CURRENCY_SYMBOL } from '../utils/format';
import { useMoney } from '../utils/money';

interface ProfileScreenProps {
  /** Net monthly income from the latest calculation, if any. */
  net: number;
  /** Jump to the premium / budget upsell. */
  onUpgrade: () => void;
}

type SheetKind = 'appearance' | 'language' | 'taxYear' | 'currency';

interface RowSpec {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
}

interface RowGroupProps {
  rows: readonly RowSpec[];
  styles: ReturnType<typeof makeStyles>;
  iconColor: string;
  muted: string;
}

/** A grouped settings list inside a single Card, with hairline dividers. */
const RowGroup = memo(function RowGroup({ rows, styles, iconColor, muted }: RowGroupProps) {
  return (
    <Card compact>
      {rows.map((row, i) => (
        <View key={row.label}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            style={styles.row}
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={row.label}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={row.icon} size={20} color={iconColor} />
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <View style={styles.rowRight}>
              {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </View>
          </Pressable>
        </View>
      ))}
    </Card>
  );
});

function ProfileScreenBase({ net, onUpgrade }: ProfileScreenProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const { settings, update } = useSettings();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const noop = useCallback(() => undefined, []);

  const appearanceValueKey: StringKey = `appearance.${settings.themeMode}` as StringKey;
  const languageValueKey: StringKey = `language.${settings.language}` as StringKey;

  const preferences: readonly RowSpec[] = useMemo(
    () => [
      {
        icon: 'contrast-outline',
        label: tr('profile.row.appearance'),
        value: tr(appearanceValueKey),
        onPress: () => setSheet('appearance'),
      },
      {
        icon: 'language-outline',
        label: tr('profile.row.language'),
        value: tr(languageValueKey),
        onPress: () => setSheet('language'),
      },
      {
        icon: 'calendar-outline',
        label: tr('profile.row.taxYear'),
        value: String(settings.taxYear),
        onPress: () => setSheet('taxYear'),
      },
      {
        icon: 'cash-outline',
        label: tr('profile.row.currency'),
        value: `${settings.currency} (${CURRENCY_SYMBOL[settings.currency]})`,
        onPress: () => setSheet('currency'),
      },
    ],
    [tr, appearanceValueKey, languageValueKey, settings.taxYear, settings.currency],
  );

  const support: readonly RowSpec[] = useMemo(
    () => [
      { icon: 'document-text-outline', label: tr('profile.row.terms'), onPress: noop },
      { icon: 'shield-checkmark-outline', label: tr('profile.row.privacy'), onPress: noop },
      { icon: 'star-outline', label: tr('profile.row.rate'), onPress: noop },
    ],
    [tr, noop],
  );

  // Sheet option lists.
  const appearanceOptions: readonly SheetOption<ThemeMode>[] = useMemo(
    () => [
      { value: 'system', label: tr('appearance.system') },
      { value: 'light', label: tr('appearance.light') },
      { value: 'dark', label: tr('appearance.dark') },
    ],
    [tr],
  );
  const languageOptions: readonly SheetOption<Language>[] = useMemo(
    () => [
      { value: 'el', label: tr('language.el') },
      { value: 'en', label: tr('language.en') },
    ],
    [tr],
  );
  const yearOptions: readonly SheetOption<TaxYear>[] = useMemo(
    () => [
      { value: 2026, label: '2026' },
      { value: 2025, label: '2025' },
    ],
    [],
  );
  const currencyOptions: readonly SheetOption<Currency>[] = useMemo(
    () => [
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'USD', label: 'USD ($)' },
      { value: 'GBP', label: 'GBP (£)' },
    ],
    [],
  );

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>{tr('profile.title')}</Text>

        {/* Identity */}
        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={30} color={t.primary} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{tr('profile.guest')}</Text>
            <Text style={styles.sub}>{tr('profile.guestSub')}</Text>
          </View>
        </Card>

        <GlowButton label={tr('profile.signIn')} icon="log-in-outline" onPress={noop} />

        {/* Premium */}
        <Card style={styles.premium}>
          <View style={styles.premiumHead}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles-outline" size={16} color={t.onAccent} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.price}>€2.99</Text>
          </View>
          <Text style={styles.premiumTitle}>{tr('profile.proTitle')}</Text>
          <Text style={styles.premiumBody}>{tr('profile.proBody')}</Text>
          <GlowButton
            label={tr('profile.proCta')}
            icon="arrow-up-circle-outline"
            onPress={onUpgrade}
            style={styles.premiumCta}
          />
        </Card>

        {/* Quick stat — last net */}
        {net > 0 ? (
          <Card style={styles.statRow} compact>
            <View style={styles.rowLeft}>
              <Ionicons name="wallet-outline" size={20} color={t.positive} />
              <Text style={styles.rowLabel}>{tr('profile.lastNet')}</Text>
            </View>
            <Text style={styles.statValue}>{money.format(net)}</Text>
          </Card>
        ) : null}

        <Text style={styles.sectionLabel}>{tr('profile.section.prefs')}</Text>
        <RowGroup rows={preferences} styles={styles} iconColor={t.text} muted={t.textMuted} />

        <Text style={styles.sectionLabel}>{tr('profile.section.support')}</Text>
        <RowGroup rows={support} styles={styles} iconColor={t.text} muted={t.textMuted} />

        <Text style={styles.version}>{tr('profile.version')}</Text>
      </ScrollView>

      <OptionSheet<ThemeMode>
        visible={sheet === 'appearance'}
        title={tr('profile.row.appearance')}
        options={appearanceOptions}
        selected={settings.themeMode}
        onSelect={(v) => update({ themeMode: v })}
        onClose={closeSheet}
      />
      <OptionSheet<Language>
        visible={sheet === 'language'}
        title={tr('profile.row.language')}
        options={languageOptions}
        selected={settings.language}
        onSelect={(v) => update({ language: v })}
        onClose={closeSheet}
      />
      <OptionSheet<TaxYear>
        visible={sheet === 'taxYear'}
        title={tr('profile.row.taxYear')}
        options={yearOptions}
        selected={settings.taxYear}
        onSelect={(v) => update({ taxYear: v })}
        onClose={closeSheet}
      />
      <OptionSheet<Currency>
        visible={sheet === 'currency'}
        title={tr('profile.row.currency')}
        options={currencyOptions}
        selected={settings.currency}
        onSelect={(v) => update({ currency: v })}
        onClose={closeSheet}
        note={tr('currency.note')}
      />
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
    screenTitle: {
      color: c.text,
      fontSize: font.title,
      fontWeight: weight.bold,
      paddingTop: spacing.sm,
      marginBottom: spacing.xs,
    },

    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: radius.full,
      backgroundColor: c.cardAlt,
      borderColor: c.primary,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityText: { flex: 1, gap: 2 },
    name: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold },
    sub: { color: c.textMuted, fontSize: font.small },

    premium: { gap: spacing.sm, borderColor: c.primary },
    premiumHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: c.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 3,
    },
    proBadgeText: { color: c.onAccent, fontSize: font.small, fontWeight: weight.black, letterSpacing: 1 },
    price: { color: c.primary, fontSize: font.subtitle, fontWeight: weight.black },
    premiumTitle: { color: c.text, fontSize: font.title, fontWeight: weight.black },
    premiumBody: { color: c.textMuted, fontSize: font.small, lineHeight: 20 },
    premiumCta: { alignSelf: 'stretch', marginTop: spacing.xs },

    statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statValue: { color: c.positive, fontSize: font.subtitle, fontWeight: weight.black },

    sectionLabel: {
      color: c.textMuted,
      fontSize: font.micro,
      fontWeight: weight.bold,
      letterSpacing: 1,
      marginTop: spacing.sm,
      marginLeft: spacing.xs,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
    rowLabel: { color: c.text, fontSize: font.body, fontWeight: weight.medium, flexShrink: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    rowValue: { color: c.textMuted, fontSize: font.body },
    divider: { height: 1, backgroundColor: c.border },

    version: {
      color: c.textMuted,
      fontSize: font.small,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });

export const ProfileScreen = memo(ProfileScreenBase);
