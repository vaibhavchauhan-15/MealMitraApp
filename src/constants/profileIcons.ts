import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileIconOption = {
  id: string;
  label: string;
  icon: IoniconName;
  color: string;
};

export const PROFILE_ICON_OPTIONS: ProfileIconOption[] = [
  { id: 'chef_hat', label: 'Chef', icon: 'restaurant-outline', color: '#F97316' },
  { id: 'runner', label: 'Runner', icon: 'fitness-outline', color: '#22C55E' },
  { id: 'spark', label: 'Spark', icon: 'flash-outline', color: '#F59E0B' },
  { id: 'leafy', label: 'Leaf', icon: 'leaf-outline', color: '#10B981' },
  { id: 'coffee', label: 'Coffee', icon: 'cafe-outline', color: '#A16207' },
  { id: 'heart', label: 'Heart', icon: 'heart-outline', color: '#EF4444' },
  { id: 'star', label: 'Star', icon: 'star-outline', color: '#EAB308' },
  { id: 'bowl', label: 'Bowl', icon: 'nutrition-outline', color: '#0EA5E9' },
];

export function getProfileIconById(id?: string | null): ProfileIconOption | null {
  if (!id) return null;
  return PROFILE_ICON_OPTIONS.find((option) => option.id === id) ?? null;
}
