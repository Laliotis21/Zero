# RevenueCat / Pro In-App Purchase Setup

The app ships with the Pro paywall fully wired to RevenueCat, but **dormant**:
with no API key set it stays a no-op (`isPro` is always false, tapping "Get Pro"
shows a friendly "not available" message). The free experience works unchanged.

Follow these steps **in order** to start charging real money for Pro (€2.99/mo).
Nothing here requires touching the code — only dashboards and one env var.

---

## 1. Create a RevenueCat account (free)

1. Go to https://www.revenuecat.com and sign up (free tier is fine to start).
2. Create a **Project** (e.g. "ZERØ").
3. Inside the project, add an **App** for the **Apple App Store** platform.
   - Bundle ID: `app.zerofinance.mobile` (matches `app.json`).
   - You'll be asked for an **App Store Connect API key / shared secret** later
     for server-side receipt validation — you can paste it after step 2.

## 2. Create the IAP product in App Store Connect

1. Sign in to https://appstoreconnect.apple.com → **My Apps** → your app →
   **Subscriptions** (or **In-App Purchases**).
2. Create the product for Pro. Two valid choices:
   - **Auto-renewing subscription** (recommended for a monthly Pro): create a
     Subscription Group, then a subscription priced at **€2.99 / month**.
   - **Non-consumable** (one-time unlock) if you prefer a single payment of
     **€2.99** — then ignore the "monthly" wording below.
3. Set the **Product ID**. The code's placeholder is `zero_pro_monthly`
   (see `purchases/Purchases.ts` → `MONTHLY_PRODUCT_ID`). Use that exact id, or
   change the constant to whatever you create.
4. Fill in the localized display name, description, and price tier (€2.99).
5. Submit the product (it can stay "Ready to Submit" / "Waiting for Review"
   while you test in sandbox).

## 3. Wire the product into RevenueCat

1. RevenueCat dashboard → **Products** → **+ New** → import/enter the App Store
   product id from step 2.3.
2. **Entitlements** → create an entitlement with identifier **`pro`**
   (must match `ENTITLEMENT_ID` in `purchases/Purchases.ts`). Attach the product.
3. **Offerings** → use the default **current** offering (or create one). Add the
   product as a **package** — put the subscription in the **Monthly** slot so the
   app's `findMonthlyPackage()` picks it up automatically. If you use a custom
   offering id, set `OFFERING_ID` in `purchases/Purchases.ts`.

## 4. Copy the iOS public API key into the app

1. RevenueCat dashboard → **Project settings → API keys**.
2. Copy the **Apple App Store** *public* key (starts with `appl_`).
3. Create a `.env` file at the repo root (it's gitignored) if you don't have one,
   and add:

   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxx
   ```

   (See `.env.example` for the documented placeholder.)

## 5. Build natively + test with a sandbox tester

In-app purchases **do not work in Expo Go** — they need the native module, which
means a dev/prebuild build:

1. Create a **Sandbox tester** account: App Store Connect → **Users and Access →
   Sandbox → Testers**.
2. On the test device, sign out of the real App Store account (Settings → App
   Store, or you'll be prompted to use the sandbox account at purchase time).
3. Build a native binary:
   - Local: `SENTRY_DISABLE_AUTO_UPLOAD=true npx expo run:ios`
   - or EAS: `eas build --profile development --platform ios`
   (A plain `npx expo prebuild` followed by an Xcode build also works.)
4. Launch the app, open **Profile → Get Pro** (or the **Results** paywall), and
   complete a purchase with the sandbox tester. After success, `isPro` flips true
   and the paywall is replaced with the "Pro unlocked" state. Use **Restore
   purchases** on Profile to verify restore works (required by App Review).

## Notes

- The entitlement id (`pro`), offering, and product id placeholders all live in
  `purchases/Purchases.ts` — keep them in sync with the dashboard.
- No config plugin is required: `react-native-purchases` autolinks on prebuild.
- Before submitting to the App Store, make sure the IAP product is attached to
  the app version under review, and that a **Restore Purchases** action is
  visible (it is, on the Profile Pro card).
