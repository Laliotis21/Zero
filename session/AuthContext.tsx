import type { User } from '@supabase/supabase-js';
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
import { supabase, SUPABASE_CONFIGURED } from './supabase';

const PROVIDERS: readonly Provider[] = ['google', 'apple', 'email'];

/** Map a Supabase user onto the app's AuthUser shape. */
function mapUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const email = user.email ?? '';
  const rawProvider = user.app_metadata?.provider;
  const provider = PROVIDERS.includes(rawProvider as Provider)
    ? (rawProvider as Provider)
    : 'email';
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    email ||
    'User';
  return { id: user.id, name, email, provider };
}

interface AuthValue {
  user: AuthUser | null;
  /** True until the persisted session has been read from secure storage. */
  hydrating: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  /** `register` toggles sign-up vs sign-in. */
  signInEmail: (email: string, password: string, register: boolean) => Promise<void>;
  signOut: () => void;
  /**
   * Permanently delete the signed-in user (Play/App Store data-deletion
   * requirement). Calls the `delete-account` edge function — which uses the
   * service role to remove the auth user — then drops the local session.
   * Throws on failure so the caller can surface an error.
   */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrating, setHydrating] = useState(true);

  // Restore the persisted session and subscribe to all later auth changes.
  // The listener is the single source of truth — sign-in/out anywhere flows
  // back through here, so the sign-in helpers below don't set state directly.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setHydrating(false);
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(mapUser(data.session?.user));
      setHydrating(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user));
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInGoogle = useCallback(() => signInWithGoogle(), []);
  const signInApple = useCallback(() => signInWithApple(), []);
  const signInEmail = useCallback(
    (email: string, password: string, register: boolean) =>
      signInWithEmail(email, password, register),
    [],
  );
  const signOut = useCallback(() => {
    supabase.auth.signOut().catch(() => undefined);
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    // User row is gone server-side; clear the now-orphaned local session.
    await supabase.auth.signOut().catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      user,
      hydrating,
      signInGoogle,
      signInApple,
      signInEmail,
      signOut,
      deleteAccount,
    }),
    [user, hydrating, signInGoogle, signInApple, signInEmail, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
