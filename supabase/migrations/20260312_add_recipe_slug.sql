-- ================================================================
-- Add recipe_slug — stable unique identifier for master_recipes
-- This replaces title-based deduplication in the seeder.
-- Run in Supabase SQL Editor after v3 reset migration.
-- ================================================================

ALTER TABLE public.master_recipes
  ADD COLUMN recipe_slug TEXT UNIQUE;

-- Index for fast lookup by slug
CREATE INDEX idx_recipes_slug ON public.master_recipes (recipe_slug);
