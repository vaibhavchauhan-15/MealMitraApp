import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardTypeOptions,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  UIManager,
  Easing,
  Keyboard,
} from 'react-native';
import { Toast } from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { supabase } from '../src/services/supabase';
import { invalidateRecipeQueryCaches } from '../src/services/searchService';

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const UNIT_OPTIONS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'large', 'medium', 'small', 'piece'];

type IngredientRow = { name: string; quantity: number; unit: string; notes?: string };
type StepRow = { step_number: number; instruction: string; duration_min: number };
type IngredientFormRow = { id: string; name: string; quantity: string; unit: string };
type StepFormRow = { id: string; instruction: string };

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: {
    text: string;
    surface: string;
    border: string;
    textSecondary: string;
  };
  submitting: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  submitting,
  multiline = false,
  keyboardType = 'default',
}: InputFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          multiline && { height: 100, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={!submitting}
      />
    </View>
  );
}

function sanitizeText(value: string, maxLen: number): string {
  const stripped = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return stripped.slice(0, maxLen);
}

function parsePositiveInt(value: string, fallback: number, min = 1, max = 600): number {
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.max(min, Math.min(max, Math.round(n)));
  return clamped;
}

function parseOptionalNumber(value: string, min = 0, max = 5000): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  return Math.max(min, Math.min(max, rounded));
}

function isValidImageUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function makeRecipeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'recipe';
  const suffix = Date.now().toString(36).slice(-6);
  return `${base}-${suffix}`;
}

function createIngredientRow(): IngredientFormRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', quantity: '', unit: 'g' };
}

function createStepRow(): StepFormRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, instruction: '' };
}

