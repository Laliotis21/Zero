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
import {
  AuthProvider as Provider,
  AuthUser,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from '../auth/providers';

const STORAGE_KEY = 'zero.auth.v1';

const PROVIDERS: readonly Provider[] = ['google', 'apple', 'email'];

/** Defensive parse — never let a corrupt blob crash hydration. */
function sanitizeUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.email !== 'string') {
    return null;
  }
  if (!PROVIDERS.includes(r.provider as Provider)) return null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    provider: r.provider as Provider,
  };
}

interface AuthValue {
  user: AuthUser | null;
  /** True until the persisted session has been read from disk. */
  hydrating: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  /** `register` toggles login vs sign-up (same mock today). */
  signInEmail: (email: string, password: string, register: boolean) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrating, setHydrating] = useState(true);

  // Restore a persisted session once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) setUser(sanitizeUser(JSON.parse(raw)));
      } catch {
        // Corrupt/unavailable storage — start signed out.
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Persist + apply a freshly authenticated user. */
  const apply = useCallback((u: AuthUser) => {
    setUser(u);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)).catch(() => undefined);
  }, []);

  const signInGoogle = useCallback(async () => {
    apply(await signInWithGoogle());
  }, [apply]);

  const signInApple = useCallback(async () => {
    apply(await signInWithApple());
  }, [apply]);

  const signInEmail = useCallback(
    async (email: string, password: string, register: boolean) => {
      apply(await signInWithEmail(email, password, register));
    },
    [apply],
  );

  const signOut = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ user, hydrating, signInGoogle, signInApple, signInEmail, signOut }),
    [user, hydrating, signInGoogle, signInApple, signInEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
