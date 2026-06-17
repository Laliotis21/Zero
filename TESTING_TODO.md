# Zero — Testing TODO

Audit 2026-06-16. Updated 2026-06-17. Health: jest 19/19 pass, `tsc --noEmit` clean, `eslint .` clean. No crashes.

## Blocker — interactive emulator testing — RESOLVED
- [x] Live tap-through unblocked. Root cause: metro MCP bound stale CDP page. Fix: raw websocket (Node global `WebSocket`) to `ws://localhost:8081/inspector/debug?device=<id>&page=2`, inject fiber-walk driver via `globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__` (use `globalThis`, not `global` — Hermes lacks it). Screenshots via `xcrun simctl io booted screenshot`. All screens verified live. Method saved to memory `zero-emulator-test-harness`.

## Functional gaps / dead buttons (MEDIUM) — FIXED (merge b400e2e)
- [x] Onboarding "Παράλειψη" no longer bypasses disclaimer — Skip jumps to last slide (`skipToEnd`), accept-checkbox gate enforced. `components/Onboarding.tsx`
- [x] Paywall — "Upgrade" (Results) + "Get Pro €2.99" (Profile) no longer route to free Budget tab. Show honest "coming soon" Alert. Dead `onUpgrade` prop chain removed (App, ResultsScreen, ProfileScreen). Real IAP still TODO (needs store product + purchase SDK). `screens/ResultsScreen.tsx`, `screens/ProfileScreen.tsx`
- [x] Budget "Save" persists split to AsyncStorage (`zero.budget.v1`) + confirm Alert. "Export PDF" → "coming soon" Alert (needs native print module). `screens/BudgetScreen.tsx`
- [x] Profile "Sign in" / "Terms" / "Privacy" / "Rate" → "coming soon" Alert (need backend / URLs). `screens/ProfileScreen.tsx`

## Correctness / UX (LOW) — OPEN
- [ ] Currency = symbol swap only, no FX conversion. USD/GBP show euro amounts with $/£. Note exists but misleading in Results/Budget. `utils/money.ts`, `utils/format.ts`
- [ ] `sanitizeForm` does not clamp hydrated `years/activeYears/efkaClass`. Corrupt/old blob (e.g. `efkaClass=99`) → class card shows fee `0 €` (`classes[98] ?? 0`) until stepper touched. Calc itself clamps. `session/SessionContext.tsx`
- [ ] `budget.tag` label says "τιμαριθμικά / inflation-adjusted" but `buildBudget` does no inflation adjustment — plain 50/30/20. Misleading. `i18n/strings.ts`, `utils/budget.ts`

## A11y (minor) — OPEN
- [ ] `OptionSheet` options use role `button` not `radio`. `components/ui/OptionSheet.tsx`
- [ ] `TabBar` tabs lack `tablist` container role. `components/TabBar.tsx`

## Not a bug (confirmed correct)
- Freelancer high years + low revenue → negative net (e.g. rev=500/yrs=40 → −105.67€). Handled by Results "Αρνητικά καθαρά / τεκμαρτό" state. Correct τεκμαρτό domain behavior.
- Tax engine numerically sane (employee/freelancer/triennia/children/EFKA ceiling probed).
