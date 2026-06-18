/**
 * Auth provider seam. Google uses Supabase OAuth (PKCE) via the system auth
 * session; Apple uses native sign-in (expo-apple-authentication) to obtain an
 * identity token handed to Supabase (`signInWithIdToken`). Email uses Supabase
 * password auth. On success, Supabase persists the session and AuthContext's
 * `onAuthStateChange` listener flips the user truthy — these functions only
 * trigger the flow and surface errors.
 *
 * Two thrown sentinels carry extra meaning rather than being generic failures:
 *   • Error('cancelled')     — user dismissed the provider sheet (silent reset).
 *   • Error('confirm-email') — sign-up succeeded but needs email confirmation.
 *
 * For Google/Apple to work the matching provider must be enabled in the
 * Supabase dashboard (Auth → Providers) with its OAuth client id/secret.
 */

import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_CONFIGURED } from '../session/supabase';

export type AuthProvider = 'google' | 'apple' | 'email';

export interface AuthUser {
  /** Stable unique id (Supabase user id). */
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
}

function requireSupabase(): void {
  if (!SUPABASE_CONFIGURED) {
    throw new Error('Supabase not configured — set EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY in .env.');
  }
}

// Deep-link the OAuth redirect back into the app. Must be allow-listed in the
// Supabase dashboard (Auth → URL Configuration → Redirect URLs) and matches the
// `scheme` in app.json.
const GOOGLE_REDIRECT = 'zero://auth-callback';

/**
 * Google sign-in via Supabase OAuth (PKCE) through the system auth session
 * (ASWebAuthenticationSession on iOS / Custom Tabs on Android). We can't use the
 * native idToken flow with Supabase: GoogleSignIn's iOS SDK (AppAuth) stamps a
 * random nonce into the idToken that it never exposes, so gotrue's nonce check
 * can never match. The OAuth code flow sidesteps it entirely and is uniform
 * across platforms. Supabase opens Google, redirects back to GOOGLE_REDIRECT
 * with an auth `code`, which we exchange for a session.
 */
export async function signInWithGoogle(): Promise<void> {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_REDIRECT,
      // We drive the browser ourselves so we can capture the redirect URL.
      skipBrowserRedirect: true,
      // Always show the account chooser instead of silently reusing a session.
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Google sign-in could not start.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, GOOGLE_REDIRECT);
  // User closed the sheet — treat as a silent cancel, like the other providers.
  if (result.type !== 'success') throw new Error('cancelled');

  const url = new URL(result.url);
  const errDesc = url.searchParams.get('error_description');
  if (errDesc) throw new Error(errDesc);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('Google did not return an auth code.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export async function signInWithApple(): Promise<void> {
  requireSupabase();
  // SECURITY TODO (nonce): bind the idToken to this auth attempt to prevent
  // replay. Generate a random nonce, pass SHA256(nonce) as signInAsync({ nonce })
  // and the raw nonce as supabase.auth.signInWithIdToken({ ..., nonce }). Requires
  // adding expo-crypto (digestStringAsync) + a native rebuild — deferred.
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
    const idToken = credential.identityToken;
    if (!idToken) throw new Error('Apple did not return an identityToken.');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken });
    if (error) throw error;
  } catch (err) {
    // User dismissed the Apple sheet.
    if (err instanceof Error && (err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new Error('cancelled');
    }
    throw err;
  }
}

/**
 * Email/password sign-in or registration via Supabase. `register` switches
 * `signUp` vs `signInWithPassword`. With email confirmation enabled in the
 * Supabase dashboard, a fresh sign-up returns no session until the link is
 * clicked, so we throw `confirm-email` for the UI to surface a "check your
 * inbox" message instead of treating it as a failure.
 */
export async function signInWithEmail(
  email: string,
  password: string,
  register: boolean,
): Promise<void> {
  requireSupabase();
  if (register) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('confirm-email');
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
