import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { GlowButton } from '../components/ui/GlowButton';
import { IconLabel } from '../components/ui/IconLabel';
import { useT } from '../i18n/strings';
import { useSettings } from '../settings/SettingsContext';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';
import { BudgetBucket } from '../types';
import { buildBudget } from '../utils/budget';
import { useMoney } from '../utils/money';

interface BudgetScreenProps {
  net: number;
}

const BucketCard = memo(function BucketCard({ bucket }: { bucket: BudgetBucket }) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <Card style={[styles.bucket, { borderColor: bucket.accent }]}>
      <View style={styles.bucketHead}>
        <IconLabel
          name={bucket.icon}
          label={tr(bucket.titleKey)}
          iconColor={bucket.accent}
          size={20}
          textStyle={styles.bucketTitle}
        />
        <View style={[styles.pctPill, { backgroundColor: bucket.accent }]}>
          <Text style={styles.pctText}>{bucket.pct}%</Text>
        </View>
      </View>

      <Text style={[styles.bucketAmount, { color: bucket.accent }]}>{money.format(bucket.amount)}</Text>

      {/* accent sliver */}
      <View style={styles.sliverTrack}>
        <View style={[styles.sliverFill, { width: `${bucket.pct}%`, backgroundColor: bucket.accent }]} />
      </View>

      <View style={styles.items}>
        {bucket.items.map((item) => (
          <View key={item.labelKey} style={styles.itemRow}>
            <IconLabel
              name={item.icon}
              label={tr(item.labelKey)}
              color={t.textMuted}
              iconColor={t.textMuted}
              size={16}
              textStyle={styles.itemLabel}
            />
            <Text style={styles.itemAmount}>{money.format(item.amount)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
});

function BudgetScreenBase({ net }: BudgetScreenProps) {
  const t = useTheme();
  const tr = useT();
  const money = useMoney();
  const { settings } = useSettings();
  const styles = useMemo(() => makeStyles(t), [t]);
  const buckets = useMemo(() => buildBudget(net), [net]);
  const onSave = useCallback(() => undefined, []);
  const onExport = useCallback(() => undefined, []);

  // Split the template around {amount} so the amount can be styled bold inline.
  const [introBefore = '', introAfter = ''] = tr('budget.intro').split('{amount}');

  if (net <= 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="pie-chart-outline" size={44} color={t.textMuted} />
        <Text style={styles.emptyTitle}>{tr('budget.empty.title')}</Text>
        <Text style={styles.emptyBody}>{tr('budget.empty.body')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>{tr('budget.title')}</Text>
      <Text style={styles.intro}>
        {introBefore}
        <Text style={styles.introStrong}>{money.format(net)}</Text>
        {introAfter}
        {'  '}
        <Text style={styles.tag}>{tr('budget.tag', { year: settings.taxYear })}</Text>
      </Text>

      {buckets.map((bucket) => (
        <BucketCard key={bucket.key} bucket={bucket} />
      ))}

      <View style={styles.actions}>
        <GlowButton label={tr('budget.save')} icon="bookmark-outline" variant="outline" onPress={onSave} style={styles.action} />
        <GlowButton label={tr('budget.export')} icon="download-outline" onPress={onExport} style={styles.action} />
      </View>
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
    intro: { color: c.textMuted, fontSize: font.small, lineHeight: 21 },
    introStrong: { color: c.text, fontWeight: weight.bold },
    tag: { color: c.positive, fontWeight: weight.semibold },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.sm },
    emptyTitle: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold, marginTop: spacing.sm },
    emptyBody: { color: c.textMuted, fontSize: font.body, textAlign: 'center', lineHeight: 21 },

    bucket: { gap: spacing.md },
    bucketHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bucketTitle: { color: c.text, fontSize: font.subtitle, fontWeight: weight.bold, letterSpacing: 0.5, flexShrink: 0 },
    pctPill: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
    pctText: { color: c.onAccent, fontSize: font.small, fontWeight: weight.black },
    bucketAmount: { fontSize: font.big, fontWeight: weight.black, letterSpacing: -1 },

    sliverTrack: {
      height: 4,
      borderRadius: radius.full,
      backgroundColor: c.cardAlt,
      overflow: 'hidden',
    },
    sliverFill: { height: '100%', borderRadius: radius.full },

    items: { gap: spacing.sm, marginTop: spacing.xs },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemLabel: { color: c.textMuted, fontSize: font.body, fontWeight: weight.regular },
    itemAmount: { color: c.text, fontSize: font.body, fontWeight: weight.semibold },

    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
    action: { flex: 1 },
  });

export const BudgetScreen = memo(BudgetScreenBase);
