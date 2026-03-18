# Social, Public Discovery, and Notifications

This document describes the new social interaction system, public discovery routes, and notification delivery path.

## Scope

Covers:
- Recipe reactions (`like`, `dislike`)
- Recipe comments, replies, and comment likes
- User notifications (realtime and local)
- Public AI recipe browse flow
- Public user browse and profile flow

## Route-Level Features

### Public discovery routes

- `app/browse-ai-recipes.tsx`
  - Fetches public AI recipes from `user_ai_generated_recipes`
  - Supports query, local recent searches, sorting, pagination cap (`maxResults <= 30`)
- `app/browse-users.tsx`
  - Fetches public users from `user_profiles`
  - Applies diet/cooking filters and sorting
  - Excludes current authenticated user from browse list
- `app/user/[id].tsx`
  - Public creator profile
  - Merges uploaded recipes from `master_recipes` (`user_upload`) + `user_ai_generated_recipes`
  - Loads engagement counters per recipe source (`master`/`ai`)

### Social interaction route

- `app/recipe/[id].tsx`
  - Optimistic reaction toggles
  - Threaded comments and replies with optimistic insert/edit/delete
  - Comment like toggles
  - Realtime refresh via Supabase channels on `recipe_reactions`, `recipe_comments`, and `comment_likes`

### Notifications route

- `app/notifications.tsx`
  - Pulls items from `user_notifications`
  - Supports mark-one and mark-all as read
  - Navigates to recipe detail using source-aware params

## Service Layer

### `src/services/recipeSocialService.ts`

Key responsibilities:
- Determine current user and recipe ownership
- Fetch social snapshot counters (`likesCount`, `dislikesCount`, `commentsCount`, `viewerReaction`)
- Toggle recipe reactions with unique user-source-recipe key
- Fetch comment tree with profile metadata and per-comment like info
- CRUD comment operations
- Toggle comment likes
- Provide lightweight batched public counters used in cards

Important behavior:
- Dislikes are only surfaced to recipe owners.
- Reactions are source-aware (`master` or `ai`).
- Comment trees are assembled in client memory from flat rows.

### `src/services/interactionNotificationService.ts`

Bridge behavior:
- Initial hydrate from `user_notifications` on startup/session refresh
- Realtime listener per user (`INSERT` + `UPDATE`)
- Store update via `useInteractionNotificationStore`
- Optional local push scheduling when app is backgrounded (non-Expo-Go)
- Notification-tap deep link routing to recipe detail

### `src/store/interactionNotificationStore.ts`

State model:
- `items: InteractionNotification[]`
- `unreadCount: number`
- actions: `setItems`, `prependItem`, `markRead`, `markAllRead`, `clear`

Store details:
- hard cap of 120 items in memory when prepending
- unread count is derived from current item list

## Database Model and Triggers

Primary migration files:
- `supabase/migrations/20260317_recipe_social_features.sql`
- `supabase/migrations/20260317_social_interaction_notifications.sql`

### Tables used

- `recipe_reactions`
- `recipe_comments`
- `comment_likes`
- `user_notifications`

### Notification triggers

- `trg_notify_on_recipe_reaction`
  - enqueues `recipe_liked` or `recipe_disliked`
- `trg_notify_on_recipe_comment`
  - enqueues `recipe_commented` or `comment_replied`
- `trg_notify_on_comment_like`
  - enqueues `comment_liked`

### Safety controls

- dedupe constraint: unique `(user_id, actor_id, type, recipe_id, comment_id)`
- anti-spam guard: skips repeated events within 10 seconds
- skip self-notifications (actor == recipient)

### Public profile discovery policy

From `20260317_public_user_profiles_select.sql`:
- creates policy `public profile read` on `user_profiles`
- grants `SELECT` to `anon` and `authenticated`

This enables public browse pages to show creator metadata.

## Deep Link Behavior

Recipe-focused links use:
- `mealmitra://recipe/<recipe_id>?source=master`
- `mealmitra://recipe/<recipe_id>?source=ai`

Handled in `app/_layout.tsx` and routed to `app/recipe/[id].tsx`.

## Operational Notes

- Realtime listeners are started on app mount and on auth refresh.
- Listener teardown runs on sign-out and root layout unmount.
- If initial notification hydration fails, UI still remains functional and realtime can continue.
- Local notification scheduling is skipped in Expo Go builds.
