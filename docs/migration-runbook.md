# Migration Runbook

This runbook is for applying current Supabase migrations safely for the latest app features.

## Pre-Checks

1. Ensure project points to correct Supabase instance.
2. Backup data if applying to non-development environment.
3. Apply migrations in ascending filename order.
4. Validate RLS and trigger objects after migration.

## Recommended Order

Apply these from `supabase/migrations/`:

1. `20260312_v3_reset.sql`
2. `20260312_add_recipe_slug.sql`
3. `20260313_user_ai_recipes.sql`
4. `20260313_ai_recipe_reference_fix.sql`
5. `20260313_master_recipes_nutrition_defaults.sql`
6. `20260313_recent_searches_user_profiles.sql`
7. `20260313_recently_viewed_user_profiles.sql`
8. `20260314_diet_planner_system.sql`
9. `20260314_diet_planner_fk_hotfix.sql`
10. `20260316_master_recipe_batch_match_rpc.sql`
11. `20260316_plan_meals_ordered_pagination_rpc.sql`
12. `20260316_usernames_profile_icons.sql`
13. `20260317_public_user_profiles_select.sql`
14. `20260317_recipe_social_features.sql`
15. `20260317_social_interaction_notifications.sql`
16. `20260317_signup_otps.sql`
17. `20260317_account_action_otps.sql`
18. `20260317_password_reset_otps.sql`
19. `20260317_otp_hourly_resend_limit.sql`
20. `20260317_otp_last_sent_rate_limit.sql`
21. `canonical_inredients.sql`

## Notes on Social Notification Migrations

Both of these files currently exist:
- `20260317_recipe_social_features.sql`
- `20260317_social_interaction_notifications.sql`

They overlap heavily in object creation for `user_notifications` and social triggers.
Most statements are idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, trigger drops before create), but you should still validate final trigger definitions after apply.

## Post-Migration Verification Checklist

Run checks for:
- tables: `diet_plans`, `diet_plan_meals`, `user_notifications`
- tables: `recipe_reactions`, `recipe_comments`, `comment_likes`
- policies on `user_profiles` include public select policy
- triggers:
  - `trg_notify_on_recipe_reaction`
  - `trg_notify_on_recipe_comment`
  - `trg_notify_on_comment_like`

## Smoke Tests

1. Sign up or log in.
2. Open Home and verify recipe feeds load.
3. Open any recipe and add a like/comment.
4. Open another user account and confirm notification row appears.
5. Open Notifications screen and mark as read.
6. Browse public users and open a public profile.
7. Open public AI plan and add it to planner.

## Troubleshooting

- If public user browse is empty, verify policy from `20260317_public_user_profiles_select.sql` exists.
- If notifications do not arrive, verify trigger functions and realtime subscription.
- If planner insertion fails on AI/master source refs, re-check `20260313_ai_recipe_reference_fix.sql` and `20260314_diet_planner_fk_hotfix.sql`.
