import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { IconLabel } from '../components/ui/IconLabel';
import { SegmentControl } from '../components/ui/SegmentControl';
import { useT } from '../i18n/strings';
import { useSettings } from '../settings/SettingsContext';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';
import { CalcResult, Mode } from '../types';
import {
  calcEmployee,
  calcFreelancer,
  efkaFreelancerClasses,
  paymentsPerYear,
  tableMeta,
} from '../utils/taxEngine';
import { useMoney } from '../utils/money';

interface HomeScreenProps {
  onCalculate: (result: CalcResult) => void;
}

const CHILD_OPTIONS = ['0', '1', '2', '3+'] as const;

/** Parse a Greek/plain numeric string ("1.234,50" or "1234.5") to number. */
function parseAmount(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function HomeScreenBase({ onCalculate }: HomeScreenProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const { settings } = useSettings();
  const taxYear = settings.taxYear;
  const styles = useMemo(() => makeStyles(t), [t]);
  const [mode, setMode] = useState<Mode>('employee');
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [gross, setGross] = useState('');
  const [children, setChildren] = useState('0');
  const [years, setYears] = useState(0);
  const [activeYears, setActiveYears] = useState(0);
  const [efkaClass, setEfkaClass] = useState(1);

  const classes = useMemo(() => efkaFreelancerClasses(taxYear), [taxYear]);
  const maxEfkaClass = classes.length;

  const pickChild = useCallback((c: string) => () => setChildren(c), []);
  const decYears = useCallback(() => setYears((y) => Math.max(0, y - 1)), []);
  const incYears = useCallback(() => setYears((y) => Math.min(9, y + 1)), []);
  const decActiveYears = useCallback(() => setActiveYears((y) => Math.max(0, y - 1)), []);
  const incActiveYears = useCallback(() => setActiveYears((y) => Math.min(40, y + 1)), []);
  const decClass = useCallback(() => setEfkaClass((c) => Math.max(1, c - 1)), []);
  const incClass = useCallback(
    () => setEfkaClass((c) => Math.min(maxEfkaClass, c + 1)),
    [maxEfkaClass],
  );

  const isFreelancer = mode === 'freelancer';
  const classFee = classes[efkaClass - 1] ?? 0;

  const amount = parseAmount(gross);
  const valid = amount > 0;
  // Only flag an error once the user has typed something non-empty.
  const showError = gross.trim().length > 0 && !valid;
  const meta = useMemo(() => tableMeta(taxYear), [taxYear]);

  const handleCalc = useCallback(() => {
    const amount = parseAmount(gross);
    if (!(amount > 0)) return;
    // Annual entry → monthly base (employee ÷14 incl. δώρα, freelancer ÷12).
    const monthly = period === 'year' ? amount / paymentsPerYear(taxYear, isFreelancer) : amount;
    const childCount = children === '3+' ? 3 : Number.parseInt(children, 10) || 0;
    const result = isFreelancer
      ? calcFreelancer(monthly, efkaClass, activeYears, taxYear)
      : calcEmployee(monthly, childCount, years, taxYear);
    onCalculate(result);
  }, [gross, period, children, years, activeYears, efkaClass, isFreelancer, taxYear, onCalculate]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ZERØ</Text>
      </View>

      <SegmentControl value={mode} onChange={setMode} />

      {/* Gross salary / revenue input */}
      <View style={styles.inputBlock}>
        <View style={styles.captionRow}>
          <Text style={styles.inputCaption}>
            {isFreelancer ? tr('home.caption.freelancer') : tr('home.caption.employee')}
          </Text>
          <View style={styles.periodToggle}>
            {(['month', 'year'] as const).map((p) => {
              const active = p === period;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.8}
                  style={[styles.periodPill, active && styles.periodPillActive]}
                >
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>
                    {tr(p === 'month' ? 'home.period.month' : 'home.period.year')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={gross}
            onChangeText={setGross}
            placeholder="0"
            placeholderTextColor={t.border}
            keyboardType="decimal-pad"
            style={styles.input}
            selectionColor={t.primary}
            maxLength={9}
          />
          <Text style={styles.euro}>{money.symbol}</Text>
        </View>
        {showError ? <Text style={styles.error}>{tr('home.invalid')}</Text> : null}
      </View>

      {/* Bento 2x2 grid */}
      <View style={styles.grid}>
        {isFreelancer ? (
          <Card style={styles.cell} compact>
            <IconLabel name="briefcase-outline" label={tr('home.yearsActive')} />
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decActiveYears} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{activeYears}</Text>
              <TouchableOpacity onPress={incActiveYears} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>+</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={styles.cell} compact>
            <IconLabel name="people-outline" label={tr('home.children')} />
            <View style={styles.chips}>
              {CHILD_OPTIONS.map((c) => {
                const active = c === children;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={pickChild(c)}
                    activeOpacity={0.8}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {isFreelancer ? (
          <Card style={styles.cell} compact>
            <IconLabel name="pricetag-outline" label={tr('home.efkaClass')} />
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decClass} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{efkaClass}</Text>
              <TouchableOpacity onPress={incClass} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.classFee}>
              {money.format(classFee)}
              {tr('home.perMonth')}
            </Text>
          </Card>
        ) : (
          <Card style={styles.cell} compact>
            <IconLabel name="trending-up-outline" label={tr('home.triennia')} />
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decYears} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{years}</Text>
              <TouchableOpacity onPress={incYears} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>+</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        <Card style={styles.cell} compact>
          <IconLabel name="calendar-outline" label={tr('home.year')} />
          <Text style={styles.cellValue}>{taxYear}</Text>
          <Text style={styles.cellHint}>{tr('home.yearHint')}</Text>
        </Card>

        <Card style={styles.cell} compact>
          <IconLabel name="location-outline" label={tr('home.region')} />
          <Text style={styles.cellValue}>{tr('home.regionValue')}</Text>
          <Text style={styles.cellHint}>{tr('home.regionHint')}</Text>
        </Card>
      </View>

      <GlowButton
        label={tr('home.calculate')}
        icon="calculator-outline"
        onPress={handleCalc}
        disabled={!valid}
        style={styles.cta}
      />

      <Text style={styles.source}>
        {tr('home.tablesSource', { source: meta.source, date: meta.asOfDate })}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
    },
    logo: {
      color: c.text,
      fontSize: font.big,
      fontWeight: weight.black,
      letterSpacing: 1,
    },
    inputBlock: { gap: spacing.sm },
    captionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputCaption: { color: c.textMuted, fontSize: font.small, fontWeight: weight.medium, flexShrink: 1 },
    periodToggle: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.full,
      padding: 2,
    },
    periodPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    periodPillActive: { backgroundColor: c.primary },
    periodText: { color: c.textMuted, fontSize: font.small, fontWeight: weight.semibold },
    periodTextActive: { color: c.onAccent, fontWeight: weight.bold },
    inputRow: { flexDirection: 'row', alignItems: 'baseline' },
    input: {
      flex: 1,
      color: c.text,
      fontSize: font.hero,
      fontWeight: weight.black,
      padding: 0,
      letterSpacing: -1,
    },
    euro: { color: c.primary, fontSize: font.big, fontWeight: weight.bold },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    cell: {
      flexGrow: 1,
      flexBasis: '47%',
      gap: spacing.md,
    },
    cellValue: { color: c.primary, fontSize: font.title, fontWeight: weight.bold },
    cellHint: { color: c.textMuted, fontSize: font.micro },

    chips: { flexDirection: 'row', gap: spacing.sm },
    chip: {
      flex: 1,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: c.cardAlt,
      borderColor: c.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.textMuted, fontSize: font.body, fontWeight: weight.semibold },
    chipTextActive: { color: c.onAccent, fontWeight: weight.bold },

    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: c.cardAlt,
      borderColor: c.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepSign: { color: c.primary, fontSize: font.title, fontWeight: weight.bold },
    stepValue: { color: c.text, fontSize: font.big, fontWeight: weight.black },
    classFee: { color: c.primary, fontSize: font.small, fontWeight: weight.semibold, textAlign: 'center' },

    cta: { marginTop: spacing.sm },
    error: { color: c.negative, fontSize: font.small, fontWeight: weight.medium },
    source: { color: c.textMuted, fontSize: font.micro, textAlign: 'center' },
  });

export const HomeScreen = memo(HomeScreenBase);
