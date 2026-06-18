/**
 * Pluggable auth provider seam — all three providers authenticate through
 * Supabase Auth so a single backend owns sessions, refresh and user records.
 *
 *   • Email  → supabase.auth.signUp / signInWithPassword.
 *   • Google → native Google sign-in yields an idToken → signInWithIdToken.
 *   • Apple  → native Apple sign-in yields an identityToken → signInWithIdToken.
 *
 * Each may throw; callers surface the error to the user. Two thrown sentinels
 * carry extra meaning rather than being treated as generic failures:
 *   • Error('cancelled')     — user dismissed the provider sheet (silent reset).
 *   • Error('confirm-email') — sign-up succeeded but needs email confirmation.
 *
 * For Google/Apple to work the matching provider must be enabled in the
 * Supabase dashboard (Auth → Providers) with its OAuth client id/secret, and
 * Google still needs the native client ids in auth/googleConfig.ts.
 */
import type { User } from '@supabase/supabase-js';
import { GOOGLE_CONFIGURED, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './googleConfig';
import { supabase } from './supabaseClient';

export type AuthProvider = 'google' | 'apple' | 'email';

export interface AuthUser {
  /** Stable unique id (the Supabase user id). */
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
}

/** Map a Supabase user record onto our slim app-facing shape. */
export function toAuthUser(user: User, provider: AuthProvider): AuthUser {
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

/**
 * Lazily load the native Google module on first sign-in and configure it once.
 * Deferred via dynamic import so the native module is never touched at app
 * launch — a binary not yet rebuilt with it still boots (only a Google tap
 * fails, gracefully). Also avoids loading it in Jest, which has no native side.
 */
let googleConfigured = false;
async function loadGoogle() {
  const google = await import('@react-native-google-signin/google-signin');
  if (!googleConfigured) {
    if (!GOOGLE_CONFIGURED) {
      throw new Error('Google OAuth client IDs not set — edit auth/googleConfig.ts.');
    }
    google.GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    googleConfigured = true;
  }
  return google;
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await loadGoogle();
  try {
    await GoogleSignin.hasPlayServices(); // no-op on iOS; checks Play Services on Android.
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new Error('cancelled');
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google sign-in returned no idToken.');
    // Exchange the Google idToken for a Supabase session.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return toAuthUser(data.user, 'google');
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('cancelled');
    }
    throw err;
  }
}

export async function signInWithApple(): Promise<AuthUser> {
  // Lazy import for the same reason as Google: never touch the native module at
  // launch, and keep it out of Jest (which has no native side).
  const AppleAuthentication = await import('expo-apple-authentication');
  // Apple Sign In is iOS-only (and needs the entitlement); fail gracefully
  // anywhere it isn't available rather than crashing.
  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Apple sign-in is not available on this device.');
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple sign-in returned no identityToken.');
    // Exchange the Apple identityToken for a Supabase session.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
    // Apple returns the name only on the *first* authorization; prefer it when
    // present since Supabase won't have it on re-auth.
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    const mapped = toAuthUser(data.user, 'apple');
    return fullName ? { ...mapped, name: fullName } : mapped;
  } catch (err) {
    // User dismissed the Apple sheet.
    if (err instanceof Error && (err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new Error('cancelled');
    }
    throw err;
  }
}

/**
 * Email/password sign-in or registration against Supabase Auth. With email
 * confirmation enabled, a successful sign-up returns no session — the user must
 * click the link we email them — so we throw `confirm-email` for the UI to
 * surface a "check your inbox" message instead of treating it as a failure.
 */
export async function signInWithEmail(
  email: string,
  password: string,
  register: boolean,
): Promise<AuthUser> {
  if (register) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('confirm-email');
    return toAuthUser(data.user, 'email');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return toAuthUser(data.user, 'email');
}
