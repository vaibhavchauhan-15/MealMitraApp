import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import {
  UserProfile,
  UserHealthProfile,
  FitnessGoal,
  UserActivityLevel,
  BodyGender,
} from '../../src/types';
import { PROFILE_ICON_OPTIONS } from '../../src/constants/profileIcons';
import { AuthAnimatedView, AuthInfoBox } from '../../src/components/auth/AuthUI';

// ─── Constants ──────────────────────────────────────────────────────────────────

const COOKING_LEVELS: UserProfile['cookingLevel'][] = ['Beginner', 'Intermediate', 'Expert'];
const CUISINES = [
  'North Indian', 'South Indian', 'Street Food', 'Mughlai',
  'Bengali', 'Gujarati', 'Punjabi', 'Goan', 'Kashmiri', 'Rajasthani',
];
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian', 'Jain'] as const;
type DietOption = typeof DIET_OPTIONS[number];

const GENDER_OPTIONS: { value: BodyGender; label: string; emoji: string }[] = [
  { value: 'male',   label: 'Male',   emoji: '♂️' },
  { value: 'female', label: 'Female', emoji: '♀️' },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', desc: 'Build lean muscle mass' },
  { value: 'fat_loss',    label: 'Fat Loss',    emoji: '🔥', desc: 'Burn body fat' },
  { value: 'maintain',    label: 'Maintain',    emoji: '⚖️', desc: 'Stay balanced & healthy' },
  { value: 'weight_gain', label: 'Weight Gain', emoji: '📈', desc: 'Healthy caloric surplus' },
];

const ACTIVITY_OPTIONS: {
  value: UserActivityLevel; label: string; emoji: string; desc: string;
}[] = [
  { value: 'sedentary',     label: 'Sedentary', emoji: '💼', desc: 'Desk job, barely move' },
  { value: 'light_1_3',    label: 'Light',     emoji: '🚶', desc: 'Light walk 1–3 days/week' },
  { value: 'moderate_3_5', label: 'Moderate',  emoji: '🏃', desc: 'Exercise 3–5 days/week' },
  { value: 'gym_5_days',   label: 'Active',    emoji: '🏋️', desc: 'Gym 5+ days/week' },
  { value: 'very_active',  label: 'Athlete',   emoji: '⚡', desc: 'Daily intense training' },
];

const COMMON_ALLERGIES = [
  'Nuts', 'Dairy', 'Gluten', 'Soy', 'Shellfish',
  'Eggs', 'Onion/Garlic', 'Spicy Food',
];

const HEALTH_CONDITIONS = [
  'Diabetes', 'Hypertension', 'High Cholesterol',
  'Thyroid', 'PCOS', 'IBS', 'Lactose Intolerant',
];

const MEALS_PER_DAY_OPTIONS: (2 | 3 | 4 | 5)[] = [2, 3, 4, 5];

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  '🍳 Cooking Prefs',
  '👤 About You',
  '📏 Body Stats',
  '🎯 Fitness Goal',
  '⚡ Lifestyle',
];
const STEP_SUBTITLES = [
  'Set your diet & cuisine preferences',
  'Tell us a bit about yourself',
  'Used to calculate your nutrition needs',
  'What do you want to achieve?',
  'Daily routine & food constraints',
];

// ─── BMR helper (Mifflin St Jeor) ──────────────────────────────────────────────

const ACTIVITY_MULT: Record<UserActivityLevel, number> = {
  sedentary: 1.2, light_1_3: 1.375, moderate_3_5: 1.55,
  gym_5_days: 1.725, very_active: 1.9,
};

function calcBMR(age: number, gender: BodyGender, weight: number, height: number) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

// ─── Reusable chip component ────────────────────────────────────────────────────

function Chip({
  label, selected, onPress, colors,
}: { label: string; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border },
      ]}
      activeOpacity={0.75}
    >
      {selected && <Ionicons name="checkmark" size={13} color="#FFF" style={{ marginRight: 2 }} />}
      <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Goal card component ────────────────────────────────────────────────────────

function GoalCard({
  item, selected, onPress, colors,
}: { item: (typeof GOAL_OPTIONS)[number]; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.goalCard,
        { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border },
      ]}
      activeOpacity={0.75}
    >
      <Text style={styles.goalEmoji}>{item.emoji}</Text>
      <Text style={[styles.goalLabel, { color: selected ? '#FFF' : colors.text }]}>{item.label}</Text>
      <Text style={[styles.goalDesc, { color: selected ? '#FFF9' : colors.textSecondary }]}>{item.desc}</Text>
      {selected && (
        <View style={styles.selectedDot}><Ionicons name="checkmark-circle" size={16} color="#FFF" /></View>
      )}
    </TouchableOpacity>
  );
}

