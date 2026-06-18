import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Thin wrapper over expo-local-authentication for the app-lock feature.
 * Lazy-tolerant: every call resolves to a boolean and never throws, so callers
 * can treat "unavailable" and "failed" uniformly (fail open is decided upstream).
 */

/** Device has biometric hardware AND the user has enrolled a face/fingerprint. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/**
 * Device has SOME unlock secret set (enrolled biometric OR a device passcode).
 * Used by the app-lock gate: when true we can challenge via authenticate()
 * (which falls back to the passcode), so we never fail open on a secured device
 * just because biometrics were later unenrolled.
 */
export async function hasDeviceSecurity(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Prompt for biometric (with device-passcode fallback). Returns success. */
export async function authenticate(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      // Allow the device passcode as a fallback so a transient biometric failure
      // doesn't permanently lock the user out of their own app.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
