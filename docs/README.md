# MealMitra In-Depth Docs

This folder contains implementation-level documentation for the latest features added to MealMitra.

## Documents

1. [Social, Public Discovery, and Notifications](./social-discovery-notifications.md)
2. [AI Planner Deep Dive](./ai-planner-deep-dive.md)
3. [Migration Runbook](./migration-runbook.md)

## Intended Audience

- App developers working in routes under `app/`
- Service/store maintainers in `src/services` and `src/store`
- Backend maintainers applying Supabase migrations

## Quick Navigation

- Notification bridge: `src/services/interactionNotificationService.ts`
- Social actions and comments: `src/services/recipeSocialService.ts`
- Public browsing and user profile fetchers: `src/services/searchService.ts`
- Public AI plan data and planner mapping: `src/services/aiPlanSupabaseService.ts`
- Recipe detail social UI: `app/recipe/[id].tsx`
- Notifications screen: `app/notifications.tsx`
