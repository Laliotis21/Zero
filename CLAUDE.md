# Zero

Expo/React Native finance app. iOS-first.

## Stack
- Expo 54, RN 0.81, React 19, TypeScript (strict)
- Supabase auth (`@supabase/supabase-js`)
- Google + Apple sign-in, biometric app-lock (`expo-local-authentication`, `expo-secure-store`)
- Sentry, i18n (`expo-localization`), Jest (`jest-expo`)

## Layout
- `App.tsx` — root
- `screens/` — Home, Budget, Results, Login, Profile
- `components/` — TabBar, Onboarding, ErrorBoundary, `ui/`
- `auth/` — providers, googleConfig
- `session/`, `settings/SettingsContext.tsx`, `i18n/`, `theme.ts`, `types.ts`
- `ios/` — native; `plugins/` — config plugins; `__tests__/`

## Commands
```
npm start            # expo start
npm run ios          # expo run:ios
npm run typecheck    # tsc --noEmit
npm test             # jest
npm run lint         # eslint
```

## Notes
- Native builds: set `SENTRY_DISABLE_AUTO_UPLOAD=true`
- Run typecheck + lint + test before declaring done

# Default Skills (apply automatically — do not wait for me to type them)

Treat these as standing instructions every session. Recognize the trigger yourself and act.

- **`/caveman:caveman` (full)** — caveman mode by default, every response. Drop articles/filler/pleasantries/hedging; keep all technical substance, code, and quoted errors exact. Write code/commits/PRs/security warnings in normal prose.
- **`/godmode:godmode`** — apply godmode skills proactively: codebase-research + pattern-matching before writing code, completion-gate + quality-gate before declaring done, fault-diagnosis before proposing fixes. Pick the fitting godmode skill without being asked.
- **`/comprehension-check`** — after any substantial feature, multi-file change, or architectural change, give a plain-language walkthrough of every alteration.
- **`/code-review`** — review the diff before declaring work done (plus typecheck + lint + test).
- **`/compact`** — built-in CLI command; cannot be self-triggered by Claude. Run it yourself when context grows large.

# Token Budget — automatic routing (no prompt needed)

Goal: minimize tokens this repo burns. Apply these rules by default; recognize the trigger, do not wait for me.

## Output
- Caveman full on every answer (above). Switch to `/caveman:caveman ultra` when answer is a bare list/command/path.
- No re-printing unchanged code. Targeted edits only. No file read-backs after Edit.
- Quote test/error output minimally — relevant lines only, not full logs.

## Delegate to compressed subagents (offload, return ~60% smaller)
- "where is X / what calls Y / map dir" → `cavecrew-investigator` (file:line table, no dumps).
- Bounded 1–2 file edit → `cavecrew-builder`.
- Diff/PR/file review → `cavecrew-reviewer`.
- Broad multi-file search where only conclusion matters → `Explore` agent (reads excerpts, not whole files).

## Reading / search
- `grep`/glob stay localized. No broad queries that dump big output.
- Codebase architecture / "how does X relate" questions → `graphify` query instead of reading many files.
- Web page before ingesting → `claude-obsidian:defuddle` (strip clutter, -40–60%).
- Always quiet flags on runs: `npm test -- --silent`, `tsc --noEmit`, etc.

## Loop prevention (wasted re-work = wasted tokens)
- Diagnose before fixing (`godmode:fault-diagnosis`). No blind-fix cycles.
- Verify before claiming done (`godmode:completion-gate`).
- Stuck after 2 failed attempts → `godmode:error-recovery`, stop guessing.

## Maintenance
- When CLAUDE.md / memory files grow, `/caveman:caveman-compress` them.
- Periodically `/simplify` to drop dead/redundant code → smaller files later.

# Claude Code Constraints & Efficiency Rules

## Response Token Mitigation
- **Style**: Anti-fluff. Answer with raw code, commands, or direct bullet points.
- **Greetings/Preambles**: Absolutely prohibited. Never start with "Sure", "Okay", "Here is", or "Based on your request".
- **Postambles**: Prohibited. Never end with summaries, warnings, or "Let me know if you need anything else".
- **Explanations**: Assume senior engineer level. Do not explain *how* the code works unless explicitly asked with a "?" at the end of your prompt.

## Tool & Input Optimization
- **File Edits**: Use specific `edit_file` tools for targeted block replacements. Do not rewrite or print unaffected parts of a file.
- **Search Restrictions**: Keep `grep` and file searches highly localized. Avoid broad queries that dump huge outputs into the context window.
- **Terminal Commands**: When running tests or builds, always append silent/quiet flags (e.g., `npm test -- --silent`, `pytest -q`) to keep the tool output context minimal.
