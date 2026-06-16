import { colors } from '../theme';
import { BudgetBucket, IconName } from '../types';

/** Sub-allocation weights inside each bucket (sum = 1 per bucket). */
interface ItemSpec {
  icon: IconName;
  label: string;
  weight: number;
}

interface BucketSpec {
  key: BudgetBucket['key'];
  icon: IconName;
  title: string;
  pct: number;
  accent: string;
  items: readonly ItemSpec[];
}

/** 50/30/20, 2026 inflation-adjusted layout. Amounts derived from net at runtime. */
const BUCKET_SPECS: readonly BucketSpec[] = [
  {
    key: 'needs',
    icon: 'home-outline',
    title: 'ΑΝΑΓΚΕΣ',
    pct: 50,
    accent: colors.primary,
    items: [
      { icon: 'key-outline', label: 'Max Ενοίκιο', weight: 0.6 },
      { icon: 'flash-outline', label: 'Ενέργεια & Λογαριασμοί', weight: 0.24 },
      { icon: 'cart-outline', label: 'Σούπερ μάρκετ', weight: 0.16 },
    ],
  },
  {
    key: 'wants',
    icon: 'sparkles-outline',
    title: 'ΕΠΙΘΥΜΙΕΣ',
    pct: 30,
    accent: colors.warning,
    items: [
      { icon: 'wine-outline', label: 'Lifestyle', weight: 0.5 },
      { icon: 'cafe-outline', label: 'Cafés & Φαγητό', weight: 0.33 },
      { icon: 'tv-outline', label: 'Συνδρομές', weight: 0.17 },
    ],
  },
  {
    key: 'savings',
    icon: 'shield-checkmark-outline',
    title: 'ΑΠΟΤΑΜΙΕΥΣΗ',
    pct: 20,
    accent: colors.positive,
    items: [
      { icon: 'trending-up-outline', label: 'Index / Επενδύσεις', weight: 0.5 },
      { icon: 'umbrella-outline', label: 'Emergency Fund', weight: 0.5 },
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
      title: spec.title,
      pct: spec.pct,
      accent: spec.accent,
      amount,
      items: spec.items.map((it) => ({
        icon: it.icon,
        label: it.label,
        amount: amount * it.weight,
      })),
    };
  });
}
