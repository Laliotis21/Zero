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
import { PulseDot } from '../components/ui/PulseDot';
import { SegmentControl } from '../components/ui/SegmentControl';
import { colors, font, radius, spacing, weight } from '../theme';
import { CalcResult, Mode } from '../types';
import { EFKA_FREELANCER_CLASSES, calcEmployee, calcFreelancer } from '../utils/taxEngine';
import { formatEuro } from '../utils/format';

interface HomeScreenProps {
  onCalculate: (result: CalcResult) => void;
}

const CHILD_OPTIONS = ['0', '1', '2', '3+'] as const;
const MAX_EFKA_CLASS = EFKA_FREELANCER_CLASSES.length;

/** Parse a Greek/plain numeric string ("1.234,50" or "1234.5") to number. */
function parseAmount(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function HomeScreenBase({ onCalculate }: HomeScreenProps) {
  const [mode, setMode] = useState<Mode>('employee');
  const [gross, setGross] = useState('');
  const [children, setChildren] = useState('0');
  const [years, setYears] = useState(0);
  const [efkaClass, setEfkaClass] = useState(1);

  const pickChild = useCallback((c: string) => () => setChildren(c), []);
  const decYears = useCallback(() => setYears((y) => Math.max(0, y - 1)), []);
  const incYears = useCallback(() => setYears((y) => Math.min(9, y + 1)), []);
  const decClass = useCallback(() => setEfkaClass((c) => Math.max(1, c - 1)), []);
  const incClass = useCallback(() => setEfkaClass((c) => Math.min(MAX_EFKA_CLASS, c + 1)), []);

  const isFreelancer = mode === 'freelancer';
  const classFee = useMemo(
    () => EFKA_FREELANCER_CLASSES[efkaClass - 1] ?? 0,
    [efkaClass],
  );

  const handleCalc = useCallback(() => {
    const amount = parseAmount(gross);
    const childCount = children === '3+' ? 3 : Number.parseInt(children, 10) || 0;
    const result = isFreelancer
      ? calcFreelancer(amount, efkaClass)
      : calcEmployee(amount, childCount, years);
    onCalculate(result);
  }, [gross, children, years, efkaClass, isFreelancer, onCalculate]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          ZERØ <Text style={styles.logoBolt}>⚡</Text>
        </Text>
        <View style={styles.aiStatus}>
          <Text style={styles.aiText}>🤖 AI Online</Text>
          <PulseDot />
        </View>
      </View>

      <SegmentControl value={mode} onChange={setMode} />

      {/* Gross salary / revenue input */}
      <View style={styles.inputBlock}>
        <Text style={styles.inputCaption}>
          {isFreelancer ? 'Μηνιαίες Αμοιβές' : 'Βασικός Μικτός Μισθός'} (μηνιαίος)
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={gross}
            onChangeText={setGross}
            placeholder="0"
            placeholderTextColor={colors.border}
            keyboardType="decimal-pad"
            style={styles.input}
            selectionColor={colors.neonGreen}
            maxLength={9}
          />
          <Text style={styles.euro}>€</Text>
        </View>
      </View>

      {/* Bento 2x2 grid */}
      <View style={styles.grid}>
        <Card style={styles.cell} compact>
          <Text style={styles.cellTitle}>👶 Παιδιά</Text>
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

        {isFreelancer ? (
          <Card style={styles.cell} compact>
            <Text style={styles.cellTitle}>🏷️ Κλάση ΕΦΚΑ</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decClass} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{efkaClass}</Text>
              <TouchableOpacity onPress={incClass} activeOpacity={0.8} style={styles.stepBtn}>
                <Text style={styles.stepSign}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.classFee}>{formatEuro(classFee)}/μήνα</Text>
          </Card>
        ) : (
          <Card style={styles.cell} compact>
            <Text style={styles.cellTitle}>📈 Τριετίες</Text>
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
          <Text style={styles.cellTitle}>🗓️ Έτος</Text>
          <Text style={styles.cellValue}>2026</Text>
          <Text style={styles.cellHint}>Φορ. κλίμακα</Text>
        </Card>

        <Card style={styles.cell} compact>
          <Text style={styles.cellTitle}>📍 Περιοχή</Text>
          <Text style={styles.cellValue}>GR 🇬🇷</Text>
          <Text style={styles.cellHint}>Πανελλαδικά</Text>
        </Card>
      </View>

      <GlowButton label="⚙️  ΥΠΟΛΟΓΙΣΜΟΣ" onPress={handleCalc} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: font.big,
    fontWeight: weight.black,
    letterSpacing: 1,
  },
  logoBolt: { fontSize: font.title },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  aiText: { color: colors.textMuted, fontSize: font.small, fontWeight: weight.semibold },

  inputBlock: { gap: spacing.sm },
  inputCaption: { color: colors.textMuted, fontSize: font.small, fontWeight: weight.medium },
  inputRow: { flexDirection: 'row', alignItems: 'baseline' },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: font.hero,
    fontWeight: weight.black,
    padding: 0,
    letterSpacing: -1,
  },
  euro: { color: colors.neonGreen, fontSize: font.big, fontWeight: weight.bold },

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
  cellTitle: { color: colors.text, fontSize: font.body, fontWeight: weight.semibold },
  cellValue: { color: colors.cyan, fontSize: font.title, fontWeight: weight.bold },
  cellHint: { color: colors.textMuted, fontSize: font.micro },

  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.neonGreen, borderColor: colors.neonGreen },
  chipText: { color: colors.textMuted, fontSize: font.body, fontWeight: weight.semibold },
  chipTextActive: { color: colors.bg, fontWeight: weight.bold },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { color: colors.neonGreen, fontSize: font.title, fontWeight: weight.bold },
  stepValue: { color: colors.text, fontSize: font.big, fontWeight: weight.black },
  classFee: { color: colors.cyan, fontSize: font.small, fontWeight: weight.semibold, textAlign: 'center' },

  cta: { marginTop: spacing.sm },
});

export const HomeScreen = memo(HomeScreenBase);
