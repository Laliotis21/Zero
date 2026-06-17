import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowButton } from '../components/ui/GlowButton';
import { SocialButton } from '../components/ui/SocialButton';
import { useT } from '../i18n/strings';
import { useAuth } from '../session/AuthContext';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';

/** Which sign-in is in flight (drives spinners + cross-disable). */
type Pending = 'google' | 'apple' | 'email' | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginScreenProps {
  /** Called after a successful sign-in, or when the user dismisses (modal mode). */
  onDone: () => void;
  /**
   * When provided, the screen acts as a launch gate: shows a "skip" affordance
   * (continue as guest) instead of a close button. Omit for modal/back mode.
   */
  onSkip?: () => void;
}

/** Full-screen sign-in / sign-up — launch gate (with onSkip) or Profile modal. */
export function LoginScreen({ onDone, onSkip }: LoginScreenProps) {
  const c = useTheme();
  const tr = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { signInGoogle, signInApple, signInEmail } = useAuth();

  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = pending !== null;

  /** Run a provider sign-in; close on success, surface a message on failure. */
  const run = useCallback(
    async (kind: Exclude<Pending, null>, fn: () => Promise<void>) => {
      if (busy) return;
      setError(null);
      setPending(kind);
      try {
        await fn();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        onDone();
      } catch (err) {
        // User dismissed the provider sheet — not an error, just reset.
        const cancelled = err instanceof Error && err.message === 'cancelled';
        if (!cancelled) setError(tr('login.error.failed'));
        setPending(null);
      }
    },
    [busy, onDone, tr],
  );

  const submitEmail = useCallback(() => {
    if (!EMAIL_RE.test(email.trim())) {
      setError(tr('login.error.email'));
      return;
    }
    if (password.length < 6) {
      setError(tr('login.error.password'));
      return;
    }
    run('email', () => signInEmail(email.trim(), password, register));
  }, [email, password, register, run, signInEmail, tr]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.topBar}>
        {/* Modal mode: X (back). Gate mode: no left control. */}
        {onSkip ? (
          <View style={{ width: 26 }} />
        ) : (
          <Pressable
            onPress={onDone}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={tr('login.close')}
          >
            <Ionicons name="close" size={26} color={c.textMuted} />
          </Pressable>
        )}
        <Text style={styles.logo}>ZERØ</Text>
        {/* Gate mode: skip → continue as guest. */}
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={tr('login.skip')}
          >
            <Text style={styles.skip}>{tr('login.skip')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{tr('login.title')}</Text>
          <Text style={styles.subtitle}>{tr('login.subtitle')}</Text>

          {/* Σύνδεση / Εγγραφή toggle */}
          <View style={styles.toggle}>
            {([false, true] as const).map((isReg) => {
              const active = register === isReg;
              return (
                <Pressable
                  key={String(isReg)}
                  onPress={() => {
                    setRegister(isReg);
                    setError(null);
                  }}
                  style={[styles.togglePill, active && styles.togglePillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                    {tr(isReg ? 'login.tab.signUp' : 'login.tab.signIn')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Email + password */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{tr('login.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={tr('login.emailPlaceholder')}
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!busy}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{tr('login.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={tr('login.passwordPlaceholder')}
              placeholderTextColor={c.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={register ? 'new-password' : 'current-password'}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={submitEmail}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GlowButton
            label={tr(register ? 'login.submit.signUp' : 'login.submit.signIn')}
            onPress={submitEmail}
            disabled={busy}
            style={styles.submit}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>{tr('login.or')}</Text>
            <View style={styles.line} />
          </View>

          {/* Social */}
          <View style={styles.social}>
            <SocialButton
              brand="google"
              label={tr('login.google')}
              onPress={() => run('google', signInGoogle)}
              loading={pending === 'google'}
              disabled={busy && pending !== 'google'}
            />
            {/* Apple sign-in is only offered on Apple platforms (HIG). */}
            {Platform.OS === 'ios' ? (
              <SocialButton
                brand="apple"
                label={tr('login.apple')}
                onPress={() => run('apple', signInApple)}
                loading={pending === 'apple'}
                disabled={busy && pending !== 'apple'}
              />
            ) : null}
          </View>

          <Text style={styles.legal}>{tr('login.legal')}</Text>

          {/* Gate mode: explicit guest escape hatch under the fold. */}
          {onSkip ? (
            <Pressable
              onPress={onSkip}
              hitSlop={8}
              style={styles.guest}
              accessibilityRole="button"
              accessibilityLabel={tr('login.guest')}
            >
              <Text style={styles.guestText}>{tr('login.guest')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      minHeight: 44,
    },
    logo: { color: c.text, fontSize: font.title, fontWeight: weight.black, letterSpacing: 1 },
    skip: { color: c.textMuted, fontSize: font.body, fontWeight: weight.semibold },
    guest: { alignSelf: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
    guestText: { color: c.primary, fontSize: font.body, fontWeight: weight.semibold },
    content: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.md,
    },
    title: { color: c.text, fontSize: font.big, fontWeight: weight.black },
    subtitle: { color: c.textMuted, fontSize: font.subtitle, lineHeight: 24, marginBottom: spacing.sm },

    toggle: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.full,
      padding: spacing.xs,
      marginBottom: spacing.sm,
    },
    togglePill: {
      flex: 1,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    togglePillActive: { backgroundColor: c.primary },
    toggleLabel: { color: c.textMuted, fontSize: font.body, fontWeight: weight.semibold },
    toggleLabelActive: { color: c.onAccent, fontWeight: weight.bold },

    field: { gap: spacing.xs },
    fieldLabel: {
      color: c.textMuted,
      fontSize: font.micro,
      fontWeight: weight.bold,
      letterSpacing: 1,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
    },
    input: {
      height: 56,
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      color: c.text,
      fontSize: font.subtitle,
    },
    error: { color: c.negative, fontSize: font.small, marginLeft: spacing.xs },
    submit: { alignSelf: 'stretch', marginTop: spacing.xs },

    divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
    line: { flex: 1, height: 1, backgroundColor: c.border },
    or: { color: c.textMuted, fontSize: font.small, fontWeight: weight.semibold },

    social: { gap: spacing.md },
    legal: {
      color: c.textMuted,
      fontSize: font.small,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
  });
