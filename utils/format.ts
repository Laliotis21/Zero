/**
 * Greek-locale euro formatter: 1642.5 -> "1.642,50 €".
 * Pure, dependency-free (Intl locale data is unreliable on some RN/Hermes builds).
 */
export function formatEuro(value: number, withSymbol = true): string {
  const fixed = Math.abs(value).toFixed(2);
  const [intPart = '0', decPart = '00'] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';
  const body = `${sign}${grouped},${decPart}`;
  return withSymbol ? `${body} €` : body;
}

/** "1.642,50" split for styled rendering (big int + small decimals). */
export function splitEuro(value: number): { whole: string; cents: string } {
  const [whole = '0', cents = '00'] = formatEuro(value, false).split(',');
  return { whole, cents };
}
