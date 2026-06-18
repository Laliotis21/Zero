/**
 * Google OAuth client IDs. Fill these from Google Cloud Console →
 * APIs & Services → Credentials (see auth/GOOGLE_SETUP.md).
 *
 *   • Web client ID  → audience for the idToken (required for verification,
 *     used on every platform). Sign-in cannot work without it.
 *   • iOS client ID  → the iOS OAuth client for bundle app.zerofinance.mobile. Optional:
 *     Android matches by package + SHA-1 (no id in code) and needs only the web
 *     client id, so iOS may stay a placeholder until we ship iOS.
 *
 * Until the web ID is set to a real value, signInWithGoogle() throws and the
 * login screen surfaces a graceful error instead of crashing.
 */
export const GOOGLE_WEB_CLIENT_ID = '902230726949-eijnvdges2bifvnha5opi357vmtdunh8.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '902230726949-94urbv5hreg7qsofmu31bqdbslnnrenq.apps.googleusercontent.com';

/** True when the iOS client id has been set to a real value (iOS sign-in only). */
export const GOOGLE_IOS_CONFIGURED = !GOOGLE_IOS_CLIENT_ID.startsWith('YOUR_');

/**
 * True when sign-in can run. Only the web client id is required — it is the
 * idToken audience Supabase verifies, on Android and iOS alike. The iOS id is
 * gated separately (GOOGLE_IOS_CONFIGURED) so Android ships without it.
 */
export const GOOGLE_CONFIGURED = !GOOGLE_WEB_CLIENT_ID.startsWith('YOUR_');
  