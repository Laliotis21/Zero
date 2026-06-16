export type Mode = 'employee' | 'freelancer';

export type ScreenKey = 'home' | 'results' | 'budget' | 'profile';

export interface CalcResult {
  /** Net monthly income in euros. */
  net: number;
  /** Gross monthly income in euros. */
  gross: number;
  /** Social security (ΕΦΚΑ) deduction in euros. */
  efka: number;
  /** Income tax (Φόρος Εισοδήματος) in euros. */
  tax: number;
}

import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface BudgetItem {
  icon: IconName;
  label: string;
  amount: number;
}

export interface BudgetBucket {
  key: 'needs' | 'wants' | 'savings';
  icon: IconName;
  title: string;
  pct: number;
  amount: number;
  accent: string;
  items: BudgetItem[];
}
