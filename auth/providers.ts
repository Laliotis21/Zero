/**
 * Auth provider seam. Google + Apple use native sign-in
 * (@react-native-google-signin, expo-apple-authentication) to obtain an
 * identity token, which is then handed to Supabase (`signInWithIdToken`) for
 * server-side verification and session issuance. Email uses Supabase
 * password auth. On success, Supabase persists the session and AuthContext's
 * `onAuthStateChange` listener flips the user truthy — these functions only
 * trigger the flow and surface errors.
 *
 * Each may throw; callers surface the error to the user. A thrown
 * `Error('cancelled')` means the user dismissed the provider sheet.
 */

import { supabase, SUPABASE_CONFIGURED } from '../session/supabase';
import { GOOGLE_CONFIGURED, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './googleConfig';

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
      // webClientId sets the idToken audience Supabase verifies against; it must
      // match the Google provider config in the Supabase dashboard.
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    googleConfigured = true;
  }
  return google;
}

export async function signInWithGoogle(): Promise<void> {
  requireSupabase();
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await loadGoogle();
  try {
    await GoogleSignin.hasPlayServices(); // no-op on iOS; checks Play Services on Android.
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new Error('cancelled');
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google did not return an idToken.');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('cancelled');
    }
    throw err;
  }
}

export async function signInWithApple(): Promise<void> {
  requireSupabase();
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
 * `signUp` vs `signInWithPassword`. (If email confirmation is enabled in the
 * Supabase dashboard, a fresh sign-up has no session until the link is clicked.)
 */
export async function signInWithEmail(
  email: string,
  password: string,
  register: boolean,
): Promise<void> {
  requireSupabase();
  const { error } = register
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
