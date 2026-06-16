# Zero — Testing TODO

Audit 2026-06-16. Health: jest 19/19 pass, `tsc --noEmit` clean, `eslint .` clean. No crashes.

## Blocker — interactive emulator testing
- [ ] Live tap-through not possible: metro CDP runtime dead (`evaluate_js`/`tap_element`/`get_component_tree`/`list_routes` timeout, bound to wrong target `host.exp.Exponent`), `idb` removed from Homebrew, GUI automation blocked by macOS accessibility perms. Screenshot (simctl) works → only Home verified visually.
- [ ] Unblock: grant Terminal accessibility permission (cliclick) OR manual tap + screenshot OR fix CDP target binding.

## Functional gaps / dead buttons (MEDIUM)
- [ ] Onboarding "Παράλειψη" bypasses disclaimer — slides 1–2 Skip calls `onDone()` without accept checkbox. Legal gate bypassable. `components/Onboarding.tsx`
- [ ] Paywall no purchase — "Upgrade" (Results) + "Get Pro €2.99" (Profile) just navigate to Budget tab (`onUpgrade=goBudget`). No IAP. Budget already free → paywall locks nothing. `screens/ResultsScreen.tsx`, `screens/ProfileScreen.tsx`
- [ ] Budget "Save" + "Export PDF" = no-op (`onSave/onExport = () => undefined`). `screens/BudgetScreen.tsx`
- [ ] Profile "Sign in" / "Terms" / "Privacy" / "Rate" = no-op (`noop`). `screens/ProfileScreen.tsx`

## Correctness / UX (LOW)
- [ ] Currency = symbol swap only, no FX conversion. USD/GBP show euro amounts with $/£. Note exists but misleading in Results/Budget. `utils/money.ts`, `utils/format.ts`
- [ ] `sanitizeForm` does not clamp hydrated `years/activeYears/efkaClass`. Corrupt/old blob (e.g. `efkaClass=99`) → class card shows fee `0 €` (`classes[98] ?? 0`) until stepper touched. Calc itself clamps. `session/SessionContext.tsx`
- [ ] `budget.tag` label says "τιμαριθμικά / inflation-adjusted" but `buildBudget` does no inflation adjustment — plain 50/30/20. Misleading. `i18n/strings.ts`, `utils/budget.ts`

## A11y (minor)
- [ ] `OptionSheet` options use role `button` not `radio`. `components/ui/OptionSheet.tsx`
- [ ] `TabBar` tabs lack `tablist` container role. `components/TabBar.tsx`

## Not a bug (confirmed correct)
- Freelancer high years + low revenue → negative net (e.g. rev=500/yrs=40 → −105.67€). Handled by Results "Αρνητικά καθαρά / τεκμαρτό" state. Correct τεκμαρτό domain behavior.
- Tax engine numerically sane (employee/freelancer/triennia/children/EFKA ceiling probed).
