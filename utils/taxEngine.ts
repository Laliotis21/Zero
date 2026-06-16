import { CalcResult } from '../types';

/**
 * Greek salary/tax engine.
 *
 * ⚠️ Constants below reflect the 2024/2025 framework (latest gazetted at build
 * time). They are isolated here so the final 2026 ΦΕΚ figures are a one-line
 * edit. Nothing in the UI hardcodes a number.
 */

/** Progressive income-tax scale (employment & pension), annual taxable €. */
interface Bracket {
  readonly upTo: number;
  readonly rate: number;
}
export const TAX_BRACKETS: readonly Bracket[] = [
  { upTo: 10000, rate: 0.09 },
  { upTo: 20000, rate: 0.22 },
  { upTo: 30000, rate: 0.28 },
  { upTo: 40000, rate: 0.36 },
  { upTo: Infinity, rate: 0.44 },
];

/** Employee EFKA share withheld on gross (main pension + health + aux + unemployment). */
export const EFKA_EMPLOYEE_RATE = 0.13867;

/** Salary payments per year (private sector: 12 + Christmas + Easter + leave). */
export const EMPLOYEE_PAYMENTS = 14;
export const FREELANCER_PAYMENTS = 12;

/** Triennia seniority bump: +10% per triennium, private-sector cap of 3. */
export const TRIENNIA_STEP = 0.1;
export const TRIENNIA_CAP = 3;

/** Self-employed fixed EFKA classes — monthly €, main pension + health (no aux). 2024 ref. */
export const EFKA_FREELANCER_CLASSES: readonly number[] = [
  244.62, 293.54, 352.25, 422.7, 507.25, 608.7,
];

/** Apply the progressive scale to an annual taxable amount. */
export function applyBrackets(taxable: number): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of TAX_BRACKETS) {
    if (taxable <= lower) break;
    const slice = Math.min(taxable, upTo) - lower;
    tax += slice * rate;
    lower = upTo;
  }
  return tax;
}

/**
 * Employment tax reduction (μείωση φόρου) by dependent children, phased out
 * by €20 per €1.000 of taxable income above €12.000.
 */
export function taxReduction(children: number, taxable: number): number {
  const table = [777, 810, 900, 1120, 1340];
  const base =
    children <= 4 ? table[children] ?? table[0]! : 1340 + (children - 4) * 220;
  if (taxable <= 12000) return base;
  const phaseOut = ((taxable - 12000) / 1000) * 20;
  return Math.max(0, base - phaseOut);
}

const zeroResult: CalcResult = { net: 0, gross: 0, efka: 0, tax: 0 };

/** Net monthly income for a salaried employee. */
export function calcEmployee(
  baseGrossMonthly: number,
  children: number,
  triennia: number,
): CalcResult {
  if (!(baseGrossMonthly > 0)) return zeroResult;

  const bump = 1 + TRIENNIA_STEP * Math.min(Math.max(triennia, 0), TRIENNIA_CAP);
  const gross = baseGrossMonthly * bump;

  const efka = gross * EFKA_EMPLOYEE_RATE;
  const annualGross = gross * EMPLOYEE_PAYMENTS;
  const annualEfka = efka * EMPLOYEE_PAYMENTS;
  const taxable = annualGross - annualEfka;

  const annualTax = Math.max(0, applyBrackets(taxable) - taxReduction(children, taxable));
  const tax = annualTax / EMPLOYEE_PAYMENTS;

  return { gross, efka, tax, net: gross - efka - tax };
}

/**
 * Net monthly income for a freelancer / μπλοκάκι.
 * `efkaClass` is 1-based (1..6). No employment tax-reduction applied.
 */
export function calcFreelancer(
  revenueMonthly: number,
  efkaClass: number,
): CalcResult {
  if (!(revenueMonthly > 0)) return zeroResult;

  const idx = Math.min(Math.max(efkaClass - 1, 0), EFKA_FREELANCER_CLASSES.length - 1);
  const efka = EFKA_FREELANCER_CLASSES[idx] ?? EFKA_FREELANCER_CLASSES[0]!;

  const annualGross = revenueMonthly * FREELANCER_PAYMENTS;
  const annualEfka = efka * FREELANCER_PAYMENTS;
  const taxable = Math.max(0, annualGross - annualEfka);

  const tax = applyBrackets(taxable) / FREELANCER_PAYMENTS;

  return { gross: revenueMonthly, efka, tax, net: revenueMonthly - efka - tax };
}
