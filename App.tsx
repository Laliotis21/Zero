import { StatusBar } from 'expo-status-bar';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Onboarding, useOnboarding } from './components/Onboarding';
import { TabBar } from './components/TabBar';
import { BudgetScreen } from './screens/BudgetScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SessionProvider, useSession } from './session/SessionContext';
import { SettingsProvider, useSettings } from './settings/SettingsContext';
import { useResolvedMode, useTheme } from './theme';
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

/** Hold first paint until persisted state loads; then onboard first-run users. */
function Gate() {
  const c = useTheme();
  const { hydrating } = useSettings();
  const { hydrating: sessionHydrating } = useSession();
  const { onboarded, complete } = useOnboarding();

  if (hydrating || sessionHydrating || onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  }
  if (!onboarded) return <Onboarding onDone={complete} />;
  return <AppInner />;
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
          <ErrorBoundary>
            <Gate />
          </ErrorBoundary>
        </SessionProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
