-- Add usernames + profile icon support and helper RPCs for auth flows.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS avatar_icon TEXT;

-- Normalize legacy rows that may have blank usernames.
UPDATE public.user_profiles
SET username = NULL
WHERE username IS NOT NULL AND btrim(username) = '';

-- Username format: lowercase letters, numbers, underscore; 3-20 chars, start with letter.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_username_format_check'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_username_format_check
      CHECK (
        username IS NULL
        OR username ~ '^[a-z][a-z0-9_]{2,19}$'
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_unique
  ON public.user_profiles ((lower(username)))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_username(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(coalesce(input_text, '')), '[^a-z0-9_]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.is_username_available(
  p_username TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname TEXT := public.normalize_username(p_username);
BEGIN
  IF uname = '' OR length(uname) < 3 OR length(uname) > 20 OR uname !~ '^[a-z]' THEN
    RETURN FALSE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE lower(up.username) = uname
      AND (p_user_id IS NULL OR up.id <> p_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_email(
  p_identifier TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ident TEXT := lower(btrim(coalesce(p_identifier, '')));
  uname TEXT;
  resolved_email TEXT;
BEGIN
  IF ident = '' THEN
    RETURN NULL;
  END IF;

  IF ident ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN ident;
  END IF;

  uname := public.normalize_username(ident);

  SELECT up.email
  INTO resolved_email
  FROM public.user_profiles up
  WHERE lower(up.username) = uname
  LIMIT 1;

  RETURN resolved_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;
