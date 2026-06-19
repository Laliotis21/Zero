# Zero — App Store Connect "App Privacy" Disclosure

Fill-in-ready answer sheet for the App Store Connect **App Privacy** questionnaire
(the "privacy nutrition label"). Every answer below is grounded in the actual code,
not assumptions. Citations point at the file/line that proves the claim.

> **Bottom line up front:** The user's salary / income / tax-calculation figures
> **never leave the device.** They are computed locally and persisted only to
> on-device storage. The only data that leaves the device is (1) sign-in identity
> (email, name, user id) sent to Supabase auth, and (2) crash/diagnostic data sent
> to Sentry — and only when a Sentry DSN is configured in the production build.
> There are **no analytics or advertising/tracking SDKs** in the app.

---

## 1. Evidence base (what the code actually does)

| Question | Finding | Source |
|---|---|---|
| Identity data obtained at sign-in | `id` (Supabase user id), `name`, `email`, `provider` | `auth/providers.ts:22-28`, `session/AuthContext.tsx:23-37` |
| Apple sign-in scopes requested | `FULL_NAME`, `EMAIL` | `auth/providers.ts:95-99` |
| Email/password auth | Supabase `signUp` / `signInWithPassword` | `auth/providers.ts:120-134` |
| Google auth | Supabase OAuth (PKCE) | `auth/providers.ts:50-77` |
| Where the session/tokens are stored | Encrypted iOS Keychain via `expo-secure-store` (chunked) | `session/supabase.ts:77-136` |
| Any write of user data to a server? | **None.** No `.from()/.insert()/.upsert()/.update()/.rpc()/.storage` calls exist anywhere | grep of `screens/ session/ settings/ utils/ auth/ components/` — zero hits |
| Any raw network calls (fetch/axios)? | **None** outside the Supabase SDK client | grep — only string constants in `utils/links.ts` |
| Where salary / results are stored | Local device only, `AsyncStorage` (unencrypted, on-device) | `session/SessionContext.tsx:36,127`; `screens/BudgetScreen.tsx:76-79` |
| What is in that local blob | `gross` (salary input), computed `net`, `tax`, `efka`, budget buckets | `session/SessionContext.tsx:16-41`; `screens/BudgetScreen.tsx:78` |
| Crash reporting | Sentry, **only** if `EXPO_PUBLIC_SENTRY_DSN` set; `sendDefaultPii: false`; `tracesSampleRate: 0.2` | `utils/crash.ts:12-26` |
| Analytics / ad / tracking SDKs | **None.** No Firebase Analytics, Amplitude, Segment, AppsFlyer, Branch, Facebook SDK, AdMob, IDFA usage | `package.json` dependencies (see below) |

**`package.json` runtime deps (full list, no tracking SDK present):**
`@expo/vector-icons`, `@react-native-async-storage/async-storage`,
`@react-native-google-signin/google-signin`, `@sentry/react-native`,
`@supabase/supabase-js`, `expo` + first-party expo modules
(`apple-authentication`, `local-authentication`, `localization`, `print`,
`secure-store`, `sharing`, `store-review`, `updates`, `web-browser`, etc.),
`react`, `react-native`, `react-native-safe-area-context`,
`react-native-url-polyfill`.

---

## 2. Per-category disclosure (mirror of the App Store Connect questionnaire)

For each category Apple asks: **Do you collect this?** If yes →
**Is it linked to the user's identity?**, **Is it used for tracking?**, and
**What is the purpose?**

> Apple's definition reminders:
> - **"Collect"** = the data is transmitted off the device and/or accessed by you
>   or a third-party SDK in a way that leaves the device. Data that stays purely
>   on-device is **not** "collected."
> - **"Linked to identity"** = associated with a user account / identity.
> - **"Tracking"** = linking with third-party data for ads, or sharing with a
>   data broker. (We do **none** of this.)

### Contact Info → Email Address
| Field | Answer |
|---|---|
| Collected? | **Yes** |
| Linked to identity? | **Yes** — it *is* the account identifier; sent to Supabase auth |
| Used for tracking? | **No** — no ad/tracking SDK; not shared with third parties or brokers |
| Purpose | **App Functionality** (authentication / account login) |
| Evidence | `auth/providers.ts:96-99,120-134`; `AuthContext.tsx:33` |

### Contact Info → Name
| Field | Answer |
|---|---|
| Collected? | **Yes** (when the provider returns it — Apple `FULL_NAME` scope, Google profile, or Supabase `user_metadata.full_name`) |
| Linked to identity? | **Yes** — stored against the Supabase user record |
| Used for tracking? | **No** |
| Purpose | **App Functionality** (display the signed-in user) |
| Evidence | `auth/providers.ts:95-99`; `AuthContext.tsx:31-36` |

### Identifiers → User ID
| Field | Answer |
|---|---|
| Collected? | **Yes** — Supabase user id |
| Linked to identity? | **Yes** — it is the identity |
| Used for tracking? | **No** |
| Purpose | **App Functionality** (account / session) |
| Evidence | `auth/providers.ts:24`; `AuthContext.tsx:36` |
| Note | **No advertising identifier (IDFA)** is collected or used. No `Device ID` collection. |

