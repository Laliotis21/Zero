import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
   * Gate mode: the mandatory launch gate. Hides the close control (no way to
   * dismiss without authenticating; no guest path). Omit for the Profile modal.
   */
  gate?: boolean;
}

/** Full-screen sign-in / sign-up — mandatory launch gate or Profile modal. */
export function LoginScreen({ onDone, gate }: LoginScreenProps) {
  const c = useTheme();
  const tr = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { signInGoogle, signInApple, signInEmail } = useAuth();

  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  // Non-error info (e.g. "check your inbox" after a sign-up needing confirmation).
  const [notice, setNotice] = useState<string | null>(null);

  const busy = pending !== null;
  // Lets the email field's "next" key jump straight to the password field.
  const passwordRef = useRef<TextInput>(null);

  /** Run a provider sign-in; close on success, surface a message on failure. */
  const run = useCallback(
    async (kind: Exclude<Pending, null>, fn: () => Promise<void>) => {
      if (busy) return;
      setError(null);
      setNotice(null);
      setPending(kind);
      try {
        await fn();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        // Clear the spinner before handing off — don't rely on the parent
        // unmounting us (a non-unmounting onDone would leave it stuck).
        setPending(null);
        onDone();
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        // Sign-up succeeded but needs email confirmation — surface as info, not
        // an error, and don't navigate away.
        if (message === 'confirm-email') setNotice(tr('login.confirmEmail'));
        // User dismissed the provider sheet — not an error, just reset.
        else if (message !== 'cancelled') setError(tr('login.error.failed'));
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
        {/* Modal mode: X (back). Gate mode: no dismiss control (login required). */}
        {gate ? (
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
        <View style={{ width: 26 }} />
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

          {/* Social — primary path: one tap, auto-registers on first use. */}
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

          {error ? (
            <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}

          {notice ? (
            <Text style={styles.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {notice}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>{tr('login.or')}</Text>
            <View style={styles.line} />
          </View>

          {/* Email fallback. Σύνδεση / Εγγραφή toggle scopes only this block. */}
          <View style={styles.toggle}>
            {([false, true] as const).map((isReg) => {
              const active = register === isReg;
              return (
                <Pressable
                  key={String(isReg)}
                  onPress={() => {
                    setRegister(isReg);
                    setError(null);
                    setNotice(null);
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
              accessibilityLabel={tr('login.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!busy}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{tr('login.password')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder={tr('login.passwordPlaceholder')}
                placeholderTextColor={c.textMuted}
                accessibilityLabel={tr('login.password')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={register ? 'new-password' : 'current-password'}
                textContentType={register ? 'newPassword' : 'password'}
                editable={!busy}
                returnKeyType="go"
                onSubmitEditing={submitEmail}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityState={{ selected: showPassword }}
                accessibilityLabel={tr(showPassword ? 'login.hidePassword' : 'login.showPassword')}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={c.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <GlowButton
            label={tr(register ? 'login.submit.signUp' : 'login.submit.signIn')}
            onPress={submitEmail}
            loading={pending === 'email'}
            disabled={busy && pending !== 'email'}
            style={styles.submit}
          />

          <Text style={styles.legal}>{tr('login.legal')}</Text>
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
    passwordRow: { justifyContent: 'center' },
    // Reserve room so masked text never slides under the reveal toggle.
    passwordInput: { paddingRight: 52 },
    eye: {
      position: 'absolute',
      right: spacing.sm,
      height: 44,
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { color: c.negative, fontSize: font.small, marginLeft: spacing.xs },
    notice: { color: c.primary, fontSize: font.small, marginLeft: spacing.xs },
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
