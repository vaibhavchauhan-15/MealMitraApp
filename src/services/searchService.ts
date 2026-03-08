import Fuse from 'fuse.js';
import { Recipe, RecipeFilters } from '../types';
import recipes from '../data/recipes';

// Fuse.js search index — single instance for performance
const fuse = new Fuse(recipes, {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'tags', weight: 0.2 },
    { name: 'cuisine', weight: 0.2 },
    { name: 'ingredients.name', weight: 0.2 },
  ],
  threshold: 0.35,
  minMatchCharLength: 2,
  includeScore: true,
});

export function searchRecipes(query: string, filters?: RecipeFilters): Recipe[] {
  let results: Recipe[];

  if (!query || query.trim() === '') {
    results = [...recipes];
  } else {
    results = fuse.search(query.trim()).map((r) => r.item);
  }

  if (filters) {
    results = results.filter((r) => {
      if (filters.diet && r.diet !== filters.diet) return false;
      if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.maxCookTime && r.cook_time > filters.maxCookTime) return false;
      if (filters.maxCalories && r.calories > filters.maxCalories) return false;
      return true;
    });
  }

  return results;
}

export function getRecipesByTag(tag: string): Recipe[] {
  return recipes.filter((r) => r.tags.includes(tag.toLowerCase()));
}

export function getRecipesByCuisine(cuisine: string): Recipe[] {
  return recipes.filter((r) => r.cuisine.toLowerCase() === cuisine.toLowerCase());
}

export function getFeaturedRecipes(): Recipe[] {
  return recipes.filter((r) => r.rating >= 4.7).slice(0, 8);
}

export function getQuickRecipes(): Recipe[] {
  return recipes.filter((r) => r.cook_time <= 20).slice(0, 8);
}

export function getTrendingRecipes(): Recipe[] {
  return [...recipes].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
}

export function getAllCuisines(): string[] {
  return [...new Set(recipes.map((r) => r.cuisine))].sort();
}

export const CUISINE_LIST = [
  'Gujarati', 'Punjabi', 'Rajasthani', 'Bengali', 'Maharashtrian',
  'South Indian', 'North Indian', 'Indo-Chinese', 'Street Food', 'Desserts',
  'Kashmiri', 'Hyderabadi',
];

export const DIET_FILTERS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'];

export const DIFFICULTY_FILTERS = ['Easy', 'Medium', 'Hard'];
