import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

/**
 * Supabase config comes from EXPO_PUBLIC_* env (see .env.example). These are
 * the public URL + anon key — safe to ship in the client; row-level security
 * on the server is what protects data, not key secrecy.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only when both env values are present (not the placeholder/empty). */
export const SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

/**
 * Session storage backed by the encrypted iOS Keychain / Android Keystore.
 *
 * `expo-secure-store` caps a single value at ~2 KB, but a Supabase session
 * (access + refresh token + user JSON) routinely exceeds that. So we transparently
 * chunk values across `${key}.0..n` and keep everything in the secure store —
 * never falling back to plaintext AsyncStorage for tokens.
 */
const CHUNK = 2000;

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(`${key}.n`);
    if (countRaw == null) return null;
    const count = parseInt(countRaw, 10);
    let out = '';
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part == null) return null; // corrupt/partial — treat as signed out
      out += part;
    }
    return out;
  },

  async setItem(key: string, value: string): Promise<void> {
    await ChunkedSecureStore.removeItem(key); // clear any stale chunks first
    const count = Math.max(1, Math.ceil(value.length / CHUNK));
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${key}.n`, String(count));
  },

  async removeItem(key: string): Promise<void> {
    const countRaw = await SecureStore.getItemAsync(`${key}.n`);
    if (countRaw == null) return;
    const count = parseInt(countRaw, 10);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

/**
 * Single shared client. When unconfigured we still construct it against a dummy
 * URL so imports don't throw at launch; every real call is gated by
 * SUPABASE_CONFIGURED (see auth/providers.ts) and getSession just reads empty
 * local storage, so the app boots cleanly with no backend wired yet.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_CONFIGURED ? SUPABASE_URL : 'http://localhost',
  SUPABASE_CONFIGURED ? SUPABASE_ANON_KEY : 'public-anon-key-placeholder',
  {
    auth: {
      storage: ChunkedSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      // No URL-based session detection in a native app (that's web OAuth redirects).
      detectSessionInUrl: false,
    },
  },
);

// Supabase recommends pausing token auto-refresh while backgrounded and resuming
// on foreground, so a returning user gets a fresh token without wasted timers.
if (SUPABASE_CONFIGURED) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
