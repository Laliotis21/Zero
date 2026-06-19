import { Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import * as WebBrowser from 'expo-web-browser';

/** Canonical legal pages, hosted on GitHub Pages from the repo's /docs folder. */
export const TERMS_URL = 'https://laliotis21.github.io/Zero/terms.html';
export const PRIVACY_URL = 'https://laliotis21.github.io/Zero/privacy.html';

/** Open a web link in an in-app browser, falling back to the system browser. */
export async function openLink(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url).catch(() => {});
  }
}

/**
 * Prompt the user to rate the app. Uses the native in-app review flow when the
 * OS allows it (no App Store ID required); otherwise opens the store listing if
 * one is configured. Silently no-ops when neither is available.
 */
export async function requestAppReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
    const url = StoreReview.storeUrl();
    if (url) await Linking.openURL(url);
  } catch {
    /* review unavailable — ignore */
  }
}
