import { useCallback, useMemo } from 'react';
import { useSettings } from '../settings/SettingsContext';
import { CURRENCY_SYMBOL, formatMoney, splitEuro } from './format';

/**
 * Currency-aware money helpers bound to the active currency setting.
 * `format(v)` -> "1.234,50 $", `split(v)` -> styled parts, `symbol`.
 */
export function useMoney() {
  const { settings } = useSettings();
  const currency = settings.currency;

  const format = useCallback((value: number) => formatMoney(value, currency), [currency]);

  return useMemo(
    () => ({ format, split: splitEuro, symbol: CURRENCY_SYMBOL[currency] }),
    [format, currency],
  );
}
