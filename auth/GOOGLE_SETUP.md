# Google Sign-In setup

The code is wired (`@react-native-google-signin/google-signin`); it needs your
OAuth client IDs and a native rebuild to go live. Until then `signInWithGoogle`
throws a clear error and the login screen shows a graceful failure.

## 1. Google Cloud Console → OAuth client IDs

[console.cloud.google.com](https://console.cloud.google.com) → pick/create a
project → **APIs & Services → Credentials → Create credentials → OAuth client ID**.

Create **two** clients:

| Type | Field | Value |
|------|-------|-------|
| **Web application** | — | gives **Web client ID** |
| **iOS** | Bundle ID | `app.zerofinance.mobile` → gives **iOS client ID** |

(Android later: needs the SHA-1 of your EAS signing key — `eas credentials`.)

You may also need to configure the **OAuth consent screen** once (app name,
support email, scopes: `email`, `profile`).

## 2. Paste the IDs

**`auth/googleConfig.ts`**
```ts
export const GOOGLE_WEB_CLIENT_ID = '<WEB_CLIENT_ID>.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '<IOS_CLIENT_ID>.apps.googleusercontent.com';
```

**`app.json`** → plugin `iosUrlScheme` = the iOS client ID **reversed**
(Console shows it as the "iOS URL scheme", e.g.
`com.googleusercontent.apps.<IOS_CLIENT_ID>`):
```json
[
  "@react-native-google-signin/google-signin",
  { "iosUrlScheme": "com.googleusercontent.apps.<IOS_CLIENT_ID>" }
]
```

## 3. Native rebuild (required — JS-only reload won't link the module)

```bash
npx expo prebuild --clean      # regenerate ios/android with the new plugin
npx expo run:ios               # or: eas build --profile development
```

## 4. Verify

Open app → launch login gate → **Συνέχισε με Google** → native Google sheet →
returns to Home signed in. `Profile` shows the Google name + email.

## Notes
- **Client-only** today: the Google profile populates `AuthUser` directly; the
  `idToken` is not verified server-side (no backend yet). Add backend
  verification before trusting identity for anything sensitive.
- Apple + email are still mock (`auth/providers.ts`).
