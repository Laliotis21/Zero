import { Ionicons } from '@expo/vector-icons';
import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useT } from '../i18n/strings';
import { font, radius, spacing, useTheme, weight } from '../theme';
import { captureException } from '../utils/crash';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors in the subtree so a single screen crash shows
 * a recoverable fallback instead of an unrecoverable white screen. Reports the
 * error to crash reporting (no-op without a DSN).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    captureException(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return <Fallback onRetry={this.reset} />;
    return this.props.children;
  }
}

/** Themed fallback — a function child so it can use hooks (sits under providers). */
function Fallback({ onRetry }: { onRetry: () => void }) {
  const c = useTheme();
  const tr = useT();
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Ionicons name="warning-outline" size={48} color={c.warning} />
      <Text style={[styles.title, { color: c.text }]}>{tr('error.title')}</Text>
      <Text style={[styles.body, { color: c.textMuted }]}>{tr('error.body')}</Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        style={[styles.btn, { backgroundColor: c.primary }]}
        accessibilityRole="button"
        accessibilityLabel={tr('error.retry')}
      >
        <Text style={[styles.btnText, { color: c.onAccent }]}>{tr('error.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: weight.bold, marginTop: spacing.sm },
  body: { fontSize: font.body, textAlign: 'center', lineHeight: 21 },
  btn: {
    marginTop: spacing.md,
    height: 52,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: font.subtitle, fontWeight: weight.bold },
});
