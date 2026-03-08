import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🍛',
    title: '10,000+ Indian Recipes',
    desc: 'Discover recipes from all Indian cuisines — Punjabi, South Indian, Bengali, and more.',
    bg: '#FF6B35',
  },
  {
    emoji: '👨‍🍳',
    title: 'Step-by-Step Cooking',
    desc: 'Cook confidently with full-screen cooking mode, timers, and voice guidance.',
    bg: '#22C55E',
  },
  {
    emoji: '📅',
    title: 'Weekly Meal Planner',
    desc: 'Plan your meals for the week and auto-generate your grocery shopping list.',
    bg: '#3B82F6',
  },
  {
    emoji: '🤖',
    title: 'AI Cooking Assistant',
    desc: 'Ask anything! Get ingredient substitutions, dietary advice, and cooking tips.',
    bg: '#8B5CF6',
  },
  {
    emoji: '📴',
    title: '100% Offline',
    desc: 'All recipes stored locally. Cook anywhere, anytime — no internet needed.',
    bg: '#F59E0B',
  },
];

export default function SlidesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
      setCurrent(current + 1);
    } else {
      router.push('/(onboarding)/login' as any);
    }
  };

  const skip = () => router.push('/(onboarding)/login' as any);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, idx) => (
          <View key={idx} style={[styles.slide, { width, backgroundColor: slide.bg }]}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination */}
      <View style={[styles.bottom, { backgroundColor: colors.background }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === current ? colors.accent : colors.border,
                  width: idx === current ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={skip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.accent }]}
            onPress={goNext}
          >
            <Text style={styles.nextText}>
              {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.lg,
  },
  slideEmoji: { fontSize: 90 },
  slideTitle: {
    color: '#FFF',
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '900',
    textAlign: 'center',
  },
  slideDesc: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  nextBtn: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  nextText: {
    color: '#FFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
});