### Financial Info → Salary / Income / other financial info
| Field | Answer |
|---|---|
| Collected? | **No** (see on-device note in §4) |
| Linked to identity? | N/A — not collected |
| Used for tracking? | N/A |
| Purpose | N/A |
| Evidence | Salary input (`gross`) and computed `net/tax/efka` persist **only** to local `AsyncStorage`; no server write exists. `SessionContext.tsx:16-41,127`; `BudgetScreen.tsx:76-79`; no `.insert/.upsert/.from` anywhere |

> This is the key privacy answer. Because the figures stay on-device and are never
> transmitted, they are **not "collected"** under Apple's definition, so Financial
> Info → "No, we do not collect data from this app" for this category. See §4 for
> the conditional that would change this.

### Diagnostics → Crash Data
| Field | Answer |
|---|---|
| Collected? | **Yes** (in production builds where the Sentry DSN is set; off in dev) |
| Linked to identity? | **No** — `sendDefaultPii: false`, so Sentry does not attach user email/IP/etc. |
| Used for tracking? | **No** |
| Purpose | **App Functionality** (or **Analytics** — Apple allows either for crash data; "App Functionality" is the closest fit since it's used to fix crashes) |
| Evidence | `utils/crash.ts:12-26` |

### Diagnostics → Performance Data
| Field | Answer |
|---|---|
| Collected? | **Yes** — Sentry performance traces at `tracesSampleRate: 0.2` (20%), production only |
| Linked to identity? | **No** — `sendDefaultPii: false` |
| Used for tracking? | **No** |
| Purpose | **App Functionality** (performance monitoring) |
| Evidence | `utils/crash.ts:23` |

### Diagnostics → Other Diagnostic Data
| Field | Answer |
|---|---|
| Collected? | **Optional** — only if you manually pass `extra` context to `captureException`; review call sites before claiming "No." Default config collects standard Sentry error payloads only. |
| Linked to identity? | **No** (`sendDefaultPii: false`) |
| Used for tracking? | **No** |
| Purpose | **App Functionality** |
| Evidence | `utils/crash.ts:29-32` |

### All other Apple categories → **Not collected**
The following are **not** collected (no code path touches them):
Health & Fitness, Location (precise or coarse), Sensitive Info, Contacts (address
book), User Content (photos, messages, audio — note the PDF export goes only to the
**native share sheet** at the user's action and is not uploaded), Browsing History,
Search History, Purchases, Payment Info (no in-app purchases / payment SDK),
Physical Address, Phone Number, Other Contact Info, Coarse/Fine Location,
Advertising Data, Product Interaction analytics, and any Tracking.

---

## 3. Tracking declaration (App Tracking Transparency)

- **Used for tracking? → NO**, for every category.
- There are **no advertising, attribution, or analytics SDKs** (no AdMob,
  Facebook SDK, AppsFlyer, Branch, Segment, Amplitude, Firebase Analytics, etc.).
- No IDFA access → **no `NSUserTrackingUsageDescription` / ATT prompt required**.
- In App Store Connect, on the "Tracking" step answer **No**.

---

## 4. Financial Info — on-device vs uploaded (conditional)

This determines the Financial Info disclosure, so state it precisely.

- **As the code stands today (on-device only):** salary (`gross`), the computed
  `net` / `tax` / `efka`, and the saved budget buckets are written **only** to
  local `AsyncStorage` on the device (`zero.session.v1`, `zero.budget.v1`). There
  is **no** Supabase table write, no `fetch`, no upload of any kind. PDF export
  hands a locally-generated document to the iOS share sheet at the user's explicit
  action — the app does not transmit it. Therefore **Financial Info is NOT
  collected** and should be declared **"No"** in App Store Connect.

- **If you later add server sync** (e.g. a Supabase `insert`/`upsert` of salary or
  results, a backend endpoint, or any analytics event that includes a financial
  figure), this flips: you must then declare **Financial Info → Salary** as
  **Collected = Yes**, **Linked to identity = Yes** (it would be tied to the
  Supabase user id), **Tracking = No**, **Purpose = App Functionality**. Update
  this sheet and the label the moment such a code path is introduced.

---

## 5. Privacy Policy URL (required field)

App Store Connect **requires** a Privacy Policy URL for every app
(App Information → "Privacy Policy URL"). It must be a publicly reachable page.

- **URL to enter:** `https://laliotis21.github.io/Zero/privacy.html`
  (free GitHub Pages page, being set up separately).
- Paste it into the **App Store Connect → App Information → Privacy Policy URL**
  field. The same URL should also back the in-app `PRIVACY_URL`
  (currently `https://zerofinance.app/privacy` in `utils/links.ts:7`) — align
  these so the in-app link and the store listing point to the same live page.

---

## 6. One-paragraph summary to transcribe

> Zero collects **Email**, **Name**, and a **User ID** for sign-in
> (Contact Info + Identifiers, linked to identity, App Functionality, not used for
> tracking) via Supabase auth. It collects **Crash Data** and **Performance Data**
> via Sentry in production (Diagnostics, **not** linked to identity because
> `sendDefaultPii: false`, App Functionality, not tracking). It does **not** use
> any tracking or advertising technology and accesses no IDFA. The user's salary
> and tax-calculation figures are stored **only on the device** and are never
> transmitted, so **Financial Info is not collected.**
