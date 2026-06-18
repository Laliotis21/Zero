/**
 * Single shared Supabase client for the whole app.
 *
 * The URL and publishable (anon) key are *public* values — safe to ship in the
 * client bundle. Row-Level Security on the server is what actually protects
 * data; the anon key only grants the access your RLS policies allow. Never put
 * the service-role/secret key here.
 *
 * Session tokens are persisted with AsyncStorage and silently refreshed, so a
 * signed-in user stays signed in across app launches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
// Polyfills URL/structuredClone etc. that supabase-js expects but RN lacks.
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://wyvmwkxykfwfqjhgtdul.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6qP2EUgpA7zfif-4XOnSaw_4occtUes';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No deep-link OAuth callback to parse — native providers hand us a token
    // directly via signInWithIdToken.
    detectSessionInUrl: false,
  },
});

// Only refresh tokens while the app is in the foreground; pausing in the
// background avoids needless network churn (per supabase-js RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
