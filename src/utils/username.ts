import type { SupabaseClient } from '@supabase/supabase-js';

const USERNAME_MIN_LEN = 3;
const USERNAME_MAX_LEN = 20;

export function normalizeUsernameInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, USERNAME_MAX_LEN);
}

export function isUsernameFormatValid(raw: string): boolean {
  return /^[a-z][a-z0-9_]{2,19}$/.test(raw);
}

export async function checkUsernameAvailability(
  supabase: SupabaseClient,
  username: string,
  options?: { userId?: string }
): Promise<boolean> {
  const normalized = normalizeUsernameInput(username);
  if (!isUsernameFormatValid(normalized)) return false;

  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: normalized,
    p_user_id: options?.userId ?? null,
  });

  if (error) return false;
  return data === true;
}

function baseFromNameOrEmail(name?: string, email?: string): string {
  const fromName = normalizeUsernameInput(name ?? '');
  if (fromName.length >= USERNAME_MIN_LEN) return fromName;

  const emailLocal = (email ?? '').split('@')[0] ?? '';
  const fromEmail = normalizeUsernameInput(emailLocal);
  if (fromEmail.length >= USERNAME_MIN_LEN) return fromEmail;

  return 'foodie';
}

export async function suggestUniqueUsername(
  supabase: SupabaseClient,
  preferred: string,
  options?: { userId?: string; name?: string; email?: string }
): Promise<string> {
  const sanitizedPreferred = normalizeUsernameInput(preferred);
  const base = sanitizedPreferred.length >= USERNAME_MIN_LEN
    ? sanitizedPreferred
    : baseFromNameOrEmail(options?.name, options?.email);

  const maxBaseLength = USERNAME_MAX_LEN - 3;
  const trimmedBase = base.slice(0, Math.max(USERNAME_MIN_LEN, maxBaseLength));

  for (let i = 0; i < 30; i += 1) {
    const suffix = i === 0 ? '' : String(Math.floor(100 + Math.random() * 900));
    const candidate = `${trimmedBase}${suffix}`.slice(0, USERNAME_MAX_LEN);

    const { data, error } = await supabase.rpc('is_username_available', {
      p_username: candidate,
      p_user_id: options?.userId ?? null,
    });

    if (!error && data === true) {
      return candidate;
    }
  }

  const fallbackSuffix = Date.now().toString().slice(-4);
  return `${trimmedBase.slice(0, USERNAME_MAX_LEN - 4)}${fallbackSuffix}`;
}
