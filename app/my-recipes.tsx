import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useUserStore } from '../src/store/userStore';
import { supabase } from '../src/services/supabase';
import { mapDbToRecipe, DbRecipeRow, Recipe } from '../src/types';
import { FallbackImage } from '../src/components/FallbackImage';
import { ConfirmModal } from '../src/components/ConfirmModal';
import { useToast } from '../src/hooks/useToast';
import { Toast } from '../src/components/Toast';
import { invalidateRecipeQueryCaches } from '../src/services/searchService';

interface MyRecipeItem {
  recipe: Recipe;
  createdAt: string | null;
}

interface EditDraft {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  diet: string;
  difficulty: string;
  imageUrl: string;
  cookTime: string;
  servings: string;
  ingredientsRows: IngredientFormRow[];
  stepsRows: StepFormRow[];
  nutritionPer100g: {
    calories: string;
    protein_g: string;
    carbs_g: string;
    fat_g: string;
    fiber_g: string;
    sugar_g: string;
  };
}

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const UNIT_OPTIONS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'large', 'medium', 'small', 'piece'];

type IngredientFormRow = { id: string; name: string; quantity: string; unit: string };
type StepFormRow = { id: string; instruction: string };

function sanitizeText(value: string, maxLen: number): string {
  const stripped = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return stripped.slice(0, maxLen);
}

function parsePositiveInt(value: string, fallback: number, min = 1, max = 600): number {
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
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

function createIngredientRow(): IngredientFormRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', quantity: '', unit: 'g' };
}

function createStepRow(): StepFormRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, instruction: '' };
}

function recipeToIngredientRows(recipe: Recipe): IngredientFormRow[] {
  const rows = (recipe.ingredients ?? [])
    .map((ing) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: ing.name ?? '',
      quantity: ing.quantity ? String(ing.quantity) : '',
      unit: ing.unit || 'g',
    }))
    .filter((row) => row.name.trim().length > 0);

  return rows.length > 0 ? rows : [createIngredientRow()];
}

function recipeToStepRows(recipe: Recipe): StepFormRow[] {
  const rows = (recipe.steps ?? [])
    .map((step) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      instruction: step.instruction ?? '',
    }))
    .filter((row) => row.instruction.trim().length > 0);

  return rows.length > 0 ? rows : [createStepRow()];
}

