import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';
import { IconName } from '../types';
import { formatEuro } from '../utils/format';

interface ProfileScreenProps {
  /** Net monthly income from the latest calculation, if any. */
  net: number;
  /** Jump to the premium / budget upsell. */
  onUpgrade: () => void;
}

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
  const styles = useMemo(() => makeStyles(t), [t]);

  const noop = useCallback(() => undefined, []);

  const preferences: readonly RowSpec[] = useMemo(
    () => [
      { icon: 'contrast-outline', label: 'Εμφάνιση', value: 'Αυτόματο', onPress: noop },
      { icon: 'language-outline', label: 'Γλώσσα', value: 'Ελληνικά', onPress: noop },
      { icon: 'calendar-outline', label: 'Φορολογικό έτος', value: '2026', onPress: noop },
      { icon: 'cash-outline', label: 'Νόμισμα', value: 'EUR (€)', onPress: noop },
    ],
    [noop],
  );

  const support: readonly RowSpec[] = useMemo(
    () => [
      { icon: 'document-text-outline', label: 'Όροι χρήσης', onPress: noop },
      { icon: 'shield-checkmark-outline', label: 'Απόρρητο', onPress: noop },
      { icon: 'star-outline', label: 'Βαθμολόγησε την εφαρμογή', onPress: noop },
    ],
    [noop],
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Προφίλ</Text>

      {/* Identity */}
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={30} color={t.primary} />
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>Επισκέπτης</Text>
          <Text style={styles.sub}>Σύνδεση για αποθήκευση υπολογισμών</Text>
        </View>
      </Card>

      <GlowButton label="Σύνδεση / Εγγραφή" icon="log-in-outline" onPress={noop} />

      {/* Premium */}
      <Card style={styles.premium}>
        <View style={styles.premiumHead}>
          <View style={styles.proBadge}>
            <Ionicons name="sparkles-outline" size={16} color={t.onAccent} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.price}>€2.99</Text>
        </View>
        <Text style={styles.premiumTitle}>ZERØ Pro</Text>
        <Text style={styles.premiumBody}>
          AI Reverse Pricing, απεριόριστα σενάρια, εξαγωγή PDF χωρίς watermark.
        </Text>
        <GlowButton
          label="Απόκτησε Pro"
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
            <Text style={styles.rowLabel}>Τελευταίο καθαρό</Text>
          </View>
          <Text style={styles.statValue}>{formatEuro(net)}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>ΠΡΟΤΙΜΗΣΕΙΣ</Text>
      <RowGroup rows={preferences} styles={styles} iconColor={t.text} muted={t.textMuted} />

      <Text style={styles.sectionLabel}>ΥΠΟΣΤΗΡΙΞΗ</Text>
      <RowGroup rows={support} styles={styles} iconColor={t.text} muted={t.textMuted} />

      <Text style={styles.version}>ZERØ v1.0.0</Text>
    </ScrollView>
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
