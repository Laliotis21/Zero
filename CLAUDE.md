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
