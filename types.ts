import type { TaxYear } from './settings/SettingsContext';

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
  /** Tax year the figures were computed for (to detect stale results). */
  year: TaxYear;
  /** Which calc path produced this (to tailor explanations). */
  mode: Mode;
  /**
   * True when the freelancer presumptive minimum income (τεκμαρτό) drove the
   * taxable base above the declared profit — explains a low/negative net.
   */
  presumptive?: boolean;
}

import type { Ionicons } from '@expo/vector-icons';
import type { StringKey } from './i18n/strings';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface BudgetItem {
  icon: IconName;
  /** i18n key for the item label. */
  labelKey: StringKey;
  amount: number;
}

export interface BudgetBucket {
  key: 'needs' | 'wants' | 'savings';
  icon: IconName;
  /** i18n key for the bucket title. */
  titleKey: StringKey;
  pct: number;
  amount: number;
  accent: string;
  items: BudgetItem[];
}
