import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT, type StringKey } from '../i18n/strings';
import { font, Palette, radius, spacing, useTheme, weight } from '../theme';
import type { IconName } from '../types';

const STORAGE_KEY = 'zero.onboarded.v1';

/** First-run gate. `onboarded` is null until the flag is read from disk. */
export function useOnboarding() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => alive && setOnboarded(v === '1'))
      .catch(() => alive && setOnboarded(false));
    return () => {
      alive = false;
    };
  }, []);

  const complete = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => undefined);
  }, []);

  return { onboarded, complete };
}

interface Slide {
  icon: IconName;
  titleKey: StringKey;
  bodyKey: StringKey;
}

const SLIDES: readonly Slide[] = [
  { icon: 'flash-outline', titleKey: 'onboarding.s1.title', bodyKey: 'onboarding.s1.body' },
  { icon: 'people-outline', titleKey: 'onboarding.s2.title', bodyKey: 'onboarding.s2.body' },
  { icon: 'pie-chart-outline', titleKey: 'onboarding.s3.title', bodyKey: 'onboarding.s3.body' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const tr = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { width } = Dimensions.get('window');
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const last = index === SLIDES.length - 1;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      if (i !== index) setIndex(i);
    },
    [index, width],
  );

  const next = useCallback(() => {
    Haptics.selectionAsync().catch(() => undefined);
    if (last) {
      onDone();
      return;
    }
    scroller.current?.scrollTo({ x: width * (index + 1), animated: true });
  }, [last, index, width, onDone]);

  // Skip jumps to the last slide — it must NOT bypass the disclaimer gate.
  const skipToEnd = useCallback(() => {
    Haptics.selectionAsync().catch(() => undefined);
    const target = SLIDES.length - 1;
    setIndex(target);
    scroller.current?.scrollTo({ x: width * target, animated: true });
  }, [width]);

  const toggleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => undefined);
    setAccepted((a) => !a);
  }, []);

  const ctaDisabled = last && !accepted;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>ZERØ</Text>
        {!last ? (
          <TouchableOpacity onPress={skipToEnd} accessibilityRole="button" accessibilityLabel={tr('onboarding.skip')}>
            <Text style={styles.skip}>{tr('onboarding.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 1 }} />
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {SLIDES.map((s) => (
          <View key={s.titleKey} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={56} color={c.primary} />
            </View>
            <Text style={styles.title}>{tr(s.titleKey)}</Text>
            <Text style={styles.body}>{tr(s.bodyKey)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Disclaimer (last slide) */}
      {last ? (
        <Pressable
          style={styles.accept}
          onPress={toggleAccept}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel={tr('onboarding.accept')}
        >
          <Ionicons
            name={accepted ? 'checkbox-outline' : 'square-outline'}
            size={22}
            color={accepted ? c.primary : c.textMuted}
          />
          <View style={styles.acceptText}>
            <Text style={styles.disclaimer}>{tr('onboarding.disclaimer')}</Text>
            <Text style={styles.acceptLabel}>{tr('onboarding.accept')}</Text>
          </View>
        </Pressable>
      ) : null}

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.titleKey} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity
        onPress={next}
        disabled={ctaDisabled}
        activeOpacity={0.85}
        style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
        accessibilityRole="button"
        accessibilityLabel={tr(last ? 'onboarding.start' : 'onboarding.next')}
        accessibilityState={{ disabled: ctaDisabled }}
      >
        <Text style={styles.ctaText}>{tr(last ? 'onboarding.start' : 'onboarding.next')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: spacing.xl },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
      minHeight: 44,
    },
    logo: { color: c.text, fontSize: font.title, fontWeight: weight.black, letterSpacing: 1 },
    skip: { color: c.textMuted, fontSize: font.body, fontWeight: weight.semibold, padding: spacing.sm },
    slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
    iconWrap: {
      width: 112,
      height: 112,
      borderRadius: radius.full,
      backgroundColor: c.cardAlt,
      borderColor: c.primary,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { color: c.text, fontSize: font.big, fontWeight: weight.black, textAlign: 'center' },
    body: { color: c.textMuted, fontSize: font.subtitle, textAlign: 'center', lineHeight: 24 },
    accept: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    acceptText: { flex: 1, gap: spacing.xs },
    disclaimer: { color: c.textMuted, fontSize: font.small, lineHeight: 19 },
    acceptLabel: { color: c.text, fontSize: font.body, fontWeight: weight.semibold },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
    dotActive: { backgroundColor: c.primary, width: 22 },
    cta: {
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { color: c.onAccent, fontSize: font.subtitle, fontWeight: weight.bold, letterSpacing: 0.3 },
  });
