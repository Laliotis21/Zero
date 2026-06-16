import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './components/TabBar';
import { BudgetScreen } from './screens/BudgetScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { colors } from './theme';
import { CalcResult, ScreenKey } from './types';

export default function App() {
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
      default:
        return null;
    }
  }, [screen, result, handleCalculate, goBudget]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.body}>{current}</View>
        <TabBar active={screen} onChange={setScreen} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
