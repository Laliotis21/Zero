/**
 * Google OAuth client IDs. Fill these from Google Cloud Console →
 * APIs & Services → Credentials (see auth/GOOGLE_SETUP.md).
 *
 *   • Web client ID  → audience for the idToken (required for verification).
 *   • iOS client ID  → the iOS OAuth client created for bundle com.zero.app.
 *
 * Until both are set to real values, signInWithGoogle() throws and the login
 * screen surfaces a graceful error instead of crashing.
 */
export const GOOGLE_WEB_CLIENT_ID = '902230726949-eijnvdges2bifvnha5opi357vmtdunh8.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

/** True only when both IDs have been replaced with real values. */
export const GOOGLE_CONFIGURED =
  !GOOGLE_WEB_CLIENT_ID.startsWith('YOUR_') && !GOOGLE_IOS_CLIENT_ID.startsWith('YOUR_');
