import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../../src/theme';
import { useRecipeStore } from '../../../src/store/recipeStore';

const { width, height } = Dimensions.get('window');

export default function CookingModeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getRecipeById = useRecipeStore((s) => s.getRecipeById);
  const recipe = getRecipeById(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = recipe?.steps ?? [];
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Start timer for this step
  const startTimer = () => {
    if (!step?.time) return;
    setTimerSeconds(step.time * 60);
    setTimerRunning(true);
    setTimerDone(false);
  };

  const toggleTimer = () => {
    if (!timerRunning && timerSeconds === 0) {
      startTimer();
      return;
    }
    setTimerRunning((prev) => !prev);
  };

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            Vibration.vibrate([0, 400, 200, 400]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Reset timer when step changes
  useEffect(() => {
    setTimerSeconds(0);
    setTimerRunning(false);
    setTimerDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentStep]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = steps.length > 1 ? currentStep / (steps.length - 1) : 1;

  if (!recipe || steps.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#111' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepIndex}>Step {currentStep + 1} of {steps.length}</Text>
      </View>

      {/* Step Dots */}
      <View style={styles.dotsRow}>
        {steps.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setCurrentStep(i)}
            style={[
              styles.dot,
              i < currentStep && styles.dotDone,
              i === currentStep && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Main Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>{step.instruction}</Text>
      </View>

      {/* Timer Section */}
      {step.time > 0 && (
        <View style={styles.timerSection}>
          {timerSeconds > 0 ? (
            <Text style={[styles.timerDisplay, timerDone && styles.timerDone]}>
              {timerDone ? '✅ Done!' : formatTime(timerSeconds)}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.timerBtn,
              timerRunning && styles.timerBtnPause,
              timerDone && styles.timerBtnDone,
            ]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={timerRunning ? 'pause' : 'timer-outline'}
              size={24}
              color="#fff"
            />
            <Text style={styles.timerBtnText}>
              {timerDone
                ? 'Timer Done'
                : timerRunning
                ? 'Pause Timer'
                : timerSeconds > 0
                ? 'Resume'
                : `Start ${step.time} min Timer`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={[styles.navRow, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            styles.navBtnSecondary,
            currentStep === 0 && styles.navBtnDisabled,
          ]}
          onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={22} color={currentStep === 0 ? '#555' : '#fff'} />
          <Text style={[styles.navBtnText, currentStep === 0 && { color: '#555' }]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, isLast ? styles.navBtnFinish : styles.navBtnPrimary]}
          onPress={() => {
            if (isLast) router.back();
            else setCurrentStep(currentStep + 1);
          }}
        >
          <Text style={styles.navBtnText}>{isLast ? '🎉 Finish!' : 'Next'}</Text>
          {!isLast && <Ionicons name="chevron-forward" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeName: {
    color: '#aaa',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    maxWidth: width * 0.6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    marginHorizontal: Spacing.base,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  stepIndicator: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  stepIndex: {
    color: '#FF6B35',
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  dotDone: { backgroundColor: '#FF6B35', opacity: 0.5 },
  dotActive: { backgroundColor: '#FF6B35', width: 24 },

  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  instruction: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 38,
    textAlign: 'center',
  },

  timerSection: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  timerDisplay: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 3,
  },
  timerDone: { color: '#4CAF50' },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FF6B35',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  timerBtnPause: { backgroundColor: '#555' },
  timerBtnDone: { backgroundColor: '#4CAF50' },
  timerBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSize.base },

  navRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 54,
    borderRadius: BorderRadius.full,
  },
  navBtnPrimary: { backgroundColor: '#FF6B35' },
  navBtnSecondary: { backgroundColor: '#222' },
  navBtnFinish: { backgroundColor: '#4CAF50' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSize.base },
  notFound: { fontSize: Typography.fontSize.lg, textAlign: 'center', marginTop: 100 },
});
