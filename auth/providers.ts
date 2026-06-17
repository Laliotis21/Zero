/**
 * Pluggable auth provider seam.
 *
 * Google + Apple are wired to real native flows (@react-native-google-signin,
 * expo-apple-authentication). Email is still a mock identity so its UI flow
 * stays testable with no backend. To finish it, replace the body — keep the
 * `AuthUser` return shape and nothing else in the app has to change:
 *
 *   • Email → your own `POST /auth/login` · `POST /auth/register`.
 *
 * Each may throw; callers surface the error to the user. A thrown
 * `Error('cancelled')` means the user dismissed the provider sheet.
 */

import { GOOGLE_CONFIGURED, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './googleConfig';

export type AuthProvider = 'google' | 'apple' | 'email';

export interface AuthUser {
  /** Stable unique id (provider-namespaced). */
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
}

/** Simulated network latency so the UI exercises its real loading state. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const { user } = response.data;
    return {
      id: `google:${user.id}`,
      name: user.name ?? user.email,
      email: user.email,
      provider: 'google',
    };
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
    // Apple returns name/email only on the *first* authorization; a real backend
    // must persist them then. On re-auth they're null, so we fall back here.
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    const email = credential.email ?? `${credential.user}@privaterelay.appleid.com`;
    return {
      id: `apple:${credential.user}`,
      name: fullName || email,
      email,
      provider: 'apple',
    };
  } catch (err) {
    // User dismissed the Apple sheet.
    if (err instanceof Error && (err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new Error('cancelled');
    }
    throw err;
  }
}

/**
 * Email/password sign-in or registration. `register` only changes which API
 * endpoint a real implementation would call; the mock treats both alike.
 */
export async function signInWithEmail(
  email: string,
  _password: string,
  _register: boolean,
): Promise<AuthUser> {
  // TODO(auth): replace with POST /auth/login | /auth/register.
  await delay(700);
  const name = email.split('@')[0] || email;
  return { id: `email:${email.toLowerCase()}`, name, email, provider: 'email' };
}
