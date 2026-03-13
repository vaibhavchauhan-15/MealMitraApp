import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { useTheme } from '../theme/useTheme';
import { BorderRadius, Spacing, Typography, Shadow } from '../theme';
import { useSavedStore } from '../store/savedStore';
import { FallbackImage } from './FallbackImage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.md) / 2;

interface RecipeCardProps {
  recipe: Recipe;
  style?: object;
  horizontal?: boolean;
  preferPlaceholderForAi?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  style,
  horizontal,
  preferPlaceholderForAi,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { toggleSaved, isSaved } = useSavedStore();
  const saved = isSaved(recipe.id);
  const forcePlaceholder = Boolean(preferPlaceholderForAi && recipe.source === 'ai');
  const routeSource: 'master' | 'ai' = recipe.source === 'ai' ? 'ai' : 'master';

  const dietColor =
    recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan'
      ? colors.veg
      : colors.nonVeg;

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontal, { backgroundColor: colors.card, borderColor: colors.border, ...Shadow.sm }, style]}
        onPress={() =>
          router.push({
            pathname: '/recipe/[id]',
            params: { id: recipe.id, source: routeSource },
          } as any)
        }
        activeOpacity={0.85}
      >
        <FallbackImage
          uri={recipe.image}
          forcePlaceholder={forcePlaceholder}
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
            <Ionicons name="star" size={12} color={colors.starFilled} />
            <Text style={[styles.rating, { color: colors.text }]}> {recipe.rating}</Text>
            <Text style={[styles.metaDivider, { color: colors.textTertiary }]}>•</Text>
            <Text style={[styles.meta, { color: colors.textTertiary }]}>{recipe.cook_time} min</Text>
            <Text style={[styles.metaDivider, { color: colors.textTertiary }]}>•</Text>
            <Text style={[styles.meta, { color: colors.textTertiary }]}>{recipe.calories} kcal</Text>
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
      style={[styles.card, { backgroundColor: colors.card, width: CARD_WIDTH, borderColor: colors.border, ...Shadow.sm }, style]}
      onPress={() =>
        router.push({
          pathname: '/recipe/[id]',
          params: { id: recipe.id, source: routeSource },
        } as any)
      }
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <FallbackImage
          uri={recipe.image}
          forcePlaceholder={forcePlaceholder}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.62)']}
          locations={[0.25, 1]}
          style={styles.imageGradient}
        />
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
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={11} color="#FFF" />
          <Text style={styles.timeText}>{recipe.cook_time} min</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.row}>
          <Ionicons name="star" size={12} color={colors.starFilled} />
          <Text style={[styles.rating, { color: colors.text }]}> {recipe.rating}</Text>
          <Text style={[styles.metaDivider, { color: colors.textTertiary }]}>•</Text>
          <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
          <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {recipe.cuisine}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  saveBtnOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timeBadge: {
    position: 'absolute',
    right: 10,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timeText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  difficultyText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  cardContent: {
    padding: Spacing.md,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    lineHeight: 21,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
  },
  horizontalImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginLeft: Spacing.sm,
  },
  horizontalContent: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  horizontalName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    lineHeight: 21,
  },
  saveBtn: {
    paddingRight: Spacing.md,
  },
});
