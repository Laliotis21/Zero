# Zero — Testing TODO

Audit 2026-06-16. Health: jest 19/19, `tsc --noEmit` clean, `eslint .` clean. No crashes.
Live emulator tap-through working; all screens verified (Home/Results/Budget/Profile/OptionSheet/dark/freelancer).

## DONE
- [x] Interactive emulator testing unblocked — raw-CDP fiber driver (`tap`/`settext`/`dump`) on page=2 + `xcrun simctl` screenshots. metro MCP `evaluate_js`/`tap_element` bind a stale CDP page → not used.
- [x] All 4 screens + onboarding + components + tax engine audited; calcs live-verified vs engine probe.

## REMAINING — what's left to fix

### MEDIUM — functional gaps / dead buttons
- [ ] Onboarding "Παράλειψη" bypasses disclaimer. Slides 1–2 Skip calls `onDone()` without accept checkbox → legal gate skippable. Fix: route Skip to last slide (force accept) or persist a separate accepted flag. `components/Onboarding.tsx`
- [ ] Paywall has no purchase. "Upgrade" (Results) + "Απόκτησε Pro / €2.99" (Profile) just `goBudget` → Budget is already free, paywall locks nothing. Fix: real IAP or gate a premium feature. `screens/ResultsScreen.tsx`, `screens/ProfileScreen.tsx`
- [ ] Budget "Save" + "Export PDF" = no-op (`onSave/onExport = () => undefined`). Implement or hide. `screens/BudgetScreen.tsx`
- [ ] Profile "Σύνδεση/Εγγραφή", "Όροι χρήσης", "Απόρρητο", "Βαθμολόγησε" = no-op (`noop`). Wire up or hide. `screens/ProfileScreen.tsx`

### LOW — correctness / UX
- [ ] Currency = symbol swap only, no FX. USD/GBP show euro amounts with $/£. Fix: add conversion or restrict to EUR. `utils/money.ts`, `utils/format.ts`
- [ ] `sanitizeForm` doesn't clamp hydrated `years/activeYears/efkaClass`. Corrupt blob (e.g. `efkaClass=99`) → class card fee shows `0 €` until stepper touched. Fix: clamp on hydrate. `session/SessionContext.tsx`
- [ ] `budget.tag` says "τιμαριθμικά / inflation-adjusted" but `buildBudget` does none — plain 50/30/20. Fix: remove label or implement adjustment. `i18n/strings.ts`, `utils/budget.ts`

### MINOR — a11y
- [ ] `OptionSheet` options role `button` → should be `radio`. `components/ui/OptionSheet.tsx`
- [ ] `TabBar` tabs lack `tablist` container role. `components/TabBar.tsx`

## Not a bug (verified correct)
- Freelancer high years + low revenue → negative net (rev=500/yrs=40 → −105.67€); handled by Results "Αρνητικά καθαρά / τεκμαρτό" state. Correct τεκμαρτό behavior.
- Tax engine numerically sane (employee/freelancer/triennia/children/EFKA ceiling) — probed + live-verified.

_Note: test left app in dark theme / freelancer / gross 500. Reset in Προφίλ + Είσοδος if needed._
