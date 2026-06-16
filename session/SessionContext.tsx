import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TaxYear } from '../settings/SettingsContext';
import type { CalcResult, Mode } from '../types';

/** Persisted home-screen form so inputs survive an app kill. */
export interface HomeForm {
  mode: Mode;
  period: 'month' | 'year';
  gross: string;
  children: string;
  years: number;
  activeYears: number;
  efkaClass: number;
}

export const DEFAULT_FORM: HomeForm = {
  mode: 'employee',
  period: 'month',
  gross: '',
  children: '0',
  years: 0,
  activeYears: 0,
  efkaClass: 1,
};

const STORAGE_KEY = 'zero.session.v1';

interface PersistShape {
  form: HomeForm;
  result: CalcResult | null;
}

const MODES: readonly Mode[] = ['employee', 'freelancer'];

/** Defensive parse — never let a corrupt blob crash hydration. */
function sanitizeForm(raw: unknown): HomeForm {
  if (!raw || typeof raw !== 'object') return DEFAULT_FORM;
  const r = raw as Record<string, unknown>;
  return {
    mode: MODES.includes(r.mode as Mode) ? (r.mode as Mode) : DEFAULT_FORM.mode,
    period: r.period === 'year' ? 'year' : 'month',
    gross: typeof r.gross === 'string' ? r.gross : '',
    children: typeof r.children === 'string' ? r.children : '0',
    years: Number.isFinite(r.years) ? (r.years as number) : 0,
    activeYears: Number.isFinite(r.activeYears) ? (r.activeYears as number) : 0,
    efkaClass: Number.isFinite(r.efkaClass) ? (r.efkaClass as number) : 1,
  };
}

function sanitizeResult(raw: unknown): CalcResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nums = ['net', 'gross', 'efka', 'tax'] as const;
  if (!nums.every((k) => Number.isFinite(r[k]))) return null;
  if (r.year !== 2025 && r.year !== 2026) return null;
  if (!MODES.includes(r.mode as Mode)) return null;
  return {
    net: r.net as number,
    gross: r.gross as number,
    efka: r.efka as number,
    tax: r.tax as number,
    year: r.year as TaxYear,
    mode: r.mode as Mode,
    presumptive: r.presumptive === true,
  };
}

interface SessionValue {
  form: HomeForm;
  patchForm: (patch: Partial<HomeForm>) => void;
  result: CalcResult | null;
  setResult: (result: CalcResult | null) => void;
  hydrating: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<HomeForm>(DEFAULT_FORM);
  const [result, setResultState] = useState<CalcResult | null>(null);
  const [hydrating, setHydrating] = useState(true);
  // Latest snapshot for the persist effect (avoids stale closures).
  const latest = useRef<PersistShape>({ form, result });
  latest.current = { form, result };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          setForm(sanitizeForm(parsed.form));
          setResultState(sanitizeResult(parsed.result));
        }
      } catch {
        // Corrupt/unavailable storage — start fresh.
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)).catch(() => undefined);
  }, []);

  const patchForm = useCallback(
    (patch: Partial<HomeForm>) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        latest.current = { ...latest.current, form: next };
        return next;
      });
      persist();
    },
    [persist],
  );

  const setResult = useCallback(
    (r: CalcResult | null) => {
      setResultState(r);
      latest.current = { ...latest.current, result: r };
      persist();
    },
    [persist],
  );

  const value = useMemo(
    () => ({ form, patchForm, result, setResult, hydrating }),
    [form, patchForm, result, setResult, hydrating],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
