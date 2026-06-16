import type { Currency } from '../settings/SettingsContext';

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

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
 * currency — the currency setting swaps the symbol only, with no FX conversion.
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
