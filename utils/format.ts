import type { Currency } from '../settings/SettingsContext';

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

/**
 * Static EUR-based FX rates. Every figure is computed in euro (Greek tax);
 * these convert the *displayed* amount when the user picks USD/GBP. Rates are
 * approximate and maintained by hand — the app has no live FX feed offline.
 */
export const CURRENCY_RATE: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
};

/** Convert a euro amount into the target currency via the static rate. */
export function convertFromEur(eur: number, currency: Currency): number {
  return eur * CURRENCY_RATE[currency];
}

/**
 * Greek-locale number body: 1642.5 -> "1.642,50" (dot thousands, comma decimal).
 * Pure, dependency-free (Intl locale data is unreliable on some RN/Hermes builds).
 */
function formatBody(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  const [intPart = '0', decPart = '00'] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';
  return `${sign}${grouped},${decPart}`;
}

/**
 * Money formatter. Symbol trails the number (Greek convention) for every
 * currency. The `value` is expected already in the target currency — convert
 * euro inputs with `convertFromEur` first (the `useMoney` hook does this).
 */
export function formatMoney(value: number, currency: Currency = 'EUR', withSymbol = true): string {
  const body = formatBody(value);
  return withSymbol ? `${body} ${CURRENCY_SYMBOL[currency]}` : body;
}

/** Back-compat euro formatter: 1642.5 -> "1.642,50 €". */
export function formatEuro(value: number, withSymbol = true): string {
  return formatMoney(value, 'EUR', withSymbol);
}

/** "1.642,50" split for styled rendering (big int + small decimals). */
export function splitEuro(value: number): { whole: string; cents: string } {
  const [whole = '0', cents = '00'] = formatBody(value).split(',');
  return { whole, cents };
}

/** Group an integer digit string with Greek dot thousands: "1234500" -> "1.234.500". */
export function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Live-format a raw amount input as the user types: groups the integer part with
 * dot thousands and keeps at most one comma decimal (max 2 digits).
 * "1234500" -> "1.234.500", "1234,5" -> "1.234,5". Pairs with `parseAmount`.
 */
export function formatAmountInput(raw: string): string {
  // Keep digits and commas only; collapse any commas after the first.
  let s = raw.replace(/[^0-9,]/g, '');
  const firstComma = s.indexOf(',');
  const hasDecimal = firstComma !== -1;
  if (hasDecimal) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '');
  }
  const [intRaw = '', decRaw = ''] = s.split(',');
  // Strip leading zeros but keep a lone "0".
  const intClean = intRaw.replace(/^0+(?=\d)/, '');
  const grouped = groupDigits(intClean);
  if (!hasDecimal) return grouped;
  return `${grouped},${decRaw.slice(0, 2)}`;
}
