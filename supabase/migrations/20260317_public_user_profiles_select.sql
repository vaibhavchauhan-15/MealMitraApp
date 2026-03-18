-- Allow public profile discovery for browse/search screens.
-- Keep write access restricted to owner policy.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'public profile read'
  ) THEN
    CREATE POLICY "public profile read"
      ON public.user_profiles
      FOR SELECT
      USING (true);
  END IF;
END $$;

GRANT SELECT ON TABLE public.user_profiles TO anon, authenticated;
