import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './components/TabBar';
import { BudgetScreen } from './screens/BudgetScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsProvider } from './settings/SettingsContext';
import { palettes, useTheme } from './theme';
import { CalcResult, ScreenKey } from './types';

function AppInner() {
  const c = useTheme();
  // Drive the status bar from the resolved palette (honors forced light/dark),
  // not the OS scheme — otherwise a forced override mismatches the bar.
  const isLight = c.bg === palettes.light.bg;
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

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppInner />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
