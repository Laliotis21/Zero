export type Mode = 'employee' | 'freelancer';

export type ScreenKey = 'home' | 'results' | 'budget';

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

export interface BudgetItem {
  emoji: string;
  label: string;
  amount: number;
}

export interface BudgetBucket {
  key: 'needs' | 'wants' | 'savings';
  emoji: string;
  title: string;
  pct: number;
  amount: number;
  accent: string;
  items: BudgetItem[];
}
