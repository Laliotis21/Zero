import { colors } from '../theme';
import { BudgetBucket } from '../types';

/** Sub-allocation weights inside each bucket (sum = 1 per bucket). */
interface ItemSpec {
  emoji: string;
  label: string;
  weight: number;
}

interface BucketSpec {
  key: BudgetBucket['key'];
  emoji: string;
  title: string;
  pct: number;
  accent: string;
  items: readonly ItemSpec[];
}

/** 50/30/20, 2026 inflation-adjusted layout. Amounts derived from net at runtime. */
const BUCKET_SPECS: readonly BucketSpec[] = [
  {
    key: 'needs',
    emoji: '🏠',
    title: 'ΑΝΑΓΚΕΣ',
    pct: 50,
    accent: colors.cyan,
    items: [
      { emoji: '🔑', label: 'Max Ενοίκιο', weight: 0.6 },
      { emoji: '⚡', label: 'Ενέργεια & Λογαριασμοί', weight: 0.24 },
      { emoji: '🛒', label: 'Σούπερ μάρκετ', weight: 0.16 },
    ],
  },
  {
    key: 'wants',
    emoji: '🥂',
    title: 'ΕΠΙΘΥΜΙΕΣ',
    pct: 30,
    accent: colors.amber,
    items: [
      { emoji: '🍸', label: 'Lifestyle', weight: 0.5 },
      { emoji: '☕', label: 'Cafés & Φαγητό', weight: 0.33 },
      { emoji: '📺', label: 'Συνδρομές', weight: 0.17 },
    ],
  },
  {
    key: 'savings',
    emoji: '💰',
    title: 'ΑΠΟΤΑΜΙΕΥΣΗ',
    pct: 20,
    accent: colors.neonGreen,
    items: [
      { emoji: '🪙', label: 'Crypto Index', weight: 0.5 },
      { emoji: '🛡️', label: 'Emergency Fund', weight: 0.5 },
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
      emoji: spec.emoji,
      title: spec.title,
      pct: spec.pct,
      accent: spec.accent,
      amount,
      items: spec.items.map((it) => ({
        emoji: it.emoji,
        label: it.label,
        amount: amount * it.weight,
      })),
    };
  });
}
