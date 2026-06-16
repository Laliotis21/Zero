import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'el' | 'en';
export type TaxYear = 2025 | 2026;
export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Settings {
  themeMode: ThemeMode;
  language: Language;
  taxYear: TaxYear;
  currency: Currency;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  language: 'el',
  taxYear: 2026,
  currency: 'EUR',
};

const STORAGE_KEY = 'zero.settings.v1';

const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];
const LANGUAGES: readonly Language[] = ['el', 'en'];
const TAX_YEARS: readonly TaxYear[] = [2025, 2026];
const CURRENCIES: readonly Currency[] = ['EUR', 'USD', 'GBP'];

/** Keep only known-good values from persisted (possibly stale/corrupt) JSON. */
function sanitize(raw: unknown): Partial<Settings> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Settings> = {};
  if (THEME_MODES.includes(r.themeMode as ThemeMode)) out.themeMode = r.themeMode as ThemeMode;
  if (LANGUAGES.includes(r.language as Language)) out.language = r.language as Language;
  if (TAX_YEARS.includes(r.taxYear as TaxYear)) out.taxYear = r.taxYear as TaxYear;
  if (CURRENCIES.includes(r.currency as Currency)) out.currency = r.currency as Currency;
  return out;
}

interface SettingsContextValue {
  settings: Settings;
  /** Patch one or more fields; persisted automatically. */
  update: (patch: Partial<Settings>) => void;
  /** True until the persisted settings have been loaded from disk. */
  hydrating: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrating, setHydrating] = useState(true);

  // Load persisted settings once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) {
          const parsed = sanitize(JSON.parse(raw));
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Corrupt/unavailable storage — fall back to defaults silently.
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, update, hydrating }),
    [settings, update, hydrating],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}
