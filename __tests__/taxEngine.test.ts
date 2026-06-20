import {
  calcEmployee,
  calcFreelancer,
  efkaFreelancerClasses,
  paymentsPerYear,
  solveGrossForNet,
  tableMeta,
  tablesFor,
} from '../utils/taxEngine';

/**
 * Golden tests for the financial core. Numbers are hand-computed from the
 * 2024/2025 framework; a failure means the engine drifted from those figures
 * (i.e. someone's net pay is now wrong). Update intentionally, never to "make
 * it pass".
 */

describe('taxEngine — metadata & helpers', () => {
  it('exposes provenance for each year', () => {
    expect(tableMeta(2026).source).toBe('ΦΕΚ 2024');
    expect(tableMeta(2025).version).toBe('2024/2025');
  });

  it('2025 and 2026 share the same dataset until the 2026 ΦΕΚ lands', () => {
    expect(tablesFor(2025)).toBe(tablesFor(2026));
  });

  it('payments per year: employee 14 (with δώρα), freelancer 12', () => {
    expect(paymentsPerYear(2026, false)).toBe(14);
    expect(paymentsPerYear(2026, true)).toBe(12);
  });

  it('exposes 6 freelancer EFKA classes', () => {
    expect(efkaFreelancerClasses(2026)).toHaveLength(6);
  });
});

describe('calcEmployee', () => {
  it('non-positive gross yields a zeroed employee result', () => {
    const r = calcEmployee(0, 0, 0, 2026);
    expect(r).toEqual({ net: 0, gross: 0, efka: 0, tax: 0, year: 2026, mode: 'employee' });
  });

  it('1000€/mo, no children, no triennia (2026)', () => {
    const r = calcEmployee(1000, 0, 0, 2026);
    expect(r.gross).toBeCloseTo(1000, 2);
    expect(r.efka).toBeCloseTo(138.67, 2); // 1000 * 0.13867
    expect(r.tax).toBeCloseTo(41.22, 1); // see derivation in spec
    expect(r.net).toBeCloseTo(820.11, 1);
    expect(r.mode).toBe('employee');
  });

  it('applies the EFKA monthly insurable-earnings ceiling', () => {
    const r = calcEmployee(10000, 0, 0, 2026);
    // Without the ceiling efka would be 10000 * 0.13867 = 1386.70.
    expect(r.efka).toBeCloseTo(1050.1, 1); // 7572.62 * 0.13867
    expect(r.efka).toBeLessThan(10000 * 0.13867);
  });

  it('caps the triennia seniority bump at 3 (5 → 1.3x)', () => {
    const r = calcEmployee(1000, 0, 5, 2026);
    expect(r.gross).toBeCloseTo(1300, 2); // 1000 * (1 + 0.1*3), not *1.5
  });

  it('child tax-reduction lowers tax at modest income', () => {
    const none = calcEmployee(1200, 0, 0, 2026);
    const twoKids = calcEmployee(1200, 2, 0, 2026);
    expect(twoKids.tax).toBeLessThan(none.tax);
    expect(twoKids.net).toBeGreaterThan(none.net);
  });

  it('phases the reduction out at high income (children no longer matter)', () => {
    const none = calcEmployee(10000, 0, 0, 2026);
    const threeKids = calcEmployee(10000, 3, 0, 2026);
    // Reduction fully phased out → identical tax regardless of children.
    expect(threeKids.tax).toBeCloseTo(none.tax, 2);
  });
});

describe('calcFreelancer', () => {
  it('non-positive revenue yields a zeroed freelancer result', () => {
    const r = calcFreelancer(0, 1, 0, 2026);
    expect(r).toEqual({ net: 0, gross: 0, efka: 0, tax: 0, year: 2026, mode: 'freelancer' });
  });

  it('applies the presumptive minimum (τεκμαρτό) when profit is below it', () => {
    const r = calcFreelancer(500, 1, 0, 2026);
    expect(r.presumptive).toBe(true);
    expect(r.efka).toBeCloseTo(244.62, 2); // class 1
    // Tax computed on 11620 floor: 900 + 1620*0.22 = 1256.4 / 12.
    expect(r.tax).toBeCloseTo(104.7, 1);
    expect(r.net).toBeCloseTo(150.68, 1);
  });

  it('does not apply the presumptive minimum when profit exceeds it', () => {
    const r = calcFreelancer(5000, 1, 0, 2026);
    expect(r.presumptive).toBe(false);
  });

  it('scales the presumptive minimum by years of activity (+10%/3yr over 6yr)', () => {
    // 9 years → 1 extra period → 11620 * 1.1 = 12782 taxable floor.
    const r = calcFreelancer(100, 1, 9, 2026);
    expect(r.presumptive).toBe(true);
    expect(r.tax).toBeCloseTo(126.0, 1); // (900 + 2782*0.22) / 12
    expect(r.net).toBeLessThan(0); // deductions exceed revenue
  });
});

describe('taxEngine — reverse pricing (solveGrossForNet)', () => {
  it('finds the freelancer revenue that yields a target net', () => {
    const target = 2000;
    const gross = solveGrossForNet(target, (g) => calcFreelancer(g, 1, 5, 2026).net);
    expect(gross).not.toBeNull();
    // round-trip: forward calc on the solved gross reproduces the target net
    expect(calcFreelancer(gross!, 1, 5, 2026).net).toBeCloseTo(target, 1);
    expect(gross!).toBeGreaterThan(target); // gross must exceed net
  });

  it('finds the employee gross that yields a target net', () => {
    const target = 1500;
    const gross = solveGrossForNet(target, (g) => calcEmployee(g, 0, 5, 2026).net);
    expect(gross).not.toBeNull();
    expect(calcEmployee(gross!, 0, 5, 2026).net).toBeCloseTo(target, 1);
  });

  it('returns null for a non-positive target', () => {
    expect(solveGrossForNet(0, (g) => calcFreelancer(g, 1, 5, 2026).net)).toBeNull();
    expect(solveGrossForNet(-100, (g) => calcEmployee(g, 0, 5, 2026).net)).toBeNull();
  });
});
