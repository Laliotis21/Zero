import type { Session } from '@supabase/supabase-js';
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
import { supabase } from '../auth/supabaseClient';

const PROVIDERS: readonly Provider[] = ['google', 'apple', 'email'];

/** Derive our slim app user from a Supabase session (single source of truth). */
function fromSession(session: Session | null): AuthUser | null {
  const user = session?.user;
  if (!user) return null;
  const rawProvider = user.app_metadata?.provider;
  const provider = PROVIDERS.includes(rawProvider as Provider)
    ? (rawProvider as Provider)
    : 'email';
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaName = typeof meta.full_name === 'string' ? meta.full_name : undefined;
  const altName = typeof meta.name === 'string' ? meta.name : undefined;
  const email = user.email ?? '';
  return {
    id: user.id,
    name: metaName || altName || email.split('@')[0] || email || user.id,
    email,
    provider,
  };
}

interface AuthValue {
  user: AuthUser | null;
  /** True until the persisted session has been read from disk. */
  hydrating: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  /** `register` toggles sign-up vs sign-in. */
  signInEmail: (email: string, password: string, register: boolean) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrating, setHydrating] = useState(true);

  // Hydrate from any persisted Supabase session, then keep in sync with every
  // auth change (sign-in, token refresh, sign-out — including from other tabs).
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setUser(fromSession(data.session));
      })
      .finally(() => {
        if (alive) setHydrating(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(fromSession(session));
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // The provider calls establish a Supabase session; onAuthStateChange above is
  // what actually flips `user`, so we just await the side effect here.
  const signInGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInApple = useCallback(async () => {
    await signInWithApple();
  }, []);

  const signInEmail = useCallback(async (email: string, password: string, register: boolean) => {
    await signInWithEmail(email, password, register);
  }, []);

  const signOut = useCallback(() => {
    supabase.auth.signOut().catch(() => undefined);
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
