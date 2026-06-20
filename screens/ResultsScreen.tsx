import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { IconLabel } from '../components/ui/IconLabel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useT, type StringKey } from '../i18n/strings';
import { usePro } from '../purchases/ProContext';
import { useSession } from '../session/SessionContext';
import { useSettings } from '../settings/SettingsContext';
import { font, glow, Palette, radius, spacing, useTheme, weight } from '../theme';
import { CalcResult, IconName } from '../types';
import { useMoney } from '../utils/money';
import { calcEmployee, calcFreelancer, solveGrossForNet, tableMeta } from '../utils/taxEngine';

interface ResultsScreenProps {
  result: CalcResult | null;
}

interface DeductionRowProps {
  icon: IconName;
  labelKey: StringKey;
  amount: number;
}

const DeductionRow = memo(function DeductionRow({ icon, labelKey, amount }: DeductionRowProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.dedRow}>
      <IconLabel
        name={icon}
        label={tr(labelKey)}
        color={t.textMuted}
        iconColor={t.textMuted}
        size={17}
        textStyle={styles.dedLabel}
      />
      <Text style={styles.dedAmount}>{money.format(amount)}</Text>
    </View>
  );
});

function ResultsScreenBase({ result }: ResultsScreenProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const { settings } = useSettings();
  const { form } = useSession();
  const { isPro, loading: proLoading, purchase } = usePro();
  const styles = useMemo(() => makeStyles(t), [t]);

  // Reverse Pricing (Pro): given a target net/month, solve the gross needed,
  // using the same engine + the user's current mode/EFKA/years inputs.
  const [targetInput, setTargetInput] = useState('');
  const reverseGross = useMemo(() => {
    const target = parseFloat(targetInput.replace(',', '.'));
    if (!(target > 0)) return null;
    const year = result?.year ?? settings.taxYear;
    const netForGross = (g: number) =>
      form.mode === 'freelancer'
        ? calcFreelancer(g, form.efkaClass, form.activeYears, year).net
        : calcEmployee(g, parseInt(form.children, 10) || 0, form.years, year).net;
    return solveGrossForNet(target, netForGross);
  }, [targetInput, form, result, settings.taxYear]);
  // Reverse Pricing is gated behind Pro. Run the RevenueCat purchase flow;
  // fall back to a friendly "not available" message when no key is configured,
  // and surface cancel/error gracefully.
  const handleUpgrade = useCallback(async () => {
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

  const view = useMemo(() => {
    if (!result || result.net <= 0) return null;
    const { net, efka, tax } = result;
    const total = net + efka + tax;
    return {
      hero: money.split(net),
      efka,
      tax,
      totalDed: efka + tax,
      ratio: total > 0 ? net / total : 0,
    };
  }, [result, money]);

  // No calculation yet.
  if (!result) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calculator-outline" size={44} color={t.textMuted} />
        <Text style={styles.emptyTitle}>{tr('results.empty.title')}</Text>
        <Text style={styles.emptyBody}>{tr('results.empty.body')}</Text>
      </View>
    );
  }

  // Calculated, but deductions ≥ revenue (common for freelancer τεκμαρτό).
  if (!view) {
    return (
      <View style={styles.empty}>
        <Ionicons name="trending-down-outline" size={44} color={t.warning} />
        <Text style={styles.emptyTitle}>{tr('results.negative.title')}</Text>
        <Text style={styles.emptyBody}>
          {result.presumptive ? tr('results.negative.presumptive') : tr('results.negative.body')}
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
      <Text style={styles.screenTitle}>{tr('results.title', { year: result!.year })}</Text>

      {result!.year !== settings.taxYear ? (
        <View style={styles.staleBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={t.warning} />
          <Text style={styles.staleText}>{tr('results.stale', { year: result!.year })}</Text>
        </View>
      ) : null}

      {result!.presumptive ? (
        <View style={styles.staleBanner}>
          <Ionicons name="information-circle-outline" size={18} color={t.warning} />
          <Text style={styles.staleText}>{tr('results.negative.presumptive')}</Text>
        </View>
      ) : null}

      {/* Hero net income */}
      <Card style={styles.hero}>
        <IconLabel
          name="wallet-outline"
          label={tr('results.net')}
          color={t.textMuted}
          iconColor={t.textMuted}
          size={16}
          textStyle={styles.heroCaption}
        />
        <View style={styles.heroRow}>
          <Text style={styles.heroWhole}>{view.hero.whole}</Text>
          <Text style={styles.heroCents}>,{view.hero.cents} {money.symbol}</Text>
        </View>
        <Text style={styles.heroSub}>{tr('results.perMonth')}</Text>
      </Card>

      {/* Deductions */}
      <Card style={styles.gap}>
        <IconLabel name="receipt-outline" label={tr('results.deductions')} size={20} textStyle={styles.cardTitle} />
        <DeductionRow icon="shield-outline" labelKey="results.efka" amount={view.efka} />
        <View style={styles.divider} />
        <DeductionRow icon="business-outline" labelKey="results.tax" amount={view.tax} />
        <View style={styles.divider} />
        <View style={styles.dedRow}>
          <Text style={styles.totalLabel}>{tr('results.totalDeductions')}</Text>
          <Text style={styles.totalAmount}>{money.format(view.totalDed)}</Text>
        </View>
      </Card>

      {/* Ratio bar */}
      <Card style={styles.gap}>
        <IconLabel name="stats-chart-outline" label={tr('results.netVsDed')} size={20} textStyle={styles.cardTitle} />
        <ProgressBar ratio={view.ratio} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: t.positive }]} />
            <Text style={styles.legendGood}>{tr('results.legendNet', { pct: Math.round(view.ratio * 100) })}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: t.negative }]} />
            <Text style={styles.legendBad}>{tr('results.legendDed', { pct: Math.round((1 - view.ratio) * 100) })}</Text>
          </View>
        </View>
      </Card>

      {/* Paywall — replaced by an unlocked state once the user owns Pro. */}
      {isPro ? (
        <Card style={[styles.paywall, glow(t.positive, 0.18, 22)]}>
          <View style={styles.lockBadge}>
            <Ionicons name="sparkles" size={24} color={t.positive} />
          </View>
          <Text style={styles.paywallTitle}>{tr('results.pro.title')}</Text>
          <Text style={styles.paywallBody}>{tr('results.pro.body')}</Text>
          <Text style={styles.reverseLabel}>{tr('results.reverse.label')}</Text>
          <TextInput
            style={styles.reverseInput}
            value={targetInput}
            onChangeText={setTargetInput}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder={tr('results.reverse.placeholder')}
            placeholderTextColor={t.textMuted}
          />
          {reverseGross != null ? (
            <Text style={styles.reverseResult}>
              {tr('results.reverse.result', { amount: money.format(reverseGross) })}
            </Text>
          ) : targetInput.length > 0 ? (
            <Text style={styles.paywallDisclosure}>{tr('results.reverse.invalid')}</Text>
          ) : null}
        </Card>
      ) : (
        <Card style={[styles.paywall, glow(t.primary, 0.18, 22)]}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed-outline" size={24} color={t.primary} />
          </View>
          <Text style={styles.paywallTitle}>{tr('results.paywall.title')}</Text>
          <Text style={styles.paywallBody}>{tr('results.paywall.body')}</Text>
          <Text style={styles.price}>{tr('results.paywall.price')}</Text>
          <GlowButton
            label={tr('results.paywall.cta')}
            icon="arrow-up-circle-outline"
            onPress={handleUpgrade}
            loading={proLoading}
            style={styles.upgradeBtn}
          />
          <Text style={styles.paywallDisclosure}>
            {tr('results.paywall.disclosure')}
          </Text>
        </Card>
      )}

      <Text style={styles.source}>
        {tr('results.source', {
          source: tableMeta(result!.year).source,
          date: tableMeta(result!.year).asOfDate,
        })}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
    screenTitle: {
      color: c.text,
      fontSize: font.title,
      fontWeight: weight.bold,
      paddingTop: spacing.sm,
    },
    gap: { gap: spacing.md },

    staleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.cardAlt,
      borderColor: c.warning,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    staleText: { color: c.text, fontSize: font.small, flexShrink: 1, lineHeight: 18 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.sm },
    emptyTitle: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold, marginTop: spacing.sm },
    emptyBody: { color: c.textMuted, fontSize: font.body, textAlign: 'center', lineHeight: 21 },

    hero: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.xs, borderColor: c.primary },
    heroCaption: { color: c.textMuted, fontSize: font.body, fontWeight: weight.medium },
    heroRow: { flexDirection: 'row', alignItems: 'baseline' },
    heroWhole: {
      color: c.text,
      fontSize: font.hero,
      fontWeight: weight.black,
      letterSpacing: -2,
    },
    heroCents: { color: c.positive, fontSize: font.big, fontWeight: weight.bold },
    heroSub: { color: c.textMuted, fontSize: font.small },

    cardTitle: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold },
    dedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dedLabel: { color: c.textMuted, fontSize: font.body, fontWeight: weight.regular },
    dedAmount: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold },
    divider: { height: 1, backgroundColor: c.border },
    totalLabel: { color: c.text, fontSize: font.body, fontWeight: weight.semibold },
    totalAmount: { color: c.negative, fontSize: font.subtitle, fontWeight: weight.black },

    legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendGood: { color: c.positive, fontSize: font.small, fontWeight: weight.semibold },
    legendBad: { color: c.negative, fontSize: font.small, fontWeight: weight.semibold },

    paywall: { alignItems: 'center', gap: spacing.sm, borderColor: c.primary },
    lockBadge: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: c.cardAlt,
      borderColor: c.primary,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    paywallTitle: { color: c.text, fontSize: font.title, fontWeight: weight.black },
    paywallBody: { color: c.textMuted, fontSize: font.small, textAlign: 'center', lineHeight: 20 },
    paywallDisclosure: { color: c.textMuted, fontSize: font.small, textAlign: 'center', marginTop: spacing.xs, opacity: 0.8 },
    reverseLabel: { color: c.textMuted, fontSize: font.small, alignSelf: 'stretch', marginTop: spacing.sm },
    reverseInput: {
      alignSelf: 'stretch',
      marginTop: spacing.xs,
      backgroundColor: c.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.primary,
      color: c.text,
      fontSize: font.title,
      fontWeight: weight.bold,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      textAlign: 'center',
    },
    reverseResult: { color: c.positive, fontSize: font.title, fontWeight: weight.black, textAlign: 'center', marginTop: spacing.sm },
    price: { color: c.primary, fontSize: font.body, fontWeight: weight.bold, marginTop: spacing.xs },
    upgradeBtn: { alignSelf: 'stretch', marginTop: spacing.sm },
    source: { color: c.textMuted, fontSize: font.micro, textAlign: 'center', marginTop: spacing.xs },
  });

export const ResultsScreen = memo(ResultsScreenBase);
