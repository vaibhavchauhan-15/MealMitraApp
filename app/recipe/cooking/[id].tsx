import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Vibration,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTheme } from '../../../src/theme/useTheme';

// Avoid loading expo-notifications in Expo Go (SDK 53 removed remote push support,
// which causes a warning even for local notifications).
const isExpoGo = Constants.appOwnership === 'expo';
import { Spacing, Typography, BorderRadius } from '../../../src/theme';
import { useRecipeStore } from '../../../src/store/recipeStore';

const { width, height } = Dimensions.get('window');

export default function CookingModeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const routeSource: 'master' | 'ai' = source === 'ai' ? 'ai' : 'master';
  const fetchById = useRecipeStore((s) => s.fetchById);
  const getRecipeById = useRecipeStore((s) => s.getRecipeById);
  const [recipe, setRecipe] = React.useState(() => getRecipeById(id ?? ''));

  // Fetch from Supabase if not in cache
  React.useEffect(() => {
    if (!id) return;
    if (!recipe || recipe.steps.length === 0 || recipe.ingredients.length === 0) {
      fetchById(id, routeSource).then((r) => { if (r) setRecipe(r); });
    }
  }, [id, recipe, routeSource, fetchById]);

  const [cookingStarted, setCookingStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef<string | null>(null);
  // Absolute timestamp (ms) when the running timer will reach zero.
  // Stored in a ref so AppState handler always sees the latest value.
  const endTimeRef = useRef<number | null>(null);
  // Mirrors timerRunning state for use inside non-reactive callbacks.
  const timerRunningRef = useRef(false);

  // Called whenever the timer reaches zero (in-foreground OR returning from background)
  const handleTimerDone = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    endTimeRef.current = null;
    timerRunningRef.current = false;
    setTimerSeconds(0);
    setTimerRunning(false);
    setTimerDone(true);
    notifIdRef.current = null; // notification already fired or is about to
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
  };

  const steps = recipe?.steps ?? [];
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Cancel any pending timer notification
  const cancelNotif = async () => {
    if (isExpoGo || !notifIdRef.current) return;
    const Notifs = require('expo-notifications') as typeof import('expo-notifications');
    await Notifs.cancelScheduledNotificationAsync(notifIdRef.current);
    notifIdRef.current = null;
  };

  // Schedule a notification that fires after `seconds` seconds
  const scheduleNotif = async (seconds: number) => {
    if (isExpoGo) return;
    await cancelNotif();
    const Notifs = require('expo-notifications') as typeof import('expo-notifications');
    const notifId = await Notifs.scheduleNotificationAsync({
      content: {
        title: '⏱️ MealMitra — Timer Done!',
        body: `Step ${currentStep + 1} of "${recipe?.name}" is complete. Time to move on!`,
        sound: true,
        data: { recipeId: id },
      },
      trigger: {
        type: Notifs.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
        channelId: 'cooking-timer',
      },
    });
    notifIdRef.current = notifId;
  };

  const toggleTimer = () => {
    if (!timerRunning && timerSeconds === 0 && step?.time) {
      // Fresh start
      const secs = step.time * 60;
      endTimeRef.current = Date.now() + secs * 1000;
      timerRunningRef.current = true;
      setTimerSeconds(secs);
      setTimerRunning(true);
      setTimerDone(false);
      scheduleNotif(secs);
      return;
    }
    if (timerRunning) {
      // Manual pause — cancel scheduled notification and clear end-time
      endTimeRef.current = null;
      timerRunningRef.current = false;
      setTimerRunning(false);
      cancelNotif();
    } else if (timerSeconds > 0) {
      // Resume — reschedule with remaining time and refresh end-time
      endTimeRef.current = Date.now() + timerSeconds * 1000;
      timerRunningRef.current = true;
      setTimerRunning(true);
      scheduleNotif(timerSeconds);
    }
  };

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            handleTimerDone();
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

  // AppState: when backgrounded stop the visual interval (notification keeps ticking);
  // when foregrounded resync the countdown from the absolute end time.
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Returned to foreground
        if (endTimeRef.current === null) return; // timer not running or manually paused
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          // Timer expired while app was in background
          handleTimerDone();
        } else {
          // Restart the visual countdown from the accurate remaining time
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setTimerSeconds(remaining);
          timerRef.current = setInterval(() => {
            setTimerSeconds((s) => {
              if (s <= 1) {
                handleTimerDone();
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        // Going to background — stop the visual interval; notification is already scheduled
        if (timerRunningRef.current && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Reset timer & cancel notification when step changes
  useEffect(() => {
    endTimeRef.current = null;
    timerRunningRef.current = false;
    setTimerSeconds(0);
    setTimerRunning(false);
    setTimerDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
    cancelNotif();
  }, [currentStep]);

  // Cancel notification when screen unmounts
  useEffect(() => {
    return () => {
      cancelNotif();
    };
  }, []);

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

  // ── Pre-cooking start screen ──────────────────────────────────────
  if (!cookingStarted) {
    return (
      <View style={[styles.screen, styles.startScreen]}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <Ionicons name="restaurant-outline" size={72} color="#FF6B35" style={{ marginBottom: 24 }} />
        <Text style={styles.startLabel}>Ready to Cook?</Text>
        <Text style={styles.startTitle} numberOfLines={3}>{recipe.name}</Text>
        <Text style={styles.startMeta}>
          {steps.length} step{steps.length !== 1 ? 's' : ''}
          {(recipe as any).cookTime ? ` • ${(recipe as any).cookTime}` : ''}
        </Text>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setCookingStarted(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Start Cooking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#111' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => { cancelNotif(); router.back(); }} style={styles.closeBtn}>
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
            if (isLast) { cancelNotif(); router.back(); }
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

  // Start Cooking screen
  startScreen: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  startLabel: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  startTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  startMeta: {
    color: '#888',
    fontSize: 15,
    marginBottom: 52,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 50,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  backLink: { marginTop: 28 },
  backLinkText: { color: '#555', fontSize: 16 },
});
