import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { BorderRadius, Spacing, Typography } from '../theme';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress, icon }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.chipActive : colors.chip,
          borderColor: active ? colors.chipBorderActive : colors.chipBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.label,
          { color: active ? colors.chipTextActive : colors.chipText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  iconContainer: {
    marginRight: 5,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
});
