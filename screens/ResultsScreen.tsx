import React, { memo, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { colors, font, glow, radius, spacing, weight } from '../theme';
import { CalcResult } from '../types';
import { formatEuro, splitEuro } from '../utils/format';

interface ResultsScreenProps {
  result: CalcResult | null;
  onUpgrade: () => void;
}

interface DeductionRowProps {
  icon: string;
  label: string;
  amount: number;
}

const DeductionRow = memo(function DeductionRow({ icon, label, amount }: DeductionRowProps) {
  return (
    <View style={styles.dedRow}>
      <Text style={styles.dedLabel}>
        {icon}  {label}
      </Text>
      <Text style={styles.dedAmount}>{formatEuro(amount)}</Text>
    </View>
  );
});

function ResultsScreenBase({ result, onUpgrade }: ResultsScreenProps) {
  const handleUpgrade = useCallback(() => onUpgrade(), [onUpgrade]);

  const view = useMemo(() => {
    if (!result || result.net <= 0) return null;
    const { net, efka, tax } = result;
    const total = net + efka + tax;
    return {
      hero: splitEuro(net),
      efka,
      tax,
      totalDed: efka + tax,
      ratio: total > 0 ? net / total : 0,
    };
  }, [result]);

  if (!view) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>⚙️</Text>
        <Text style={styles.emptyTitle}>Κανένας υπολογισμός ακόμη</Text>
        <Text style={styles.emptyBody}>
          Συμπλήρωσε μισθό στην αρχική και πάτα ΥΠΟΛΟΓΙΣΜΟΣ.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>📊 Ανάλυση 2026</Text>

      {/* Hero net income */}
      <Card style={[styles.hero, glow(colors.cyan, 0.3, 26)]}>
        <Text style={styles.heroCaption}>💵 Καθαρά στο χέρι</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroWhole}>{view.hero.whole}</Text>
          <Text style={styles.heroCents}>,{view.hero.cents} €</Text>
        </View>
        <Text style={styles.heroSub}>/ μήνα</Text>
      </Card>

      {/* Deductions */}
      <Card style={styles.gap}>
        <Text style={styles.cardTitle}>🧾 Κρατήσεις</Text>
        <DeductionRow icon="🛡️" label="Ασφαλιστικές Εισφορές (ΕΦΚΑ)" amount={view.efka} />
        <View style={styles.divider} />
        <DeductionRow icon="🏛️" label="Φόρος Εισοδήματος" amount={view.tax} />
        <View style={styles.divider} />
        <View style={styles.dedRow}>
          <Text style={styles.totalLabel}>Σύνολο κρατήσεων</Text>
          <Text style={styles.totalAmount}>{formatEuro(view.totalDed)}</Text>
        </View>
      </Card>

      {/* Ratio bar */}
      <Card style={styles.gap}>
        <Text style={styles.cardTitle}>⚖️ Καθαρά vs Κρατήσεις</Text>
        <ProgressBar ratio={view.ratio} />
        <View style={styles.legend}>
          <Text style={styles.legendGood}>🟢 Καθαρά {Math.round(view.ratio * 100)}%</Text>
          <Text style={styles.legendBad}>🔴 Κρατήσεις {Math.round((1 - view.ratio) * 100)}%</Text>
        </View>
      </Card>

      {/* Paywall */}
      <Card style={[styles.paywall, glow(colors.cyan, 0.22, 24)]}>
        <View style={styles.lockBadge}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>
        <Text style={styles.paywallTitle}>AI Reverse Pricing</Text>
        <Text style={styles.paywallBody}>
          Βρες πόσο πρέπει να χρεώνεις ως freelancer για τον στόχο σου. Powered by AI.
        </Text>
        <Text style={styles.price}>€2.99 · one-time 💎</Text>
        <GlowButton label="⚡ Upgrade" color={colors.cyan} onPress={handleUpgrade} style={styles.upgradeBtn} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  screenTitle: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: weight.bold,
    paddingTop: spacing.sm,
  },
  gap: { gap: spacing.md },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: weight.bold },
  emptyBody: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', lineHeight: 21 },

  hero: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.xs },
  heroCaption: { color: colors.textMuted, fontSize: font.body, fontWeight: weight.medium },
  heroRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroWhole: {
    color: colors.text,
    fontSize: font.hero,
    fontWeight: weight.black,
    letterSpacing: -2,
  },
  heroCents: { color: colors.cyan, fontSize: font.big, fontWeight: weight.bold },
  heroSub: { color: colors.textMuted, fontSize: font.small },

  cardTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: weight.bold },
  dedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dedLabel: { color: colors.textMuted, fontSize: font.body, flex: 1, marginRight: spacing.md },
  dedAmount: { color: colors.text, fontSize: font.subtitle, fontWeight: weight.bold },
  divider: { height: 1, backgroundColor: colors.border },
  totalLabel: { color: colors.text, fontSize: font.body, fontWeight: weight.semibold },
  totalAmount: { color: colors.danger, fontSize: font.subtitle, fontWeight: weight.black },

  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  legendGood: { color: colors.neonGreen, fontSize: font.small, fontWeight: weight.semibold },
  legendBad: { color: colors.danger, fontSize: font.small, fontWeight: weight.semibold },

  paywall: { alignItems: 'center', gap: spacing.sm, borderColor: colors.cyan },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.cardAlt,
    borderColor: colors.cyan,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  lockEmoji: { fontSize: 26 },
  paywallTitle: { color: colors.text, fontSize: font.title, fontWeight: weight.black },
  paywallBody: { color: colors.textMuted, fontSize: font.small, textAlign: 'center', lineHeight: 20 },
  price: { color: colors.cyan, fontSize: font.body, fontWeight: weight.bold, marginTop: spacing.xs },
  upgradeBtn: { alignSelf: 'stretch', marginTop: spacing.sm },
});

export const ResultsScreen = memo(ResultsScreenBase);
