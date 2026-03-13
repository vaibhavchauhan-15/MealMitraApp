// scripts/seed-recipes.ts
// Seeds all local recipe data from src/data/recipes.ts into Supabase master_recipes table.
// Run with: npm run seed

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.seed') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in scripts/.env.seed')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── Import all local recipes ─────────────────────────────────────────────────
import allLocalRecipes from '../src/data/recipes'

// ── Map local Recipe type → master_recipes schema ───────────────────────────
// Duplicate prevention is handled by the DB UNIQUE(recipe_slug) constraint.
const recipes = allLocalRecipes.map((r) => ({
  recipe_slug: r.id,

  title:       r.name,
  description: r.description,
  cuisine:     r.cuisine,
  diet:        r.diet,
  difficulty:  r.difficulty,
  cook_time:   r.cook_time,
  prep_time:   r.prep_time,
  servings:    r.servings,
  calories:    r.calories,

  protein_g:   r.nutrition.protein,
  carbs_g:     r.nutrition.carbs,
  fat_g:       r.nutrition.fat,
  fiber_g:     r.nutrition.fiber,
  sugar_g:     r.nutrition.sugar,

  image_url:   r.image,
  tags:        r.tags,

  ingredients: r.ingredients.map((ing) => ({
    name:     ing.name,
    quantity: ing.quantity,
    unit:     ing.unit,
  })),

  steps: r.steps.map((s) => ({
    step_number:  s.step,
    instruction:  s.instruction,
    duration_min: s.time,
  })),

  source:    'app' as const,
  is_public: true,
}))

// ================================================================
// SEEDER — DO NOT EDIT BELOW THIS LINE
// ================================================================
async function seed() {
  console.log('🌱 MealMitra Recipe Seeder starting...')
  console.log(`📦 Total recipes to seed: ${recipes.length}`)
  console.log('─'.repeat(50))

  const CHUNK_SIZE = 100
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < recipes.length; i += CHUNK_SIZE) {
    const chunk = recipes.slice(i, i + CHUNK_SIZE)
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1
    const totalChunks = Math.ceil(recipes.length / CHUNK_SIZE)

    const { error } = await supabase
      .from('master_recipes')
      .upsert(chunk, { onConflict: 'recipe_slug', ignoreDuplicates: true })

    if (error) {
      console.error(`❌ Chunk ${chunkNum}/${totalChunks} failed: ${error.message}`)
      failCount += chunk.length
    } else {
      successCount += chunk.length
      console.log(`✅ Chunk ${chunkNum}/${totalChunks} done — ${successCount}/${recipes.length} recipes inserted`)
    }
  }

  console.log('─'.repeat(50))

  if (failCount === 0) {
    console.log(`🎉 Seed complete! ${successCount} recipes in Supabase.`)
  } else {
    console.log(`⚠️  Seed finished with issues. ✅ ${successCount} ok | ❌ ${failCount} failed`)
  }

  // Verify
  const { count } = await supabase
    .from('master_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'app')

  console.log(`📊 Total 'app' recipes in DB: ${count}`)
}

seed()