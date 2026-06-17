/**
 * Pluggable auth provider seam.
 *
 * These functions are the *single* place real authentication gets wired in.
 * Today they return mock identities so the whole sign-in UI flow is testable
 * with no backend and no OAuth client IDs. To go live, replace each body —
 * keep the `AuthUser` return shape and nothing else in the app has to change:
 *
 *   • Google → `@react-native-google-signin/google-signin` or
 *     `expo-auth-session/providers/google` (needs an OAuth client ID).
 *   • Apple  → `expo-apple-authentication` (iOS native; returns an identity
 *     token to POST to your backend).
 *   • Email  → your own `POST /auth/login` · `POST /auth/register`.
 *
 * Each may throw; callers surface the error to the user.
 */

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

export async function signInWithGoogle(): Promise<AuthUser> {
  // TODO(auth): swap for a real Google OAuth flow + backend token exchange.
  await delay(700);
  return { id: 'google:demo', name: 'Google User', email: 'you@gmail.com', provider: 'google' };
}

export async function signInWithApple(): Promise<AuthUser> {
  // TODO(auth): swap for expo-apple-authentication + backend token exchange.
  // Apple only returns name/email on the *first* authorization, so a real
  // implementation must persist them server-side on first sign-in.
  await delay(700);
  return { id: 'apple:demo', name: 'Apple User', email: 'you@icloud.com', provider: 'apple' };
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
