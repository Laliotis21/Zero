import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { captureException } from '../utils/crash';

/**
 * RevenueCat in-app-purchase wrapper.
 *
 * Mirrors the env-guard pattern in `utils/crash.ts`: RevenueCat is configured
 * only when an iOS public API key is provided via `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
 * Without it, every function here is a safe no-op and `isPro` resolves to false —
 * so local/dev runs (and any build before the owner pastes their key) keep the
 * free experience working instead of crashing on an unconfigured SDK.
 *
 * IAP also requires a native build (`expo run:ios` / EAS) and a sandbox tester;
 * it does NOT work in Expo Go. See REVENUECAT_SETUP.md.
 */

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

/**
 * TODO(owner): keep these in sync with what you configure in the RevenueCat
 * dashboard (see REVENUECAT_SETUP.md).
 *
 * - ENTITLEMENT_ID: the entitlement identifier that unlocks Pro. The app checks
 *   `customerInfo.entitlements.active[ENTITLEMENT_ID]` to decide `isPro`.
 * - OFFERING_ID: leave undefined to use RevenueCat's "current" (default)
 *   offering, or set it to a specific offering identifier.
 * - MONTHLY_PRODUCT_ID: the App Store Connect product id for the €2.99 Pro
 *   subscription. Only used as a fallback to locate the package inside the
 *   offering when the standard monthly slot isn't populated.
 */
export const ENTITLEMENT_ID = 'pro';
export const OFFERING_ID: string | undefined = undefined; // TODO(owner): set if not using the current offering
export const MONTHLY_PRODUCT_ID = 'zero_pro_monthly'; // TODO(owner): match your App Store Connect product id

/** True only when an API key is present; gates every SDK call below. */
export const purchasesEnabled = Boolean(IOS_API_KEY);

let configured = false;

/** Configure the RevenueCat SDK once. No-op when no API key is set. */
export function initPurchases(): void {
  if (configured || !IOS_API_KEY) return;
  try {
    Purchases.configure({ apiKey: IOS_API_KEY });
    configured = true;
  } catch (e) {
    captureException(e, { where: 'initPurchases' });
  }
}

/** Whether the given customer info grants the Pro entitlement. */
export function hasProEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

/** Current customer info, or null when purchases are unavailable. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesEnabled) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    captureException(e, { where: 'getCustomerInfo' });
    return null;
  }
}

/** The offering to present, or null when unavailable / not configured. */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!purchasesEnabled) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const specific = OFFERING_ID ? offerings.all[OFFERING_ID] : undefined;
    return specific ?? offerings.current ?? null;
  } catch (e) {
    captureException(e, { where: 'getOfferings' });
    return null;
  }
}

/** Pick the monthly Pro package from an offering. */
export function findMonthlyPackage(
  offering: PurchasesOffering | null,
): PurchasesPackage | null {
  if (!offering) return null;
  if (offering.monthly) return offering.monthly;
  return (
    offering.availablePackages.find(
      (p) => p.product.identifier === MONTHLY_PRODUCT_ID,
    ) ??
    offering.availablePackages[0] ??
    null
  );
}

export type PurchaseOutcome =
  | { status: 'success'; info: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; error: unknown };

/** Purchase a specific package. */
export async function purchaseProPackage(
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> {
  if (!purchasesEnabled) return { status: 'unavailable' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: 'success', info: customerInfo };
  } catch (e) {
    // RevenueCat sets `userCancelled` on the error for a user-aborted flow.
    if (e && typeof e === 'object' && (e as { userCancelled?: boolean }).userCancelled) {
      return { status: 'cancelled' };
    }
    captureException(e, { where: 'purchaseProPackage' });
    return { status: 'error', error: e };
  }
}

/** Fetch the current offering, find the monthly package, and purchase it. */
export async function purchaseProMonthly(): Promise<PurchaseOutcome> {
  if (!purchasesEnabled) return { status: 'unavailable' };
  const pkg = findMonthlyPackage(await getOfferings());
  if (!pkg) return { status: 'unavailable' };
  return purchaseProPackage(pkg);
}

/** Restore prior purchases (App Store "Restore Purchases" requirement). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!purchasesEnabled) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    captureException(e, { where: 'restorePurchases' });
    return null;
  }
}
