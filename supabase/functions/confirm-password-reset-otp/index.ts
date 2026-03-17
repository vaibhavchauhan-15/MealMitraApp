// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';
import { compare } from 'npm:bcryptjs@2.4.3';

const OTP_CODE_REGEX = /^\d{6}$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyOtp(code: string, storedHash: string, legacySalt: string) {
  if (storedHash.startsWith('$2')) {
    return compare(code, storedHash);
  }

  // Keep legacy support during rolling deployments where older hashes may still exist.
  const legacyHash = await sha256(legacySalt);
  return legacyHash === storedHash;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Server not configured' });
  }

  let email = '';
  let code = '';
  let newPassword = '';

  try {
    const body = (await req.json()) as { email?: string; code?: string; newPassword?: string };
    email = String(body.email ?? '').trim().toLowerCase();
    code = String(body.code ?? '').trim();
    newPassword = String(body.newPassword ?? '');
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (!email || !OTP_CODE_REGEX.test(code)) {
    return json(400, { error: 'Invalid verification code' });
  }

  if (newPassword.trim().length < 8) {
    return json(400, { error: 'Password must be at least 8 characters' });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile?.id) {
    return json(400, { error: 'Invalid verification request' });
  }

  const userId = String(profile.id);
  const { data: row, error: rowErr } = await serviceClient
    .from('password_reset_otps')
    .select('otp_hash,expires_at,attempt_count,consumed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (rowErr || !row || row.consumed_at) {
    return json(400, { error: 'No active verification code. Please request a new one.' });
  }

  const expiresAtMs = new Date(String(row.expires_at)).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
    await serviceClient
      .from('password_reset_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId);
    return json(400, { error: 'Verification code expired. Please request a new one.' });
  }

  const expectedHash = String(row.otp_hash);
  const isValid = await verifyOtp(code, expectedHash, `${userId}:reset_password:${code}`);

  if (!isValid) {
    const nextAttempts = Number(row.attempt_count ?? 0) + 1;
    const consumeNow = nextAttempts >= 5 ? new Date().toISOString() : null;

    await serviceClient
      .from('password_reset_otps')
      .update({ attempt_count: nextAttempts, consumed_at: consumeNow })
      .eq('user_id', userId);

    return json(
      400,
      { error: nextAttempts >= 5 ? 'Too many failed attempts. Request a new code.' : 'Invalid verification code' }
    );
  }

  const { error: passwordErr } = await serviceClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (passwordErr) {
    return json(500, { error: 'Could not update password. Please try again.' });
  }

  await serviceClient
    .from('password_reset_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId);

  return json(200, { ok: true, passwordReset: true });
});
