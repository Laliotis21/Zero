import { useCallback, useMemo } from 'react';
import { useSettings } from '../settings/SettingsContext';
import { CURRENCY_RATE, CURRENCY_SYMBOL, formatMoney, splitEuro } from './format';

/**
 * Currency-aware money helpers bound to the active currency setting. Inputs are
 * euro amounts; the active FX rate is applied before formatting.
 * `format(v)` -> "1.234,50 $", `split(v)` -> styled parts, `symbol`.
 */
export function useMoney() {
  const { settings } = useSettings();
  const currency = settings.currency;
  const rate = CURRENCY_RATE[currency];

  const format = useCallback((value: number) => formatMoney(value * rate, currency), [currency, rate]);
  const split = useCallback((value: number) => splitEuro(value * rate), [rate]);

  return useMemo(
    () => ({ format, split, symbol: CURRENCY_SYMBOL[currency] }),
    [format, split, currency],
  );
}
