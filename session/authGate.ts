import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'zero.authGateSkipped.v1';

/**
 * Launch-gate dismissal flag. Once the user skips the login gate (continues as
 * guest), we don't prompt again on later launches. `skipped` is null until the
 * flag is read from disk (so the gate can hold first paint without flicker).
 */
export function useAuthGate() {
  const [skipped, setSkipped] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => alive && setSkipped(v === '1'))
      .catch(() => alive && setSkipped(false));
    return () => {
      alive = false;
    };
  }, []);

  const skip = useCallback(() => {
    setSkipped(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => undefined);
  }, []);

  return { skipped, skip };
}
