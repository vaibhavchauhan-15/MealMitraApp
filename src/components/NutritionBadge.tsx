import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../theme';

interface NutritionBadgeProps {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calories: number;
}

interface NutrientItemProps {
  label: string;
  value: number;
  unit: string;
  color: string;
}

const NutrientItem: React.FC<NutrientItemProps> = ({ label, value, unit, color }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.nutrientItem}>
      <View style={[styles.nutrientDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.nutrientValue, { color: colors.text }]}>
          {value}{unit}
        </Text>
        <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
};

export const NutritionBadge: React.FC<NutritionBadgeProps> = ({
  protein, carbs, fat, fiber, calories,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Nutrition per serving</Text>
      <View style={styles.caloriesRow}>
        <Text style={[styles.calories, { color: colors.accent }]}>{calories}</Text>
        <Text style={[styles.kcal, { color: colors.textSecondary }]}> kcal</Text>
      </View>
      <View style={styles.grid}>
        <NutrientItem label="Protein" value={protein} unit="g" color="#3B82F6" />
        <NutrientItem label="Carbs" value={carbs} unit="g" color="#F59E0B" />
        <NutrientItem label="Fat" value={fat} unit="g" color="#EF4444" />
        <NutrientItem label="Fiber" value={fiber} unit="g" color="#22C55E" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calories: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  kcal: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '45%',
  },
  nutrientDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nutrientValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  nutrientLabel: {
    fontSize: Typography.fontSize.xs,
  },
});
