import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Jain'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

export default function UploadRecipeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [diet, setDiet] = useState('Vegetarian');
  const [difficulty, setDifficulty] = useState('Easy');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !cuisine.trim()) {
      Alert.alert('Missing Fields', 'Please fill in name, description, and cuisine.');
      return;
    }
    Alert.alert(
      'Recipe Submitted! 🎉',
      'Your recipe has been submitted for review and will appear in the app soon.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const Field = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (t: string) => void; placeholder: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions }) => (
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
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Upload Recipe</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={[styles.submitText, { color: colors.accent }]}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Upload */}
        <TouchableOpacity
          style={[styles.photoUpload, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.photoText, { color: colors.textSecondary }]}>Add Recipe Photo</Text>
        </TouchableOpacity>

        <Field label="Recipe Name *" value={name} onChangeText={setName} placeholder="e.g. Paneer Butter Masala" />
        <Field label="Description *" value={description} onChangeText={setDescription} placeholder="Brief description of the recipe" multiline />
        <Field label="Cuisine *" value={cuisine} onChangeText={setCuisine} placeholder="e.g. North Indian" />
        <Field label="Cook Time (minutes)" value={cookTime} onChangeText={setCookTime} placeholder="e.g. 30" keyboardType="numeric" />
        <Field label="Servings" value={servings} onChangeText={setServings} placeholder="e.g. 4" keyboardType="numeric" />

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
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
          <Text style={styles.submitBtnText}>Submit Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '800', textAlign: 'center' },
  submitText: { fontWeight: '700', fontSize: Typography.fontSize.base },
  content: { padding: Spacing.base, gap: Spacing.md },
  photoUpload: {
    height: 160,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoText: { fontWeight: '600', fontSize: Typography.fontSize.base },
  field: { gap: Spacing.xs },
  label: { fontWeight: '700', fontSize: Typography.fontSize.base },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    minHeight: 44,
  },
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
