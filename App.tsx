import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './components/TabBar';
import { BudgetScreen } from './screens/BudgetScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsProvider, useSettings } from './settings/SettingsContext';
import { useResolvedMode, useTheme } from './theme';
import { CalcResult, ScreenKey } from './types';

function AppInner() {
  const c = useTheme();
  // Drive the status bar from the resolved scheme (honors forced light/dark),
  // not the OS scheme — otherwise a forced override mismatches the bar.
  const isLight = useResolvedMode() === 'light';
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [result, setResult] = useState<CalcResult | null>(null);

  const handleCalculate = useCallback((r: CalcResult) => {
    setResult(r);
    setScreen('results');
  }, []);
  const goBudget = useCallback(() => setScreen('budget'), []);

  const current = useMemo(() => {
    switch (screen) {
      case 'home':
        return <HomeScreen onCalculate={handleCalculate} />;
      case 'results':
        return <ResultsScreen result={result} onUpgrade={goBudget} />;
      case 'budget':
        return <BudgetScreen net={result?.net ?? 0} />;
      case 'profile':
        return <ProfileScreen net={result?.net ?? 0} onUpgrade={goBudget} />;
      default:
        return null;
    }
  }, [screen, result, handleCalculate, goBudget]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <View style={{ flex: 1 }}>{current}</View>
      <TabBar active={screen} onChange={setScreen} />
    </SafeAreaView>
  );
}

/** Hold first paint until persisted settings load — avoids a theme/lang flash. */
function Gate() {
  const c = useTheme();
  const { hydrating } = useSettings();
  if (hydrating) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return <AppInner />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Gate />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
