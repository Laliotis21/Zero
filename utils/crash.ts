import * as Sentry from '@sentry/react-native';

/**
 * Crash & error reporting.
 *
 * Sentry is initialised only when a DSN is provided via the
 * `EXPO_PUBLIC_SENTRY_DSN` env var — so local/dev runs without a DSN stay
 * silent and offline, while production builds (where the DSN is set) report
 * crashes. `captureException` is a safe no-op until `initCrashReporting` runs.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let enabled = false;

export function initCrashReporting(): void {
  if (enabled || !DSN) return;
  Sentry.init({
    dsn: DSN,
    // Keep PII off by default — this app handles salary figures.
    sendDefaultPii: false,
    // Sample performance traces lightly; tune per plan.
    tracesSampleRate: 0.2,
  });
  enabled = true;
}

/** Report a caught error. No-op until crash reporting is initialised. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
