import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { OptionSheet, SheetOption } from '../components/ui/OptionSheet';
import { useT, type StringKey } from '../i18n/strings';
import { usePro } from '../purchases/ProContext';
import { useAuth } from '../session/AuthContext';
import { isBiometricAvailable } from '../session/biometrics';
import { LoginScreen } from './LoginScreen';
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
import { openLink, requestAppReview, PRIVACY_URL, TERMS_URL } from '../utils/links';
import { useMoney } from '../utils/money';

interface ProfileScreenProps {
  /** Net monthly income from the latest calculation, if any. */
  net: number;
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

function ProfileScreenBase({ net }: ProfileScreenProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const { settings, update } = useSettings();
  const { user, signOut, deleteAccount } = useAuth();
  const { isPro, loading: proLoading, purchase, restore } = usePro();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeLogin = useCallback(() => setShowLogin(false), []);

  // Confirm before dropping the session (irreversible without re-auth).
  const confirmSignOut = useCallback(() => {
    Alert.alert(tr('profile.signOut'), '', [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('profile.signOut'), style: 'destructive', onPress: signOut },
    ]);
  }, [tr, signOut]);

  // Permanent account deletion (store data-deletion requirement). Confirm first;
  // on failure surface an error rather than silently leaving the account intact.
  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      tr('profile.deleteAccount.confirmTitle'),
      tr('profile.deleteAccount.confirmBody'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('profile.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            deleteAccount().catch(() =>
              Alert.alert(
                tr('profile.deleteAccount.errorTitle'),
                tr('profile.deleteAccount.errorBody'),
              ),
            );
          },
        },
      ],
    );
  }, [tr, deleteAccount]);
  // Run the RevenueCat purchase flow. Falls back to a friendly "not available"
  // message when no API key is configured (purchasesEnabled === false), and
  // surfaces cancel/error gracefully like the rest of the app.
  const buyPro = useCallback(async () => {
    const outcome = await purchase();
    switch (outcome.status) {
      case 'success':
        Alert.alert(tr('pro.success.title'), tr('pro.success.body'));
        break;
      case 'cancelled':
        break; // user backed out — stay silent
      case 'unavailable':
        Alert.alert(tr('pro.unavailable.title'), tr('pro.unavailable.body'));
        break;
      case 'error':
        Alert.alert(tr('pro.error.title'), tr('pro.error.body'));
        break;
    }
  }, [purchase, tr]);

  // App Store policy requires a visible "Restore Purchases" affordance.
  const restorePro = useCallback(async () => {
    const ok = await restore();
    Alert.alert(
      ok ? tr('pro.restore.okTitle') : tr('pro.restore.noneTitle'),
      ok ? tr('pro.restore.okBody') : tr('pro.restore.noneBody'),
    );
  }, [restore, tr]);

  // Toggle the app-lock. Turning it on requires enrolled biometrics; otherwise
  // we'd lock the user behind a prompt that can never succeed.
  const toggleBiometric = useCallback(async () => {
    if (settings.biometricLock) {
      update({ biometricLock: false });
      return;
    }
    if (!(await isBiometricAvailable())) {
      Alert.alert(tr('biometric.unavailable.title'), tr('biometric.unavailable.body'));
      return;
    }
    update({ biometricLock: true });
  }, [settings.biometricLock, update, tr]);

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
      {
        icon: 'finger-print-outline',
        label: tr('settings.biometric'),
        value: settings.biometricLock ? tr('common.on') : tr('common.off'),
        onPress: toggleBiometric,
      },
    ],
    [
      tr,
      appearanceValueKey,
      languageValueKey,
      settings.taxYear,
      settings.currency,
      settings.biometricLock,
      toggleBiometric,
    ],
  );

  const support: readonly RowSpec[] = useMemo(
    () => [
      {
        icon: 'document-text-outline',
        label: tr('profile.row.terms'),
        onPress: () => openLink(TERMS_URL),
      },
      {
        icon: 'shield-checkmark-outline',
        label: tr('profile.row.privacy'),
        onPress: () => openLink(PRIVACY_URL),
      },
      { icon: 'star-outline', label: tr('profile.row.rate'), onPress: requestAppReview },
    ],
    [tr],
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
            <Ionicons name={user ? 'person' : 'person-outline'} size={30} color={t.primary} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user ? user.name : tr('profile.guest')}</Text>
            <Text style={styles.sub}>{user ? user.email : tr('profile.guestSub')}</Text>
          </View>
        </Card>

        {user ? (
          <>
            <GlowButton
              label={tr('profile.signOut')}
              icon="log-out-outline"
              variant="outline"
              color={t.textMuted}
              onPress={confirmSignOut}
            />
            <Pressable
              onPress={confirmDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel={tr('profile.deleteAccount')}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>{tr('profile.deleteAccount')}</Text>
            </Pressable>
          </>
        ) : (
          <GlowButton
            label={tr('profile.signIn')}
            icon="log-in-outline"
            onPress={() => setShowLogin(true)}
          />
        )}

        {/* Premium */}
        <Card style={styles.premium}>
          <View style={styles.premiumHead}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles-outline" size={16} color={t.onAccent} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            {isPro ? null : <Text style={styles.price}>€2.99</Text>}
          </View>
          <Text style={styles.premiumTitle}>{tr('profile.proTitle')}</Text>
          <Text style={styles.premiumBody}>
            {isPro ? tr('profile.proActiveBody') : tr('profile.proBody')}
          </Text>
          {isPro ? (
            <View style={styles.proActiveRow}>
              <Ionicons name="checkmark-circle" size={20} color={t.positive} />
              <Text style={styles.proActiveText}>{tr('profile.proActive')}</Text>
            </View>
          ) : (
            <>
              <GlowButton
                label={tr('profile.proCta')}
                icon="arrow-up-circle-outline"
                onPress={buyPro}
                loading={proLoading}
                style={styles.premiumCta}
              />
              <Pressable
                onPress={restorePro}
                disabled={proLoading}
                accessibilityRole="button"
                accessibilityLabel={tr('profile.proRestore')}
                style={styles.restoreBtn}
              >
                <Text style={styles.restoreText}>{tr('profile.proRestore')}</Text>
              </Pressable>
            </>
          )}
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
        note={tr('year.note')}
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

      <Modal
        visible={showLogin}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeLogin}
      >
        <LoginScreen onDone={closeLogin} />
      </Modal>
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
    restoreBtn: { alignSelf: 'center', paddingVertical: spacing.sm },
    restoreText: { color: c.textMuted, fontSize: font.small, fontWeight: weight.semibold },
    deleteBtn: { alignSelf: 'center', paddingVertical: spacing.sm },
    deleteText: { color: c.negative, fontSize: font.small, fontWeight: weight.semibold },
    proActiveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    proActiveText: { color: c.positive, fontSize: font.body, fontWeight: weight.bold },

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
