import type { TaxYear } from '../settings/SettingsContext';
import { CalcResult, Mode } from '../types';

/**
 * Greek salary/tax engine, parameterised by tax year.
 *
 * ⚠️ The figures reflect the 2024/2025 framework (latest gazetted at build
 * time). Both year entries currently share that verified dataset — no numbers
 * are invented for a year we don't yet have official figures for. When the 2026
 * ΦΕΚ lands, edit only the 2026 entry. Nothing in the UI hardcodes a number.
 */

interface Bracket {
  readonly upTo: number;
  readonly rate: number;
}

/** Provenance of a year's figures — surfaced in the UI so the user knows the source. */
interface TableMeta {
  /** Human label for the framework version, e.g. "2024/2025". */
  version: string;
  /** Gazette / source reference, e.g. "ΦΕΚ 2024". */
  source: string;
  /** ISO date the figures were last verified (YYYY-MM-DD). */
  asOfDate: string;
}

interface YearTables {
  /** Provenance of this dataset. */
  meta: TableMeta;
  /** Progressive income-tax scale (employment & pension), annual taxable €. */
  brackets: readonly Bracket[];
  /** Employee EFKA share withheld on gross. */
  efkaEmployeeRate: number;
  /** Max monthly insurable earnings — EFKA is not withheld above this gross. */
  efkaCeilingMonthly: number;
  /** Salary payments per year. */
  employeePayments: number;
  freelancerPayments: number;
  /** Triennia seniority: +step per triennium, capped. */
  trienniaStep: number;
  trienniaCap: number;
  /** Self-employed fixed EFKA classes — monthly €. */
  freelancerClasses: readonly number[];
  /**
   * Base presumptive minimum annual taxable income for self-employed
   * (τεκμαρτό, Ν.5073/2023) = monthly minimum wage × 14. This is the floor for
   * activity up to 6 years with no staff/turnover surcharges — those extra
   * factors (+10%/3yr over 6yr, payroll, ΚΑΔ turnover) are not modeled.
   */
  freelancerMinAnnualIncome: number;
  /** Tax reduction base by dependent children (index 0..4). */
  reductionTable: readonly number[];
}

const FRAMEWORK_2024_2025: YearTables = {
  meta: { version: '2024/2025', source: 'ΦΕΚ 2024', asOfDate: '2024-12-01' },
  brackets: [
    { upTo: 10000, rate: 0.09 },
    { upTo: 20000, rate: 0.22 },
    { upTo: 30000, rate: 0.28 },
    { upTo: 40000, rate: 0.36 },
    { upTo: Infinity, rate: 0.44 },
  ],
  efkaEmployeeRate: 0.13867,
  efkaCeilingMonthly: 7572.62,
  employeePayments: 14,
  freelancerPayments: 12,
  trienniaStep: 0.1,
  trienniaCap: 3,
  freelancerClasses: [244.62, 293.54, 352.25, 422.7, 507.25, 608.7],
  // Monthly minimum wage €830 (2024) × 14.
  freelancerMinAnnualIncome: 830 * 14,
  reductionTable: [777, 810, 900, 1120, 1340],
};

/** Per-year tables. 2026 mirrors the gazetted framework until official figures land. */
const YEAR_TABLES: Record<TaxYear, YearTables> = {
  2025: FRAMEWORK_2024_2025,
  2026: FRAMEWORK_2024_2025,
};

export function tablesFor(year: TaxYear): YearTables {
  return YEAR_TABLES[year] ?? FRAMEWORK_2024_2025;
}

/** Provenance of a year's figures (version/source/asOfDate) for the UI. */
export function tableMeta(year: TaxYear): TableMeta {
  return tablesFor(year).meta;
}

/** Freelancer EFKA classes for a given year (for UI pickers/labels). */
export function efkaFreelancerClasses(year: TaxYear): readonly number[] {
  return tablesFor(year).freelancerClasses;
}

/**
 * Salary/revenue payments per year (employee 14 incl. δώρα, freelancer 12).
 * Used to convert an annual gross entry into the monthly base the calc expects.
 */
