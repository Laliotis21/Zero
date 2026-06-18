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

## Production readiness — go-live blockers
P0 (block App Store submission):
- [x] iOS bundleId aligned to `app.zerofinance.mobile` (was `com.zero.app`; commit 653cdb1). `app.json`, `auth/GOOGLE_SETUP.md`, `auth/googleConfig.ts`
- [ ] Apple Developer App ID `app.zerofinance.mobile` registered (+ Apple Sign-In capability).
- [ ] Google iOS OAuth client re-created for new bundle; update `iosUrlScheme` (`app.json`) + Supabase Authorized Client IDs. Sign-in breaks until done.
- [ ] Host legal pages `https://zerofinance.app/terms` + `/privacy` (links wired, pages missing).
- [ ] Pro paywall still stub — "Get Pro" → `comingSoon` Alert (`ProfileScreen.tsx:260`), Results "Upgrade" + AI Reverse Pricing no purchase flow. Decide: implement IAP (RevenueCat/StoreKit) **or** hide paywall for v1.
- [ ] `EXPO_PUBLIC_SENTRY_DSN` absent from `.env` → no crash reporting in prod (`utils/crash.ts:12`).
- [ ] App Store Connect privacy/data-collection disclosure (email auth collects PII).
- [ ] Supabase OAuth callback on default `*.supabase.co` → redirect_uri_mismatch risk; custom domain before prod (memory `google-oauth-prod-domain`).

P1:
- [x] Profile Rate link wired (PR #6, StoreReview).
- [ ] `npm install` to pull `expo-store-review` (~9.0.9) — typecheck fails on `utils/links.ts` until installed.

## A11y (minor) — OPEN
- [ ] `OptionSheet` options use role `button` not `radio`. `components/ui/OptionSheet.tsx`
- [ ] `TabBar` tabs lack `tablist` container role. `components/TabBar.tsx`

## Not a bug (confirmed correct)
- Freelancer high years + low revenue → negative net (e.g. rev=500/yrs=40 → −105.67€). Handled by Results "Αρνητικά καθαρά / τεκμαρτό" state. Correct τεκμαρτό domain behavior.
- Tax engine numerically sane (employee/freelancer/triennia/children/EFKA ceiling probed).