export default function UploadRecipeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const entryAnim = useRef(new Animated.Value(0)).current;
  const ingredientInputRefs = useRef<Record<string, TextInput | null>>({});
  const stepInputRefs = useRef<Record<string, TextInput | null>>({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [diet, setDiet] = useState('Vegetarian');
  const [difficulty, setDifficulty] = useState('Easy');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsRows, setIngredientsRows] = useState<IngredientFormRow[]>([createIngredientRow()]);
  const [stepsRows, setStepsRows] = useState<StepFormRow[]>([createStepRow()]);
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [nutritionPer100g, setNutritionPer100g] = useState({
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    fiber_g: '',
    sugar_g: '',
    sodium_mg: '',
  });
  const [openUnitDropdownFor, setOpenUnitDropdownFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setOpenUnitDropdownFor(null);
    });

    return () => {
      showSub.remove();
    };
  }, [entryAnim]);

  const tags = useMemo(() => {
    const tokens = `${cuisine} ${diet} ${difficulty}`
      .split(/[\s,]+/)
      .map((t) => sanitizeText(t, 24).toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(tokens)).slice(0, 16);
  }, [cuisine, diet, difficulty]);

  const clearForm = () => {
    setName('');
    setDescription('');
    setCuisine('');
    setDiet('Vegetarian');
    setDifficulty('Easy');
    setImageUrl('');
    setIngredientsRows([createIngredientRow()]);
    setStepsRows([createStepRow()]);
    setCookTime('');
    setServings('');
    setNutritionPer100g({
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: '',
      fiber_g: '',
      sugar_g: '',
      sodium_mg: '',
    });
  };

  const addIngredientRow = () => {
    const newRow = createIngredientRow();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIngredientsRows((prev) => [...prev, newRow]);
    setTimeout(() => {
      ingredientInputRefs.current[newRow.id]?.focus();
    }, 80);
  };

  const removeIngredientRow = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIngredientsRows((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], name: '', quantity: '', unit: 'g' }];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateIngredientRow = (id: string, patch: Partial<IngredientFormRow>) => {
    setIngredientsRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addStepRow = () => {
    const newRow = createStepRow();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStepsRows((prev) => [...prev, newRow]);
    setTimeout(() => {
      stepInputRefs.current[newRow.id]?.focus();
    }, 80);
  };

  const removeStepRow = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStepsRows((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], instruction: '' }];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateStepRow = (id: string, instruction: string) => {
    setStepsRows((prev) => prev.map((row) => (row.id === id ? { ...row, instruction } : row)));
  };

  const handleSubmit = async () => {
    const safeName = sanitizeText(name, 120);
    const safeDescription = sanitizeText(description, 1000);
    const safeCuisine = sanitizeText(cuisine, 50);
    const safeImageUrl = sanitizeText(imageUrl, 1024);

    if (!safeName || !safeDescription || !safeCuisine) {
      showToast('Please fill in name, description, and cuisine.', 'error', 'Missing Fields');
      return;
    }

    if (!isValidImageUrl(safeImageUrl)) {
      showToast('Please enter a valid image URL (http/https).', 'error', 'Invalid Image URL');
      return;
    }

    const ingredients: IngredientRow[] = ingredientsRows
      .map((row) => ({
        name: sanitizeText(row.name, 80),
        quantity: Math.max(0, Number(row.quantity.trim()) || 0),
        unit: sanitizeText(row.unit || 'piece', 20),
      }))
      .filter((row) => row.name.length > 0)
      .slice(0, 60);

    const steps: StepRow[] = stepsRows
      .map((row) => sanitizeText(row.instruction, 500))
      .filter(Boolean)
      .slice(0, 80)
      .map((instruction, idx) => ({
        step_number: idx + 1,
        instruction,
        duration_min: 0,
      }));

    if (ingredients.length === 0) {
      showToast('Please add at least one ingredient.', 'error', 'Missing Ingredients');
      return;
    }
    if (steps.length === 0) {
      showToast('Please add at least one preparation step.', 'error', 'Missing Steps');
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (!authUser) {
        showToast('Please login to upload recipes.', 'error', 'Not Authenticated');
        return;
      }

      // Ensure FK target exists for uploaded_by -> user_profiles.id.
      await supabase.from('user_profiles').upsert(
        {
          id: authUser.id,
          name:
            (authUser.user_metadata?.name as string | undefined) ??
            authUser.email?.split('@')[0] ??
            'User',
          email: authUser.email ?? '',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      const basePayload = {
        uploaded_by: authUser.id,
        source: 'user_upload' as const,
        title: safeName,
        description: safeDescription,
        cuisine: safeCuisine,
        diet,
        difficulty,
        cook_time: parsePositiveInt(cookTime, 20, 1, 600),
        prep_time: 0,
        servings: parsePositiveInt(servings, 2, 1, 50),
        image_url: safeImageUrl || null,
        tags,
        is_public: true,
        ingredients,
        steps,
        calories: parseOptionalNumber(nutritionPer100g.calories, 0, 4000),
        protein_g: parseOptionalNumber(nutritionPer100g.protein_g, 0, 500),
        carbs_g: parseOptionalNumber(nutritionPer100g.carbs_g, 0, 500),
        fat_g: parseOptionalNumber(nutritionPer100g.fat_g, 0, 500),
        fiber_g: parseOptionalNumber(nutritionPer100g.fiber_g, 0, 200),
        sugar_g: parseOptionalNumber(nutritionPer100g.sugar_g, 0, 500),
        sodium_mg: parseOptionalNumber(nutritionPer100g.sodium_mg, 0, 15000),
      };

      // Supabase client parameterizes values; no string-built SQL is used.
      let inserted: { id: string; title: string; created_at: string } | null = null;
      let error: any = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data, error: insertErr } = await supabase
          .from('master_recipes')
          .insert({
            ...basePayload,
            recipe_slug: makeRecipeSlug(safeName),
          })
          .select('id,title,created_at')
          .single();

        if (!insertErr) {
          inserted = data;
          error = null;
          break;
        }

        // Retry once if unique key collision happens (extremely rare).
        if (insertErr?.code === '23505' && attempt === 0) {
          continue;
        }

        error = insertErr;
        break;
      }

      if (error) {
        showToast(error.message, 'error', 'Upload Failed');
        return;
      }

      await invalidateRecipeQueryCaches();

      clearForm();
      showToast(
        `Recipe uploaded successfully: ${inserted?.title ?? safeName}.`,
        'success',
        'Upload Successful'
      );
      setTimeout(() => router.back(), 850);
    } catch (err: any) {
      showToast(err?.message ?? 'Could not upload recipe.', 'error', 'Upload Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Upload Recipe</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={[styles.submitText, { color: colors.accent }]}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: entryAnim,
          transform: [
            {
              translateY: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          onScrollBeginDrag={() => setOpenUnitDropdownFor(null)}
        >
          {openUnitDropdownFor ? (
            <Pressable
              style={styles.dropdownBackdrop}
              onPress={() => setOpenUnitDropdownFor(null)}
            />
          ) : null}

          <InputField
            label="Recipe Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Paneer Butter Masala"
            colors={colors}
            submitting={submitting}
          />
          <InputField
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the recipe"
            multiline
            colors={colors}
            submitting={submitting}
          />
          <InputField
            label="Cuisine *"
            value={cuisine}
            onChangeText={setCuisine}
            placeholder="e.g. North Indian"
            colors={colors}
            submitting={submitting}
          />
          <InputField
            label="Image URL"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/recipe.jpg"
            colors={colors}
            submitting={submitting}
          />

          <View style={styles.field}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.label, { color: colors.text }]}>Ingredients *</Text>
              <TouchableOpacity
                style={[styles.addChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={addIngredientRow}
                disabled={submitting}
              >
                <Ionicons name="add" size={16} color={colors.accent} />
                <Text style={[styles.addChipText, { color: colors.accent }]}>Add Ingredient</Text>
              </TouchableOpacity>
            </View>

            {ingredientsRows.map((row, idx) => (
              <View
                key={row.id}
                style={[
                  styles.card,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  openUnitDropdownFor === row.id && styles.cardOpen,
                ]}
              >
                <View style={[styles.serialBadge, { backgroundColor: colors.accent }]}> 
                  <Text style={styles.serialText}>{idx + 1}</Text>
                </View>

                <View style={styles.cardBody}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={row.name}
                    ref={(ref) => {
                      ingredientInputRefs.current[row.id] = ref;
                    }}
                    onChangeText={(text) => updateIngredientRow(row.id, { name: text })}
                    placeholder="Ingredient name"
                    placeholderTextColor={colors.textSecondary}
                    editable={!submitting}
                  />

                  <View style={styles.ingredientMetaRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.quantityInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                      value={row.quantity}
                      onChangeText={(text) => updateIngredientRow(row.id, { quantity: text.replace(/[^0-9.]/g, '') })}
                      placeholder="Qty"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      editable={!submitting}
                    />

                    <View style={styles.unitSelectWrap}>
                      <TouchableOpacity
                        style={[
                          styles.unitSelectTrigger,
                          { borderColor: colors.border, backgroundColor: colors.background },
                        ]}
                        onPress={() =>
                          setOpenUnitDropdownFor((prev) => (prev === row.id ? null : row.id))
                        }
                        disabled={submitting}
                      >
                        <Text style={[styles.unitTriggerText, { color: colors.text }]}>{row.unit || 'Select unit'}</Text>
                        <Ionicons
                          name={openUnitDropdownFor === row.id ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {openUnitDropdownFor === row.id && (
                    <View style={[styles.dropdownMenu, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <ScrollView
                        style={styles.dropdownScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator
                      >
                        {UNIT_OPTIONS.map((unit) => {
                          const active = row.unit === unit;
                          return (
                            <TouchableOpacity
                              key={`${row.id}-dropdown-${unit}`}
                              style={[
                                styles.dropdownItem,
                                active && { backgroundColor: colors.accent + '22', borderColor: colors.accent },
                              ]}
                              onPress={() => {
                                updateIngredientRow(row.id, { unit });
                                setOpenUnitDropdownFor(null);
                              }}
                              disabled={submitting}
                            >
                              <Text style={[styles.dropdownItemText, { color: colors.text }]}>{unit}</Text>
                              {active ? <Ionicons name="checkmark" size={16} color={colors.accent} /> : null}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeIngredientRow(row.id)} disabled={submitting}>
                  <Ionicons name="remove-circle-outline" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.field}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.label, { color: colors.text }]}>Steps *</Text>
              <TouchableOpacity
                style={[styles.addChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={addStepRow}
                disabled={submitting}
              >
                <Ionicons name="add" size={16} color={colors.accent} />
                <Text style={[styles.addChipText, { color: colors.accent }]}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {stepsRows.map((row, idx) => (
              <View key={row.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={[styles.serialBadge, { backgroundColor: colors.accent }]}> 
                  <Text style={styles.serialText}>{idx + 1}</Text>
                </View>

                <View style={styles.cardBody}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.stepInput,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                    value={row.instruction}
                    ref={(ref) => {
                      stepInputRefs.current[row.id] = ref;
                    }}
                    onChangeText={(text) => updateStepRow(row.id, text)}
                    placeholder="e.g. First add 200ml water in the saucepan"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    editable={!submitting}
                  />
                </View>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeStepRow(row.id)} disabled={submitting}>
                  <Ionicons name="remove-circle-outline" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Nutrition per 100g</Text>
            <View style={styles.nutritionGrid}>
              {[
                { key: 'calories', label: 'Calories (kcal)' },
                { key: 'protein_g', label: 'Protein (g)' },
                { key: 'carbs_g', label: 'Carbs (g)' },
                { key: 'fat_g', label: 'Fat (g)' },
                { key: 'fiber_g', label: 'Fiber (g)' },
                { key: 'sugar_g', label: 'Sugar (g)' },
                { key: 'sodium_mg', label: 'Sodium (mg)' },
              ].map((item) => (
                <View key={item.key} style={styles.nutritionCell}>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.nutritionInput,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={nutritionPer100g[item.key as keyof typeof nutritionPer100g]}
                    onChangeText={(text) =>
                      setNutritionPer100g((prev) => ({
                        ...prev,
                        [item.key]: text.replace(/[^0-9.]/g, ''),
                      }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    editable={!submitting}
                  />
                </View>
              ))}
            </View>
          </View>

          <InputField
            label="Cook Time (minutes)"
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="e.g. 30"
            keyboardType="numeric"
            colors={colors}
            submitting={submitting}
          />
          <InputField
            label="Servings"
            value={servings}
            onChangeText={setServings}
            placeholder="e.g. 4"
            keyboardType="numeric"
            colors={colors}
            submitting={submitting}
          />

        {/* Diet Selector */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Diet Type</Text>
            <View style={styles.optionRow}>
              {DIET_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.optionChip,
                    { backgroundColor: diet === d ? colors.accent : colors.surface, borderColor: diet === d ? colors.accent : colors.border },
                  ]}
                  disabled={submitting}
                  onPress={() => setDiet(d)}
                >
                  <Text style={[styles.optionText, { color: diet === d ? '#FFF' : colors.text }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        {/* Difficulty Selector */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Difficulty</Text>
            <View style={styles.optionRow}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.optionChip,
                    { backgroundColor: difficulty === d ? colors.accent : colors.surface, borderColor: difficulty === d ? colors.accent : colors.border },
                  ]}
                  disabled={submitting}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.optionText, { color: difficulty === d ? '#FFF' : colors.text }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.accent }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Upload Recipe</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '800', textAlign: 'center' },
  submitText: { fontWeight: '700', fontSize: Typography.fontSize.base },
  content: { padding: Spacing.base, gap: Spacing.md },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  field: { gap: Spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  addChipText: { fontWeight: '700', fontSize: Typography.fontSize.xs },
  label: { fontWeight: '700', fontSize: Typography.fontSize.base },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    minHeight: 44,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    position: 'relative',
    zIndex: 10,
    elevation: 1,
  },
  cardOpen: {
    zIndex: 20,
    elevation: 5,
  },
  serialBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  serialText: { color: '#FFF', fontWeight: '800', fontSize: Typography.fontSize.sm },
  cardBody: { flex: 1, gap: Spacing.xs },
  ingredientMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quantityInput: { width: 96 },
  unitSelectWrap: { flex: 1, position: 'relative', zIndex: 25 },
  unitSelectTrigger: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTriggerText: { fontWeight: '600', fontSize: Typography.fontSize.sm },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 220,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 7,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    minHeight: 42,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  dropdownItemText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  stepInput: { minHeight: 86, textAlignVertical: 'top' },
  removeBtn: { paddingTop: 6, paddingHorizontal: 2 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  nutritionCell: { width: '48%', gap: 6 },
  nutritionLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  nutritionInput: { minHeight: 40, fontSize: Typography.fontSize.sm },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  optionText: { fontWeight: '600', fontSize: Typography.fontSize.sm },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 54,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: Typography.fontSize.lg },
});
