import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Recipe } from '../types';
import { useTheme } from '../theme/useTheme';
import { BorderRadius, Spacing, Typography, Shadow } from '../theme';
import { useSavedStore } from '../store/savedStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.md) / 2;

interface RecipeCardProps {
  recipe: Recipe;
  style?: object;
  horizontal?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, style, horizontal }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { toggleSaved, isSaved } = useSavedStore();
  const saved = isSaved(recipe.id);

  const dietColor =
    recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan'
      ? colors.veg
      : colors.nonVeg;

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontal, { backgroundColor: colors.card, ...Shadow.sm }, style]}
        onPress={() => router.push(`/recipe/${recipe.id}` as any)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: recipe.image }}
          style={styles.horizontalImage}
          resizeMode="cover"
        />
        <View style={styles.horizontalContent}>
          <View style={styles.row}>
            <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
            <Text style={[styles.cuisine, { color: colors.textSecondary }]}>
              {recipe.cuisine}
            </Text>
          </View>
          <Text style={[styles.horizontalName, { color: colors.text }]} numberOfLines={2}>
            {recipe.name}
          </Text>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {' '}{recipe.cook_time} min
            </Text>
            <Text style={[styles.metaDivider, { color: colors.textTertiary }]}>·</Text>
            <Ionicons name="flame-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {' '}{recipe.calories} kcal
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => toggleSaved(recipe.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, width: CARD_WIDTH, ...Shadow.sm }, style]}
      onPress={() => router.push(`/recipe/${recipe.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        <TouchableOpacity
          style={styles.saveBtnOverlay}
          onPress={() => toggleSaved(recipe.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color="#FFF" />
        </TouchableOpacity>
        <View style={[styles.difficultyBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
          <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {recipe.cuisine}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.row}>
          <Ionicons name="star" size={12} color={colors.starFilled} />
          <Text style={[styles.rating, { color: colors.text }]}> {recipe.rating}</Text>
          <Text style={[styles.metaDivider, { color: colors.textTertiary }]}>·</Text>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.meta, { color: colors.textTertiary }]}> {recipe.cook_time}m</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
  },
  saveBtnOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  cardContent: {
    padding: Spacing.sm,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dietDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cuisine: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  name: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  rating: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  meta: {
    fontSize: Typography.fontSize.xs,
  },
  metaDivider: {
    fontSize: Typography.fontSize.xs,
    marginHorizontal: 2,
  },
  // Horizontal variant
  horizontal: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  horizontalImage: {
    width: 90,
    height: 90,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    gap: 5,
  },
  horizontalName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  saveBtn: {
    paddingRight: Spacing.md,
  },
});
