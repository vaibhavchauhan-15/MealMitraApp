# MealMitra Notification System V2

Date: 2026-03-18
Scope: Instagram-like interaction notifications for social activity at production scale.

## 1) Updated Architecture

### Client layers
- Global store: persisted notification state with unread counts, cursor pagination state, batching-friendly actions.
- Bridge service: Supabase realtime subscription + event buffering + deep-link and push response handling.
- UI layer:
  - Global floating bell (cross-screen badge + animation)
  - Notifications feed screen (grouped list, swipe/read, infinite scroll)
  - Foreground in-app toast for incoming activity

### Server layers
- Existing notification triggers continue writing to public.user_notifications.
- New push token table stores active Expo tokens by user.
- New push dispatcher function fans out Expo push payloads.
- Optional DB trigger can call push dispatcher asynchronously after notification insert.

### Data flow
1. DB trigger writes row to public.user_notifications.
2. Realtime INSERT reaches client channel.
3. Client buffers events for 200ms and prepends in one batch.
4. Store updates unread count and animation sequence.
5. Global bell badge and notifications feed update without full refetch.
6. If configured, server dispatches Expo push for background/closed app states.

## 2) Optimized Store Design

Store file: src/store/interactionNotificationStore.ts

Key capabilities:
- Persisted cache via Zustand persist + AsyncStorage.
- Capped memory window (max 120 items).
- Pagination primitives:
  - nextCursor
  - hasMore
  - loadingMore
- Realtime-friendly actions:
  - prependItemsBatch(items)
  - applyUpdatesBatch(items)
- Read-state actions:
  - markRead(id)
  - markManyRead(ids)
  - markAllRead()
- Badge animation hooks:
  - incomingSequence
  - latestIncoming

Rerender strategy:
- UI uses slice selectors (unreadCount/items/etc.) instead of reading whole state object.
- Batch actions avoid N state updates for burst events.

## 3) Notification UI Components

### Global icon + badge
- File: src/components/notifications/GlobalNotificationBell.tsx
- Always mounted from root layout.
- Behavior:
  - Bounce scale on unread increment.
  - Fade+shrink when unread becomes zero.
  - Pulse ring on incoming notification event.
- Tap navigates to /notifications.

### Notifications feed
- File: app/notifications.tsx
- Instagram-style row composition:
  - actor avatar
  - message
  - relative timestamp
  - recipe thumbnail (if present)
  - unread dot
- Grouped rendering by:
  - type
  - recipe_id
  - 5-minute window
- Group message examples:
  - "A, B and 3 others liked your recipe."

### Loading state
- File: src/components/notifications/NotificationSkeletonList.tsx
- Lightweight shimmer placeholders shown during first network fetch.

## 4) Pagination Logic

Service file: src/services/interactionNotificationService.ts

Implemented cursor pagination:
- fetchInteractionNotificationsPage({ limit, cursor })
- Default page size: 20
- Stable ordering:
  - order by created_at desc
  - tie-break by id desc
- Cursor filter:
  - created_at < cursor.createdAt
  - OR same created_at and id < cursor.id

Feed behavior:
- FlatList onEndReached loads next page.
- Dedup enforced by store normalize pass.
- Virtualization enabled:
  - removeClippedSubviews
  - windowSize
  - maxToRenderPerBatch
  - updateCellsBatchingPeriod

## 5) Realtime + Animation Implementation

### Realtime batching
- INSERT and UPDATE events are queued and flushed every 200ms.
- Flush pipeline:
  - dedupe by id
  - enrich metadata (avatar + recipe thumbnail)
  - prepend/update in one store action

### Item interactions
- New item entry animation: fade + slide-up.
- Press micro interaction: scale to 0.96, spring back.
- Swipe left to mark read with haptic feedback.

### Foreground UX
- Root layout shows in-app toast for incoming activity.
- Notification response listener marks tapped notification as read and routes to deep link.

## 6) Push Notification Integration

Client:
- Registers Expo push token for logged-in user.
- Upserts token into public.user_push_tokens.

Server additions:
- Migration: supabase/migrations/20260318_notification_push_tokens.sql
- Edge function: supabase/functions/send-notification-push/index.ts
- Function config: supabase/config.toml
- DB queue + enqueue trigger migration:
  - supabase/migrations/20260318_notification_push_dispatch_trigger.sql
- Worker mode in edge function:
  - POST body: { "mode": "drain-queue", "limit": 50, "workerId": "cron" }

Closed/background deep link payload:
- mealmitra://recipe/:id?source=master|ai

Deduplication strategy:
- Existing DB unique_notification_dedupe constraint remains primary dedupe control.
- Client side still dedupes by notification id before rendering.

## 7) Performance Improvements

- Store updates are batched and deduped.
- Virtualized FlatList tuned for feed workloads.
- Rendering uses memoized row component.
- Notification cache boots instantly from local storage.
- Feed avoids full refetch for realtime inserts/updates.

## 8) Edge Cases Handled

- Duplicate realtime deliveries for same id.
- Empty actor/profile metadata.
- Missing recipe thumbnail.
- Rapid burst events (buffered flush).
- Read state from push tap while app resumes.
- Offline app start with cached notifications.
- App open while notifications continue in background.

## 9) Test Matrix

Manual validation checklist:

1. Like notification realtime
- Action: User B likes User A recipe.
- Expect: A sees new row instantly on top, unread +1, bell bounce/pulse.

2. Comment grouping
- Action: Multiple users comment same recipe within 5 minutes.
- Expect: Feed shows grouped message, grouped unread behavior works.

3. Swipe read
- Action: Swipe unread notification left.
- Expect: Haptic fires, unread decrements, row becomes read.

4. Mark all
- Action: Tap Mark all.
- Expect: All rows read, unread=0, badge fades out.

5. Infinite scroll
- Action: Scroll to bottom repeatedly.
- Expect: loads in pages of 20, no duplicates, no jumpy re-renders.

6. Foreground toast
- Action: Receive new notification while app active.
- Expect: In-app toast shown with message, no crash.

7. Background push
- Action: App in background, new DB notification created.
- Expect: push appears (requires push dispatch config + valid token).

8. Closed app push deep-link
- Action: tap notification when app closed.
- Expect: app opens recipe route and source param is correct.

9. Offline boot
- Action: launch app without network.
- Expect: cached notifications visible; network sync resumes later.

## 10) Deployment Notes

Required setup for full push pipeline:
- Deploy migrations:
  - 20260318_notification_push_tokens.sql
  - 20260318_notification_push_dispatch_trigger.sql
- Deploy edge function:
  - send-notification-push
- Set secret for function auth:
  - PUSH_DISPATCH_SECRET
- Configure a scheduler/worker to invoke send-notification-push in queue-drain mode.
- Recommended cadence: every 10-30 seconds with a bounded limit (for example, 50-100 jobs).

Queue behavior summary:
- Notification insert only enqueues payload (non-blocking).
- Worker claims pending jobs in bounded batches.
- Failures retry with exponential backoff up to max attempts, then move to dead.
