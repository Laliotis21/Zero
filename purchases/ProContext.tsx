import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getCustomerInfo,
  hasProEntitlement,
  initPurchases,
  purchaseProMonthly,
  purchasesEnabled,
  restorePurchases as restorePurchasesSdk,
  type PurchaseOutcome,
} from './Purchases';

interface ProValue {
  /** True when the user holds the Pro entitlement. */
  isPro: boolean;
  /** True while a purchase/restore/initial fetch is in flight. */
  loading: boolean;
  /** Whether RevenueCat is configured at all (API key present). */
  available: boolean;
  /** Run the monthly Pro purchase flow. Returns the outcome for the caller. */
  purchase: () => Promise<PurchaseOutcome>;
  /** Restore prior purchases; returns true if Pro is now active. */
  restore: () => Promise<boolean>;
}

const ProContext = createContext<ProValue | null>(null);

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(purchasesEnabled);

  // Configure the SDK and read entitlement state once. No-op without a key.
  useEffect(() => {
    if (!purchasesEnabled) return;
    let cancelled = false;
    initPurchases();
    (async () => {
      const info = await getCustomerInfo();
      if (!cancelled) {
        setIsPro(hasProEntitlement(info));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const purchase = useCallback(async (): Promise<PurchaseOutcome> => {
    setLoading(true);
    try {
      const outcome = await purchaseProMonthly();
      if (outcome.status === 'success') setIsPro(hasProEntitlement(outcome.info));
      return outcome;
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const info = await restorePurchasesSdk();
      const pro = hasProEntitlement(info);
      setIsPro(pro);
      return pro;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<ProValue>(
    () => ({ isPro, loading, available: purchasesEnabled, purchase, restore }),
    [isPro, loading, purchase, restore],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

/** Access Pro entitlement state and the purchase/restore actions. */
export function usePro(): ProValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
}