// ─── Activity row component ─────────────────────────────────────────────────────

function ActivityCard({
  item, selected, onPress, colors,
}: { item: (typeof ACTIVITY_OPTIONS)[number]; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.activityCard,
        { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border },
      ]}
      activeOpacity={0.75}
    >
      <Text style={styles.activityEmoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.activityLabel, { color: selected ? '#FFF' : colors.text }]}>{item.label}</Text>
        <Text style={[styles.activityDesc, { color: selected ? '#FFF9' : colors.textSecondary }]}>{item.desc}</Text>
      </View>
      {selected && <Ionicons name="radio-button-on" size={18} color="#FFF" />}
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile, updateHealthProfile, setHasOnboarded } = useUserStore();

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0 – cooking preferences
  const [cookingLevel, setCookingLevel] = useState<UserProfile['cookingLevel']>(profile?.cookingLevel ?? 'Beginner');
  const [avatarIcon, setAvatarIcon] = useState(profile?.avatarIcon ?? PROFILE_ICON_OPTIONS[0].id);
  const [diets, setDiets] = useState<DietOption[]>(
    (profile?.dietPreferences as DietOption[] | undefined)?.length
      ? (profile!.dietPreferences as DietOption[])
      : ['Vegetarian']
  );
  const toggleDiet = (d: DietOption) =>
    setDiets((prev) =>
      prev.includes(d)
        ? prev.length > 1 ? prev.filter((x) => x !== d) : prev // keep at least 1
        : [...prev, d]
    );
  const [favCuisines, setFavCuisines] = useState<string[]>(profile?.favoriteCuisines ?? []);

  // Step 1 – identity
  const [gender, setGender] = useState<BodyGender | null>(profile?.healthProfile?.gender ?? null);
  const [ageText, setAgeText] = useState(profile?.healthProfile?.age?.toString() ?? '');

  // Step 2 – body metrics
  const [weightText, setWeightText] = useState(profile?.healthProfile?.weight?.toString() ?? '');
  const [heightText, setHeightText] = useState(profile?.healthProfile?.height?.toString() ?? '');

  // Step 3 – goal
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | null>(profile?.healthProfile?.fitnessGoal ?? null);

  // Step 4 – lifestyle
  const [activityLevel, setActivityLevel] = useState<UserActivityLevel | null>(profile?.healthProfile?.activityLevel ?? null);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(profile?.healthProfile?.allergies ?? []);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(profile?.healthProfile?.healthConditions ?? []);
  const [mealsPerDay, setMealsPerDay] = useState<2 | 3 | 4 | 5>(profile?.healthProfile?.mealsPerDay ?? 3);

  // ── Toggle helpers ──────────────────────────────────────────────────────────────
  const toggleCuisine   = (c: string) => setFavCuisines((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  const toggleAllergy   = (a: string) => setSelectedAllergies((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const toggleCondition = (c: string) => setSelectedConditions((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  // ── Validation ──────────────────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return true;
      case 1: { const a = parseInt(ageText); return !!gender && !isNaN(a) && a >= 10 && a <= 100; }
      case 2: { const w = parseFloat(weightText); const h = parseFloat(heightText); return !isNaN(w) && w >= 20 && w <= 300 && !isNaN(h) && h >= 100 && h <= 250; }
      case 3: return !!fitnessGoal;
      case 4: return !!activityLevel;
      default: return true;
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = () => {
    updateProfile({ cookingLevel, dietPreferences: diets, favoriteCuisines: favCuisines, avatarIcon });

    const age    = parseInt(ageText) || undefined;
    const weight = parseFloat(weightText) || undefined;
    const height = parseFloat(heightText) || undefined;

    let bmr: number | undefined;
    let tdee: number | undefined;
    if (age && weight && height && gender && activityLevel) {
      bmr  = calcBMR(age, gender, weight, height);
      tdee = Math.round(bmr * ACTIVITY_MULT[activityLevel]);
    }

    const hp: UserHealthProfile = {
      age,
      gender: gender ?? undefined,
      weight,
      height,
      fitnessGoal: fitnessGoal ?? undefined,
      activityLevel: activityLevel ?? undefined,
      allergies: selectedAllergies.length > 0 ? selectedAllergies : undefined,
      healthConditions: selectedConditions.length > 0 ? selectedConditions : undefined,
      mealsPerDay,
      bmr,
      tdee,
    };
    updateHealthProfile(hp);
    setHasOnboarded(true);
    router.replace('/(tabs)' as any);
  };

  // ── Step renderer ───────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      /* ── Step 0: cooking prefs ─────────────────────────────────────────────── */
      case 0: return (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🍳 Cooking Level</Text>
            <View style={styles.chipRow}>
              {COOKING_LEVELS.map((l) => (
                <Chip key={l} label={l} selected={cookingLevel === l} onPress={() => setCookingLevel(l)} colors={colors} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🧩 Profile Icon</Text>
            <View style={styles.iconGrid}>
              {PROFILE_ICON_OPTIONS.map((option) => {
                const active = avatarIcon === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.iconChoice,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accentLight : colors.surface,
                      },
                    ]}
                    onPress={() => setAvatarIcon(option.id)}
                  >
                    <Ionicons name={option.icon} size={16} color={active ? colors.accent : option.color} />
                    <Text style={[styles.iconChoiceLabel, { color: colors.textSecondary }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🥗 Diet Preference</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Select all that apply — mix & match!</Text>
            <View style={styles.chipRow}>
              {DIET_OPTIONS.map((d) => (
                <Chip key={d} label={d} selected={diets.includes(d)} onPress={() => toggleDiet(d)} colors={colors} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🌶️ Favourite Cuisines</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Select all that you enjoy</Text>
            <View style={styles.chipRow}>
              {CUISINES.map((c) => (
                <Chip key={c} label={c} selected={favCuisines.includes(c)} onPress={() => toggleCuisine(c)} colors={colors} />
              ))}
            </View>
          </View>
        </>
      );

      /* ── Step 1: about you ─────────────────────────────────────────────────── */
      case 1: return (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <Chip
                  key={g.value}
                  label={`${g.emoji} ${g.label}`}
                  selected={gender === g.value}
                  onPress={() => setGender(g.value)}
                  colors={colors}
                />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Age</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="e.g. 25"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={ageText}
                onChangeText={setAgeText}
                maxLength={3}
              />
              <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>yrs</Text>
            </View>
            {ageText.length > 0 && (parseInt(ageText) < 10 || parseInt(ageText) > 100) && (
              <Text style={styles.errorText}>Enter a valid age between 10–100</Text>
            )}
          </View>
        </>
      );

      /* ── Step 2: body stats ────────────────────────────────────────────────── */
      case 2: {
        const bmiPreview = (() => {
          const w = parseFloat(weightText);
          const hm = parseFloat(heightText) / 100;
          if (!w || !hm || hm <= 0) return null;
          const bmi = w / (hm * hm);
          const label = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
          const color = bmi < 18.5 ? '#F59E0B' : bmi < 25 ? '#22C55E' : bmi < 30 ? '#F97316' : '#EF4444';
          return { bmi: bmi.toFixed(1), label, color };
        })();
        return (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Weight</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="barbell-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. 72"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={weightText}
                  onChangeText={setWeightText}
                  maxLength={5}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>kg</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Height</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="resize-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. 175"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={heightText}
                  onChangeText={setHeightText}
                  maxLength={3}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>cm</Text>
              </View>
            </View>
            {bmiPreview && (
              <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.bmiTitle, { color: colors.textSecondary }]}>YOUR BMI</Text>
                <Text style={[styles.bmiValue, { color: bmiPreview.color }]}>{bmiPreview.bmi}</Text>
                <Text style={[styles.bmiLabel, { color: bmiPreview.color }]}>{bmiPreview.label}</Text>
              </View>
            )}
          </>
        );
      }

      /* ── Step 3: fitness goal ──────────────────────────────────────────────── */
      case 3: return (
        <View style={styles.section}>
          <Text style={[styles.sectionHint, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            Determines your calorie target and recipe recommendations
          </Text>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map((item) => (
              <GoalCard
                key={item.value}
                item={item}
                selected={fitnessGoal === item.value}
                onPress={() => setFitnessGoal(item.value)}
                colors={colors}
              />
            ))}
          </View>
        </View>
      );

      /* ── Step 4: lifestyle ─────────────────────────────────────────────────── */
      case 4: return (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Level</Text>
            <View style={{ gap: Spacing.sm }}>
              {ACTIVITY_OPTIONS.map((item) => (
                <ActivityCard
                  key={item.value}
                  item={item}
                  selected={activityLevel === item.value}
                  onPress={() => setActivityLevel(item.value)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Meals Per Day</Text>
            <View style={styles.chipRow}>
              {MEALS_PER_DAY_OPTIONS.map((n) => (
                <Chip key={n} label={`${n} meals`} selected={mealsPerDay === n} onPress={() => setMealsPerDay(n)} colors={colors} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Food Allergies / Avoid</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>We'll skip these in suggestions</Text>
            <View style={styles.chipRow}>
              {COMMON_ALLERGIES.map((a) => (
                <Chip key={a} label={a} selected={selectedAllergies.includes(a)} onPress={() => toggleAllergy(a)} colors={colors} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Conditions</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Optional — helps tailor your plan</Text>
            <View style={styles.chipRow}>
              {HEALTH_CONDITIONS.map((c) => (
                <Chip key={c} label={c} selected={selectedConditions.includes(c)} onPress={() => toggleCondition(c)} colors={colors} />
              ))}
            </View>
          </View>
        </>
      );

      default: return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={() => setCurrentStep((s) => s - 1)} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>
              {currentStep + 1} / {TOTAL_STEPS}
            </Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{STEP_TITLES[currentStep]}</Text>
          </View>
          <TouchableOpacity onPress={handleFinish} style={styles.navBtn}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress bar ─────────────────────────────────────────────────────── */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent,
                width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          {STEP_SUBTITLES[currentStep]}
        </Text>
        <AuthInfoBox
          iconColor={colors.accent}
          backgroundColor={colors.accentLight}
          borderColor={colors.accent + '40'}
          textColor={colors.textSecondary}
          style={styles.infoBox}
        >
          You can skip now and edit all profile details later from settings.
        </AuthInfoBox>

        {/* ── Step content ─────────────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthAnimatedView key={currentStep} delay={20}>
            {renderStep()}
          </AuthAnimatedView>
        </ScrollView>

        {/* ── Footer CTA ──────────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: canProceed() ? colors.accent : colors.border, ...Shadow.md },
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: canProceed() ? '#FFF' : colors.textSecondary }]}>
              {isLastStep ? "Let's Cook! 🎉" : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  navBtn:       { width: 36, height: 36, justifyContent: 'center' },
  skipText:     { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  stepCounter:  { fontSize: Typography.fontSize.xs, fontWeight: '600', marginBottom: 2 },
  stepTitle:    { fontSize: Typography.fontSize.lg, fontWeight: '800', textAlign: 'center' },
  stepSubtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xs,
  },
  infoBox: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },

  progressTrack: { height: 4, marginHorizontal: Spacing.base, borderRadius: 2, marginBottom: Spacing.md },
  progressFill:  { height: 4, borderRadius: 2 },

  scrollContent: { paddingHorizontal: Spacing.base, gap: Spacing.lg },

  section:      { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  sectionHint:  { fontSize: Typography.fontSize.xs, marginTop: -2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: { fontWeight: '600', fontSize: Typography.fontSize.sm },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconChoice: {
    width: '22%',
    minWidth: 62,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconChoiceLabel: { fontSize: 10, fontWeight: '600' },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  textInput: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600' },
  inputUnit: { fontSize: Typography.fontSize.sm, fontWeight: '600', marginLeft: 4 },
  errorText: { fontSize: Typography.fontSize.xs, color: '#EF4444', marginTop: 2 },

  bmiCard: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    gap: 2,
  },
  bmiTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bmiValue: { fontSize: 36, fontWeight: '900' },
  bmiLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700' },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  goalCard: {
    width: '47%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: 4,
    position: 'relative',
  },
  goalEmoji:   { fontSize: 28, marginBottom: 4 },
  goalLabel:   { fontSize: Typography.fontSize.base, fontWeight: '800' },
  goalDesc:    { fontSize: Typography.fontSize.xs },
  selectedDot: { position: 'absolute', top: 8, right: 8 },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  activityEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  activityLabel: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  activityDesc:  { fontSize: Typography.fontSize.xs, marginTop: 1 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
  },
  btn: {
    height: 54,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '800', fontSize: Typography.fontSize.lg },
});
