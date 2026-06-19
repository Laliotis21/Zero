# Zero — Testing TODO

Audit 2026-06-16. Updated 2026-06-18. Health: jest 19/19 pass, `tsc --noEmit` clean (needs `npm install` for `expo-store-review`), `eslint .` clean. No crashes.

## Blocker — interactive emulator testing — RESOLVED
- [x] Live tap-through unblocked. Root cause: metro MCP bound stale CDP page. Fix: raw websocket (Node global `WebSocket`) to `ws://localhost:8081/inspector/debug?device=<id>&page=2`, inject fiber-walk driver via `globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__` (use `globalThis`, not `global` — Hermes lacks it). Screenshots via `xcrun simctl io booted screenshot`. All screens verified live. Method saved to memory `zero-emulator-test-harness`.

## Functional gaps / dead buttons (MEDIUM) — FIXED (merge b400e2e)
- [x] Onboarding "Παράλειψη" no longer bypasses disclaimer — Skip jumps to last slide (`skipToEnd`), accept-checkbox gate enforced. `components/Onboarding.tsx`
- [x] Paywall — "Upgrade" (Results) + "Get Pro €2.99" (Profile) no longer route to free Budget tab. Show honest "coming soon" Alert. Dead `onUpgrade` prop chain removed (App, ResultsScreen, ProfileScreen). Real IAP still TODO (needs store product + purchase SDK). `screens/ResultsScreen.tsx`, `screens/ProfileScreen.tsx`
- [x] Budget "Save" persists split to AsyncStorage (`zero.budget.v1`) + confirm Alert. "Export PDF" → "coming soon" Alert (needs native print module). `screens/BudgetScreen.tsx`
- [x] Profile "Terms" / "Privacy" / "Rate" wired (PR #6). Terms/Privacy → `openLink` (in-app browser); Rate → `requestAppReview` (native StoreReview). `utils/links.ts`, `screens/ProfileScreen.tsx`. Note: legal URLs (`https://zerofinance.app/terms`, `/privacy`) must be hosted before submission.

## Correctness / UX (LOW) — FIXED
- [x] FX conversion added. `CURRENCY_RATE` (static EUR-based) + `convertFromEur` in `utils/format.ts`; `useMoney` applies the active rate to `format`/`split`; ResultsScreen hero uses `money.split` (was raw `splitEuro`). `currency.note` now says "fixed approximate rate — not live FX". Tests added. `utils/money.ts`, `utils/format.ts`
- [x] `sanitizeForm` clamps hydrated ints via `clampInt`: years 0–9, activeYears 0–40, efkaClass 1–6 (mirrors steppers + class table). Corrupt blob no longer yields empty fee card. `session/SessionContext.tsx`
- [x] `budget.tag` no longer claims "inflation-adjusted" (false) — now "{year} · 50/30/20", matching `buildBudget`. `i18n/strings.ts`

## Launch strategy (decided 2026-06-19)
- **Android-first.** Ship to Google Play first. iOS (App Store) only later, if it goes well.
- Implication: iOS-specific blockers below are **deferred**, not dropped. Android has its own equivalents (Play Data Safety form, Google Play Billing).

## Production readiness — go-live blockers
P0 (block App Store submission):
- [x] iOS bundleId aligned to `app.zerofinance.mobile` (was `com.zero.app`; commit 653cdb1). `app.json`, `auth/GOOGLE_SETUP.md`, `auth/googleConfig.ts`
- [ ] Apple Developer App ID `app.zerofinance.mobile` registered (+ Apple Sign-In capability).
- [ ] Google iOS OAuth client re-created for new bundle; update `iosUrlScheme` (`app.json`) + Supabase Authorized Client IDs. Sign-in breaks until done.
- [x] Legal pages hosted free on GitHub Pages (`docs/{terms,privacy,index}.html`). Links updated → `https://laliotis21.github.io/Zero/terms.html` + `/privacy.html` (`utils/links.ts`). **Action left: repo Settings → Pages → Source: main `/docs`** to publish. Legal text is generic template — get lawyer-reviewed.
- [~] Pro paywall — RevenueCat scaffolded (`purchases/Purchases.ts`, `purchases/ProContext.tsx`, `usePro()`), CTAs wired (`ProfileScreen` buyPro/restore, `ResultsScreen` purchase), `react-native-purchases` added, dormant until key set. **iOS-only scaffold** (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, App Store IAP `zero_pro_monthly`/entitlement `pro`). **Android needs adding: Google Play Billing + RevenueCat Android key + Play Console product.** Setup steps in `REVENUECAT_SETUP.md`.
- [x] `EXPO_PUBLIC_SENTRY_DSN` set in `.env` (valid format, gitignored); `utils/crash.ts` wired. Live crash reporting in prod builds. Real-crash test pending a build.
- [ ] ~~App Store Connect privacy/data-collection disclosure~~ — **SKIP (iOS deferred, Android-first).** Replace with **Google Play Data Safety form** (Play Console) — same data: email/name/userID collected+linked (App Functionality), salary on-device (not collected), crash+performance not-linked, no tracking SDKs. Source: `APP_STORE_PRIVACY.md`. Privacy Policy URL = `https://laliotis21.github.io/Zero/privacy.html`.
- [ ] Supabase OAuth callback on default `*.supabase.co` → redirect_uri_mismatch risk; custom domain before prod (memory `google-oauth-prod-domain`).

P1:
- [x] Profile Rate link wired (PR #6, StoreReview).
- [x] `expo-store-review` installed (`npm install`) — typecheck clean, 21/21 tests pass.

## A11y (minor) — FIXED
- [x] `OptionSheet` options now role `radio` inside a `radiogroup` container, `accessibilityState.selected` set. `components/ui/OptionSheet.tsx`
- [x] `TabBar` container now has `tablist` role (tabs already `tab`). `components/TabBar.tsx`

## Not a bug (confirmed correct)
- Freelancer high years + low revenue → negative net (e.g. rev=500/yrs=40 → −105.67€). Handled by Results "Αρνητικά καθαρά / τεκμαρτό" state. Correct τεκμαρτό domain behavior.
- Tax engine numerically sane (employee/freelancer/triennia/children/EFKA ceiling probed).
