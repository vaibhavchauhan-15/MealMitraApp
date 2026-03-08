import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/useTheme';
import { BorderRadius, Spacing, Typography, Shadow } from '../theme';

interface CuisineCardProps {
  name: string;
  image?: string;
  emoji?: string;
  recipeCount?: number;
}

const CUISINE_IMAGES: Record<string, string> = {
  Punjabi: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200',
  'South Indian': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200',
  'North Indian': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200',
  Hyderabadi: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200',
  Maharashtrian: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200',
  'Street Food': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200',
  Desserts: 'https://images.unsplash.com/photo-1590899887595-8b0ed3a99ca4?w=200',
  'Indo-Chinese': 'https://images.unsplash.com/photo-1636107073958-d29d98f48e88?w=200',
  Bengali: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
  Kashmiri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200',
};

const CUISINE_EMOJIS: Record<string, string> = {
  Punjabi: '🧆',
  'South Indian': '🥘',
  'North Indian': '🍛',
  Hyderabadi: '🍚',
  Maharashtrian: '🫓',
  'Street Food': '🌮',
  Desserts: '🍮',
  'Indo-Chinese': '🥟',
  Bengali: '🐟',
  Rajasthani: '🫕',
  Gujarati: '🥗',
  Kashmiri: '🫙',
};

export const CuisineCard: React.FC<CuisineCardProps> = ({ name, recipeCount }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const image = CUISINE_IMAGES[name];
  const emoji = CUISINE_EMOJIS[name] || '🍽️';

  return (
    <TouchableOpacity
      style={[styles.card, { ...Shadow.sm }]}
      onPress={() => router.push(`/category/${encodeURIComponent(name)}` as any)}
      activeOpacity={0.85}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.emojiContainer, { backgroundColor: colors.accentLight }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {recipeCount !== undefined && (
          <Text style={styles.count}>{recipeCount} recipes</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 130,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  name: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  count: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.xs,
  },
});
