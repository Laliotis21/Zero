import { StatusBar } from 'expo-status-bar';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Onboarding, useOnboarding } from './components/Onboarding';
import { TabBar } from './components/TabBar';
import { useT } from './i18n/strings';
import { BudgetScreen } from './screens/BudgetScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AuthProvider, useAuth } from './session/AuthContext';
import { authenticate, isBiometricAvailable } from './session/biometrics';
import { SessionProvider, useSession } from './session/SessionContext';
import { SettingsProvider, useSettings } from './settings/SettingsContext';
import { font, radius, spacing, useResolvedMode, useTheme, weight } from './theme';
import { CalcResult, ScreenKey } from './types';
import { initCrashReporting } from './utils/crash';

/** Keeps a screen mounted (state preserved) while toggling its visibility. */
function Pane({ active, children }: { active: boolean; children: ReactNode }) {
  return <View style={{ flex: 1, display: active ? 'flex' : 'none' }}>{children}</View>;
}

function AppInner() {
  const c = useTheme();
  // Drive the status bar from the resolved scheme (honors forced light/dark),
  // not the OS scheme — otherwise a forced override mismatches the bar.
  const isLight = useResolvedMode() === 'light';
  const { result, setResult } = useSession();
  const [screen, setScreen] = useState<ScreenKey>('home');

  const handleCalculate = useCallback(
    (r: CalcResult) => {
      setResult(r);
      setScreen('results');
    },
    [setResult],
  );
  const net = result?.net ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <View style={{ flex: 1 }}>
        {/* All screens stay mounted so form inputs / scroll persist across tabs. */}
        <Pane active={screen === 'home'}>
          <HomeScreen onCalculate={handleCalculate} />
        </Pane>
        <Pane active={screen === 'results'}>
          <ResultsScreen result={result} />
        </Pane>
        <Pane active={screen === 'budget'}>
          <BudgetScreen net={net} />
        </Pane>
        <Pane active={screen === 'profile'}>
          <ProfileScreen net={net} />
        </Pane>
      </View>
      <TabBar active={screen} onChange={setScreen} />
    </SafeAreaView>
  );
}

/** Full-screen lock shown until biometric/passcode unlock succeeds. */
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const c = useTheme();
  const tr = useT();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
      <Text style={{ color: c.text, fontSize: font.title, fontWeight: weight.bold, marginBottom: spacing.sm }}>
        {tr('biometric.title')}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: font.body, textAlign: 'center', marginBottom: spacing.lg }}>
        {tr('biometric.body')}
      </Text>
      <Pressable
        onPress={onUnlock}
        accessibilityRole="button"
        accessibilityLabel={tr('biometric.unlock')}
        style={{ backgroundColor: c.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md }}
      >
        <Text style={{ color: c.onAccent, fontSize: font.body, fontWeight: weight.semibold }}>
          {tr('biometric.unlock')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

/**
 * App-lock layer. When `biometricLock` is on, holds the app behind a biometric
 * prompt on cold start and re-locks whenever the app returns from background —
 * a second factor over the already-persisted session, common in finance apps.
 */
function BiometricGate({ children }: { children: ReactNode }) {
  const tr = useT();
  const { settings } = useSettings();
  const lock = settings.biometricLock;
  const [unlocked, setUnlocked] = useState(!lock);
  // Avoid stacking prompts if AppState fires while one is already open.
  const prompting = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (prompting.current) return;
    if (!lock) {
      setUnlocked(true);
      return;
    }
    prompting.current = true;
    try {
      // No enrolled biometrics → don't trap the user out; fail open.
      const available = await isBiometricAvailable();
      if (!available) {
        setUnlocked(true);
        return;
      }
      setUnlocked(await authenticate(tr('biometric.prompt')));
    } finally {
      prompting.current = false;
    }
  }, [lock, tr]);

  // Prompt on mount and whenever the lock setting flips on.
  useEffect(() => {
    if (lock) {
      setUnlocked(false);
      tryUnlock();
    } else {
      setUnlocked(true);
    }
  }, [lock, tryUnlock]);

  // Re-lock on background; re-prompt on foreground.
  useEffect(() => {
    if (!lock) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tryUnlock();
      else setUnlocked(false);
    });
    return () => sub.remove();
  }, [lock, tryUnlock]);

  if (!unlocked) return <LockScreen onUnlock={tryUnlock} />;
  return <>{children}</>;
}

/** Hold first paint until persisted state loads; then onboard first-run users. */
function Gate() {
  const c = useTheme();
  const { hydrating } = useSettings();
  const { hydrating: sessionHydrating } = useSession();
  const { hydrating: authHydrating, user } = useAuth();
  const { onboarded, complete } = useOnboarding();

  if (hydrating || sessionHydrating || authHydrating || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }
  if (!onboarded) return <Onboarding onDone={complete} />;
  // Mandatory login gate: no guest path. Shown until the user signs in; on
  // sign-in `user` flips truthy (via the Supabase session listener) and this
  // falls through to the biometric gate + app.
  if (!user) return <LoginScreen gate onDone={() => undefined} />;
  return (
    <BiometricGate>
      <AppInner />
    </BiometricGate>
  );
}

export default function App() {
  // Initialise crash reporting once (no-op without a DSN).
  useEffect(() => {
    initCrashReporting();
  }, []);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <SessionProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Gate />
            </ErrorBoundary>
          </AuthProvider>
        </SessionProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