export function paymentsPerYear(year: TaxYear, isFreelancer: boolean): number {
  const tbl = tablesFor(year);
  return isFreelancer ? tbl.freelancerPayments : tbl.employeePayments;
}

/** Apply the progressive scale to an annual taxable amount. */
function applyBrackets(taxable: number, brackets: readonly Bracket[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of brackets) {
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
function taxReduction(children: number, taxable: number, table: readonly number[]): number {
  const base =
    children <= 4 ? table[children] ?? table[0]! : table[4]! + (children - 4) * 220;
  if (taxable <= 12000) return base;
  const phaseOut = ((taxable - 12000) / 1000) * 20;
  return Math.max(0, base - phaseOut);
}

const zeroResult = (year: TaxYear, mode: Mode): CalcResult => ({
  net: 0,
  gross: 0,
  efka: 0,
  tax: 0,
  year,
  mode,
});

/** Net monthly income for a salaried employee. */
export function calcEmployee(
  baseGrossMonthly: number,
  children: number,
  triennia: number,
  year: TaxYear,
): CalcResult {
  if (!(baseGrossMonthly > 0)) return zeroResult(year, 'employee');
  const tbl = tablesFor(year);

  const bump = 1 + tbl.trienniaStep * Math.min(Math.max(triennia, 0), tbl.trienniaCap);
  const gross = baseGrossMonthly * bump;

  // EFKA is withheld only up to the monthly insurable-earnings ceiling.
  const insurable = Math.min(gross, tbl.efkaCeilingMonthly);
  const efka = insurable * tbl.efkaEmployeeRate;
  const annualGross = gross * tbl.employeePayments;
  const annualEfka = efka * tbl.employeePayments;
  const taxable = annualGross - annualEfka;

  const annualTax = Math.max(
    0,
    applyBrackets(taxable, tbl.brackets) - taxReduction(children, taxable, tbl.reductionTable),
  );
  const tax = annualTax / tbl.employeePayments;

  return { gross, efka, tax, net: gross - efka - tax, year, mode: 'employee' };
}

/** Overall cap on the presumptive minimum income (τεκμαρτό), annual €. */
const FREELANCER_MIN_CAP = 50000;

/**
 * Presumptive minimum annual taxable income for self-employed.
 * Base (≤6 years) is increased by +10% for each completed 3-year period beyond
 * the 6th year, capped. Payroll- and turnover-based surcharges are not modeled.
 */
function freelancerMinIncome(tbl: YearTables, yearsActive: number): number {
  const extraPeriods = Math.floor(Math.max(0, yearsActive - 6) / 3);
  const factor = 1 + 0.1 * extraPeriods;
  return Math.min(tbl.freelancerMinAnnualIncome * factor, FREELANCER_MIN_CAP);
}

/**
 * Net monthly income for a freelancer / μπλοκάκι.
 * `efkaClass` is 1-based (1..6). `yearsActive` drives the presumptive minimum.
 * No employment tax-reduction applied.
 */
export function calcFreelancer(
  revenueMonthly: number,
  efkaClass: number,
  yearsActive: number,
  year: TaxYear,
): CalcResult {
  if (!(revenueMonthly > 0)) return zeroResult(year, 'freelancer');
  const tbl = tablesFor(year);
  const classes = tbl.freelancerClasses;

  const idx = Math.min(Math.max(efkaClass - 1, 0), classes.length - 1);
  const efka = classes[idx] ?? classes[0]!;

  const annualGross = revenueMonthly * tbl.freelancerPayments;
  const annualEfka = efka * tbl.freelancerPayments;
  // Taxable profit cannot fall below the presumptive minimum (τεκμαρτό).
  const profit = Math.max(0, annualGross - annualEfka);
  const minIncome = freelancerMinIncome(tbl, yearsActive);
  const taxable = Math.max(profit, minIncome);
  // Presumptive base applied = the floor bound the taxable above declared profit.
  const presumptive = minIncome > profit;

  const tax = applyBrackets(taxable, tbl.brackets) / tbl.freelancerPayments;

  return {
    gross: revenueMonthly,
    efka,
    tax,
    net: revenueMonthly - efka - tax,
    year,
    mode: 'freelancer',
    presumptive,
  };
}