export default function MyRecipesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ editRecipeId?: string | string[] }>();
  const profile = useUserStore((s) => s.profile);
  const ingredientInputRefs = useRef<Record<string, TextInput | null>>({});
  const stepInputRefs = useRef<Record<string, TextInput | null>>({});
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [items, setItems] = useState<MyRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MyRecipeItem | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [openUnitDropdownFor, setOpenUnitDropdownFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MyRecipeItem | null>(null);
  const [showUndoDelete, setShowUndoDelete] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast } = useToast();
  const autoOpenedEditRef = useRef(false);

  const editRecipeIdParam = useMemo(() => {
    if (Array.isArray(params.editRecipeId)) return params.editRecipeId[0];
    return params.editRecipeId;
  }, [params.editRecipeId]);

  useEffect(() => {
    const isNewArchitecture = (globalThis as any).nativeFabricUIManager != null;
    if (Platform.OS === 'android' && !isNewArchitecture && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const keyboardSub = Keyboard.addListener('keyboardDidShow', () => {
      setOpenUnitDropdownFor(null);
    });

    return () => {
      keyboardSub.remove();
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const sourceLabel = useMemo(() => {
    const name = profile?.name?.trim();
    return name ? `Source: ${name}` : 'Source: You';
  }, [profile?.name]);

  const loadMyRecipes = useCallback(async () => {
    const userId = profile?.id;
    if (!userId) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from('master_recipes')
      .select(
        'id,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
        'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,steps,source,created_at'
      )
      .eq('uploaded_by', userId)
      .eq('source', 'user_upload')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const next = (data ?? []).map((row: any) => ({
      recipe: mapDbToRecipe(row as DbRecipeRow),
      createdAt: (row?.created_at as string | null) ?? null,
    }));

    setItems(next);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadMyRecipes();
    }, [loadMyRecipes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadMyRecipes();
  }, [loadMyRecipes]);

  const openEdit = useCallback((item: MyRecipeItem) => {
    const r = item.recipe;
    setEditDraft({
      id: r.id,
      title: r.name,
      description: r.description,
      cuisine: r.cuisine,
      diet: r.diet,
      difficulty: r.difficulty,
      imageUrl: r.image,
      cookTime: String(r.cook_time || 20),
      servings: String(r.servings || 2),
      ingredientsRows: recipeToIngredientRows(r),
      stepsRows: recipeToStepRows(r),
      nutritionPer100g: {
        calories: r.calories ? String(r.calories) : '',
        protein_g: r.nutrition?.protein ? String(r.nutrition.protein) : '',
        carbs_g: r.nutrition?.carbs ? String(r.nutrition.carbs) : '',
        fat_g: r.nutrition?.fat ? String(r.nutrition.fat) : '',
        fiber_g: r.nutrition?.fiber ? String(r.nutrition.fiber) : '',
        sugar_g: r.nutrition?.sugar ? String(r.nutrition.sugar) : '',
      },
    });
  }, []);

  useEffect(() => {
    if (!editRecipeIdParam || autoOpenedEditRef.current || loading || items.length === 0) {
      return;
    }

    const target = items.find((item) => item.recipe.id === editRecipeIdParam);
    if (!target) return;

    openEdit(target);
    autoOpenedEditRef.current = true;
  }, [editRecipeIdParam, items, loading, openEdit]);

  const addIngredientRow = useCallback(() => {
    const row = createIngredientRow();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ingredientsRows: [...prev.ingredientsRows, row] };
    });
    setTimeout(() => {
      ingredientInputRefs.current[row.id]?.focus();
    }, 80);
  }, []);

  const removeIngredientRow = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditDraft((prev) => {
      if (!prev) return prev;
      if (prev.ingredientsRows.length === 1) {
        return {
          ...prev,
          ingredientsRows: [{ ...prev.ingredientsRows[0], name: '', quantity: '', unit: 'g' }],
        };
      }
      return { ...prev, ingredientsRows: prev.ingredientsRows.filter((row) => row.id !== id) };
    });
  }, []);

  const updateIngredientRow = useCallback((id: string, patch: Partial<IngredientFormRow>) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredientsRows: prev.ingredientsRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      };
    });
  }, []);

  const addStepRow = useCallback(() => {
    const row = createStepRow();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, stepsRows: [...prev.stepsRows, row] };
    });
    setTimeout(() => {
      stepInputRefs.current[row.id]?.focus();
    }, 80);
  }, []);

  const removeStepRow = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditDraft((prev) => {
      if (!prev) return prev;
      if (prev.stepsRows.length === 1) {
        return { ...prev, stepsRows: [{ ...prev.stepsRows[0], instruction: '' }] };
      }
      return { ...prev, stepsRows: prev.stepsRows.filter((row) => row.id !== id) };
    });
  }, []);

  const updateStepRow = useCallback((id: string, instruction: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stepsRows: prev.stepsRows.map((row) => (row.id === id ? { ...row, instruction } : row)),
      };
    });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editDraft || !profile?.id) return;

    const title = sanitizeText(editDraft.title, 120);
    const description = sanitizeText(editDraft.description, 1000);
    const cuisine = sanitizeText(editDraft.cuisine, 50);
    const imageUrl = sanitizeText(editDraft.imageUrl, 1024);
    const ingredients = editDraft.ingredientsRows
      .map((row) => ({
        name: sanitizeText(row.name, 80),
        quantity: Math.max(0, Number(row.quantity.trim()) || 0),
        unit: sanitizeText(row.unit || 'piece', 20),
      }))
      .filter((row) => row.name.length > 0)
      .slice(0, 60);

    const steps = editDraft.stepsRows
      .map((row) => sanitizeText(row.instruction, 500))
      .filter(Boolean)
      .slice(0, 80)
      .map((instruction, idx) => ({
        step_number: idx + 1,
        instruction,
        duration_min: 0,
      }));

    if (!title || !description || !cuisine) {
      showToast('Title, description and cuisine are required.', 'error', 'Validation');
      return;
    }
    if (!isValidImageUrl(imageUrl)) {
      showToast('Image URL must be http/https.', 'error', 'Validation');
      return;
    }
    if (ingredients.length === 0 || steps.length === 0) {
      showToast('Ingredients and steps cannot be empty.', 'error', 'Validation');
      return;
    }

    setSavingEdit(true);
    const tags = Array.from(
      new Set(
        `${cuisine} ${editDraft.diet} ${editDraft.difficulty}`
          .split(/[\s,]+/)
          .map((t) => sanitizeText(t, 24).toLowerCase())
          .filter(Boolean)
      )
    ).slice(0, 16);

    const { error } = await supabase
      .from('master_recipes')
      .update({
        title,
        description,
        cuisine,
        diet: editDraft.diet,
        difficulty: editDraft.difficulty,
        cook_time: parsePositiveInt(editDraft.cookTime, 20, 1, 600),
        servings: parsePositiveInt(editDraft.servings, 2, 1, 50),
        image_url: imageUrl || null,
        ingredients,
        steps,
        calories: parseOptionalNumber(editDraft.nutritionPer100g.calories, 0, 4000),
        protein_g: parseOptionalNumber(editDraft.nutritionPer100g.protein_g, 0, 500),
        carbs_g: parseOptionalNumber(editDraft.nutritionPer100g.carbs_g, 0, 500),
        fat_g: parseOptionalNumber(editDraft.nutritionPer100g.fat_g, 0, 500),
        fiber_g: parseOptionalNumber(editDraft.nutritionPer100g.fiber_g, 0, 200),
        sugar_g: parseOptionalNumber(editDraft.nutritionPer100g.sugar_g, 0, 500),
        tags,
      })
      .eq('id', editDraft.id)
      .eq('uploaded_by', profile.id)
      .eq('source', 'user_upload');

    setSavingEdit(false);
    if (error) {
      showToast(error.message, 'error', 'Edit Failed');
      return;
    }

    await invalidateRecipeQueryCaches();
    setEditDraft(null);
    showToast('Recipe updated successfully.', 'success', 'Updated');
    setRefreshing(true);
    await loadMyRecipes();
  }, [editDraft, loadMyRecipes, profile?.id, showToast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || !profile?.id) return;
    setDeleting(true);
    const target = deleteTarget;
    setDeleteTarget(null);
    setPendingDelete(target);
    setShowUndoDelete(true);
    setItems((prev) => prev.filter((item) => item.recipe.id !== target.recipe.id));
    setDeleting(false);

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }

    deleteTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('master_recipes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', target.recipe.id)
        .eq('uploaded_by', profile.id)
        .eq('source', 'user_upload');

      if (error) {
        setItems((prev) => [target, ...prev]);
        showToast(error.message, 'error', 'Delete Failed');
      } else {
        await invalidateRecipeQueryCaches();
        showToast('Recipe deleted successfully.', 'success', 'Deleted');
      }

      setPendingDelete(null);
      setShowUndoDelete(false);
      deleteTimerRef.current = null;
    }, 5000);
  }, [deleteTarget, loadMyRecipes, profile?.id, showToast]);

  const undoDelete = useCallback(() => {
    if (!pendingDelete) return;
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setItems((prev) => [pendingDelete, ...prev]);
    setPendingDelete(null);
    setShowUndoDelete(false);
    showToast('Delete undone.', 'success', 'Restored');
  }, [pendingDelete, showToast]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Recipes</Text>
        <TouchableOpacity onPress={() => router.push('/upload-recipe' as any)}>
          <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['3xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.recipe.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.recipeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() =>
                router.push({ pathname: '/recipe/[id]', params: { id: item.recipe.id, source: 'master' } } as any)
              }
              activeOpacity={0.85}
            >
              <FallbackImage uri={item.recipe.image} style={styles.recipeImage} resizeMode="cover" />
              <View style={styles.recipeBody}>
                <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.recipe.name}
                </Text>
                <Text style={[styles.recipeMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.recipe.cuisine} • {item.recipe.diet} • {item.recipe.cook_time} min
                </Text>
                <Text style={[styles.recipeSource, { color: colors.textTertiary }]} numberOfLines={1}>
                  {sourceLabel}
                </Text>
                <View style={styles.recipeActionsRow}>
                  <TouchableOpacity
                    style={[styles.recipeActionBtn, { backgroundColor: colors.accentLight }]}
                    onPress={() => openEdit(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.accent} />
                    <Text style={[styles.recipeActionText, { color: colors.accent }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.recipeActionBtn, { backgroundColor: colors.error + '18' }]}
                    onPress={() => setDeleteTarget(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                    <Text style={[styles.recipeActionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes created yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Share your favourite recipes with the MealMitra community.
              </Text>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/upload-recipe' as any)}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.createBtnText}>Create Recipe</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!editDraft} transparent animationType="fade" onRequestClose={() => setEditDraft(null)}>
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Recipe</Text>
              <TouchableOpacity onPress={() => setEditDraft(null)} disabled={savingEdit}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              onScrollBeginDrag={() => setOpenUnitDropdownFor(null)}
              contentContainerStyle={{ paddingBottom: Spacing.base }}
            >
              {openUnitDropdownFor ? (
                <Pressable style={styles.modalDropdownBackdrop} onPress={() => setOpenUnitDropdownFor(null)} />
              ) : null}

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Recipe Name *</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.title ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, title: v } : s))}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                multiline
                style={[styles.modalInput, styles.modalInputMultiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.description ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, description: v } : s))}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Cuisine *</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.cuisine ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, cuisine: v } : s))}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Image URL</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.imageUrl ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, imageUrl: v } : s))}
                autoCapitalize="none"
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Ingredients *</Text>
              <View style={styles.modalSectionHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalAddBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={addIngredientRow}
                  disabled={savingEdit}
                >
                  <Ionicons name="add" size={16} color={colors.accent} />
                  <Text style={[styles.modalAddBtnText, { color: colors.accent }]}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>

              {editDraft?.ingredientsRows.map((row, idx) => (
                <View
                  key={row.id}
                  style={[
                    styles.editCard,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    openUnitDropdownFor === row.id && styles.editCardOpen,
                  ]}
                >
                  <View style={[styles.editSerial, { backgroundColor: colors.accent }]}>
                    <Text style={styles.editSerialText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.editCardBody}>
                    <TextInput
                      ref={(ref) => {
                        ingredientInputRefs.current[row.id] = ref;
                      }}
                      style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={row.name}
                      onChangeText={(v) => updateIngredientRow(row.id, { name: v })}
                      placeholder="Ingredient name"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <View style={styles.editIngredientMetaRow}>
                      <TextInput
                        style={[styles.modalInput, styles.editQtyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={row.quantity}
                        onChangeText={(v) => updateIngredientRow(row.id, { quantity: v.replace(/[^0-9.]/g, '') })}
                        keyboardType="decimal-pad"
                        placeholder="Qty"
                        placeholderTextColor={colors.textSecondary}
                      />

                      <View style={styles.editUnitWrap}>
                        <TouchableOpacity
                          style={[styles.editUnitTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
                          onPress={() =>
                            setOpenUnitDropdownFor((prev) => (prev === row.id ? null : row.id))
                          }
                        >
                          <Text style={[styles.editUnitTriggerText, { color: colors.text }]}>{row.unit || 'Select unit'}</Text>
                          <Ionicons
                            name={openUnitDropdownFor === row.id ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>

                        {openUnitDropdownFor === row.id && (
                          <View style={[styles.editDropdownMenu, { borderColor: colors.border, backgroundColor: colors.background }]}>
                            {UNIT_OPTIONS.map((unit) => {
                              const active = row.unit === unit;
                              return (
                                <TouchableOpacity
                                  key={`${row.id}-${unit}`}
                                  style={[styles.editDropdownItem, active && { backgroundColor: colors.accent + '22' }]}
                                  onPress={() => {
                                    updateIngredientRow(row.id, { unit });
                                    setOpenUnitDropdownFor(null);
                                  }}
                                >
                                  <Text style={[styles.editDropdownItemText, { color: colors.text }]}>{unit}</Text>
                                  {active ? <Ionicons name="checkmark" size={16} color={colors.accent} /> : null}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeIngredientRow(row.id)} style={styles.editRemoveBtn}>
                    <Ionicons name="remove-circle-outline" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Steps *</Text>
              <View style={styles.modalSectionHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalAddBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={addStepRow}
                  disabled={savingEdit}
                >
                  <Ionicons name="add" size={16} color={colors.accent} />
                  <Text style={[styles.modalAddBtnText, { color: colors.accent }]}>Add Step</Text>
                </TouchableOpacity>
              </View>

              {editDraft?.stepsRows.map((row, idx) => (
                <View key={row.id} style={[styles.editCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={[styles.editSerial, { backgroundColor: colors.accent }]}>
                    <Text style={styles.editSerialText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.editCardBody}>
                    <TextInput
                      ref={(ref) => {
                        stepInputRefs.current[row.id] = ref;
                      }}
                      multiline
                      textAlignVertical="top"
                      style={[styles.modalInput, styles.editStepInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={row.instruction}
                      onChangeText={(v) => updateStepRow(row.id, v)}
                      placeholder="e.g. Add 200ml water to a saucepan"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeStepRow(row.id)} style={styles.editRemoveBtn}>
                    <Ionicons name="remove-circle-outline" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Nutrition per 100g</Text>
              <View style={styles.editNutritionGrid}>
                {[
                  { key: 'calories', label: 'Calories (kcal)' },
                  { key: 'protein_g', label: 'Protein (g)' },
                  { key: 'carbs_g', label: 'Carbs (g)' },
                  { key: 'fat_g', label: 'Fat (g)' },
                  { key: 'fiber_g', label: 'Fiber (g)' },
                  { key: 'sugar_g', label: 'Sugar (g)' },
                ].map((item) => (
                  <View key={item.key} style={styles.editNutritionCell}>
                    <Text style={[styles.editNutritionLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <TextInput
                      style={[styles.modalInput, styles.editNutritionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={editDraft?.nutritionPer100g[item.key as keyof EditDraft['nutritionPer100g']] ?? ''}
                      onChangeText={(v) =>
                        setEditDraft((s) =>
                          s
                            ? {
                                ...s,
                                nutritionPer100g: {
                                  ...s.nutritionPer100g,
                                  [item.key]: v.replace(/[^0-9.]/g, ''),
                                },
                              }
                            : s
                        )
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Diet</Text>
              <View style={styles.modalOptionRow}>
                {DIET_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: editDraft?.diet === d ? colors.accent : colors.surface,
                        borderColor: editDraft?.diet === d ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setEditDraft((s) => (s ? { ...s, diet: d } : s))}
                  >
                    <Text style={{ color: editDraft?.diet === d ? '#FFF' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Difficulty</Text>
              <View style={styles.modalOptionRow}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: editDraft?.difficulty === d ? colors.accent : colors.surface,
                        borderColor: editDraft?.difficulty === d ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setEditDraft((s) => (s ? { ...s, difficulty: d } : s))}
                  >
                    <Text style={{ color: editDraft?.difficulty === d ? '#FFF' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Cook Time (min)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.cookTime ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, cookTime: v } : s))}
                keyboardType="numeric"
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Servings</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={editDraft?.servings ?? ''}
                onChangeText={(v) => setEditDraft((s) => (s ? { ...s, servings: v } : s))}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setEditDraft(null)}
                disabled={savingEdit}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => void saveEdit()}
                disabled={savingEdit}
              >
                {savingEdit ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Recipe"
        message={`Delete "${deleteTarget?.recipe?.name ?? 'this recipe'}"? This cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        destructive
        icon="trash-outline"
        iconColor={colors.error}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleting) void confirmDelete();
        }}
      />

      {showUndoDelete && pendingDelete ? (
        <View
          style={[
            styles.undoBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              bottom: insets.bottom + Spacing.base,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.undoTitle, { color: colors.text }]}>Recipe deleted</Text>
            <Text style={[styles.undoSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {pendingDelete.recipe.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.undoBtn, { borderColor: colors.accent }]}
            onPress={undoDelete}
            activeOpacity={0.85}
          >
            <Text style={[styles.undoBtnText, { color: colors.accent }]}>Undo (5s)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '800' },
  content: { flexGrow: 1, padding: Spacing.base, gap: Spacing.sm },
  recipeCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recipeImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  recipeBody: {
    flex: 1,
    gap: 3,
  },
  recipeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  recipeMeta: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  recipeSource: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  recipeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  recipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  recipeActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.base,
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    maxHeight: '92%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modalDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  modalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 42,
    fontSize: Typography.fontSize.sm,
  },
  modalInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalOptionRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  modalSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  modalAddBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  editCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    position: 'relative',
    zIndex: 10,
    elevation: 1,
  },
  editCardOpen: {
    zIndex: 20,
    elevation: 5,
  },
  editSerial: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  editSerialText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: Typography.fontSize.xs,
  },
  editCardBody: { flex: 1, gap: Spacing.xs },
  editIngredientMetaRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  editQtyInput: { width: 90 },
  editUnitWrap: { flex: 1, position: 'relative', zIndex: 30 },
  editUnitTrigger: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: 42,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editUnitTriggerText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  editDropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    zIndex: 40,
    elevation: 7,
  },
  editDropdownItem: {
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editDropdownItemText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  editStepInput: { minHeight: 86, textAlignVertical: 'top' },
  editRemoveBtn: { paddingTop: 6 },
  editNutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  editNutritionCell: { width: '48%', gap: 6 },
  editNutritionLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  editNutritionInput: { minHeight: 40 },
  modalChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.base,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  undoBar: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  undoTitle: { fontSize: Typography.fontSize.sm, fontWeight: '800' },
  undoSubtitle: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  undoBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  undoBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: 80 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  emptySubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: Typography.fontSize.base },
});
