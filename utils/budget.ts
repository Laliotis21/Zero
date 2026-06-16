import { StringKey } from '../i18n/strings';
import { colors } from '../theme';
import { BudgetBucket, IconName } from '../types';

/** Sub-allocation weights inside each bucket (sum = 1 per bucket). */
interface ItemSpec {
  icon: IconName;
  labelKey: StringKey;
  weight: number;
}

interface BucketSpec {
  key: BudgetBucket['key'];
  icon: IconName;
  titleKey: StringKey;
  pct: number;
  accent: string;
  items: readonly ItemSpec[];
}

/** 50/30/20 layout. Amounts derived from net at runtime; labels are i18n keys. */
const BUCKET_SPECS: readonly BucketSpec[] = [
  {
    key: 'needs',
    icon: 'home-outline',
    titleKey: 'budget.needs',
    pct: 50,
    accent: colors.primary,
    items: [
      { icon: 'key-outline', labelKey: 'budget.item.rent', weight: 0.6 },
      { icon: 'flash-outline', labelKey: 'budget.item.energy', weight: 0.24 },
      { icon: 'cart-outline', labelKey: 'budget.item.groceries', weight: 0.16 },
    ],
  },
  {
    key: 'wants',
    icon: 'sparkles-outline',
    titleKey: 'budget.wants',
    pct: 30,
    accent: colors.warning,
    items: [
      { icon: 'wine-outline', labelKey: 'budget.item.lifestyle', weight: 0.5 },
      { icon: 'cafe-outline', labelKey: 'budget.item.cafe', weight: 0.33 },
      { icon: 'tv-outline', labelKey: 'budget.item.subs', weight: 0.17 },
    ],
  },
  {
    key: 'savings',
    icon: 'shield-checkmark-outline',
    titleKey: 'budget.savings',
    pct: 20,
    accent: colors.positive,
    items: [
      { icon: 'trending-up-outline', labelKey: 'budget.item.invest', weight: 0.5 },
      { icon: 'umbrella-outline', labelKey: 'budget.item.emergency', weight: 0.5 },
    ],
  },
];

/** Split a monthly net income into 50/30/20 buckets with derived line items. */
export function buildBudget(net: number): BudgetBucket[] {
  const safe = Math.max(0, net);
  return BUCKET_SPECS.map((spec) => {
    const amount = safe * (spec.pct / 100);
    return {
      key: spec.key,
      icon: spec.icon,
      titleKey: spec.titleKey,
      pct: spec.pct,
      accent: spec.accent,
      amount,
      items: spec.items.map((it) => ({
        icon: it.icon,
        labelKey: it.labelKey,
        amount: amount * it.weight,
      })),
    };
  });
}
