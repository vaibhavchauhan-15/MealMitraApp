// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Server not configured' });
  }

  let email = '';
  let code = '';
  let password = '';
  let name = '';
  let username = '';
  let avatarIcon = '';

  try {
    const body = (await req.json()) as {
      email?: string;
      code?: string;
      password?: string;
      name?: string;
      username?: string;
      avatarIcon?: string;
    };

    email = String(body.email ?? '').trim().toLowerCase();
    code = String(body.code ?? '').trim();
    password = String(body.password ?? '').trim();
    name = String(body.name ?? '').trim();
    username = String(body.username ?? '').trim();
    avatarIcon = String(body.avatarIcon ?? '').trim();
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (!email || !OTP_CODE_REGEX.test(code)) {
    return json(400, { error: 'Invalid verification code' });
  }

  if (!password || password.length < 8 || !name || !username || !avatarIcon) {
    return json(400, { error: 'Missing required signup fields' });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: row, error: rowErr } = await serviceClient
    .from('signup_otps')
    .select('otp_hash,expires_at,attempt_count,consumed_at')
    .eq('email', email)
    .maybeSingle();

  if (rowErr || !row || row.consumed_at) {
    return json(400, { error: 'No active verification code. Please request a new one.' });
  }

  const expiresAtMs = new Date(String(row.expires_at)).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
    await serviceClient
      .from('signup_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email);
    return json(400, { error: 'Verification code expired. Please request a new one.' });
  }

  const expectedHash = String(row.otp_hash);
  const codeHash = await sha256(`${email}:signup:${code}`);

  if (expectedHash !== codeHash) {
    const nextAttempts = Number(row.attempt_count ?? 0) + 1;
    const consumeNow = nextAttempts >= 5 ? new Date().toISOString() : null;

    await serviceClient
      .from('signup_otps')
      .update({ attempt_count: nextAttempts, consumed_at: consumeNow })
      .eq('email', email);

    return json(
      400,
      { error: nextAttempts >= 5 ? 'Too many failed attempts. Request a new code.' : 'Invalid verification code' }
    );
  }

  const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      username,
      avatar_icon: avatarIcon,
    },
  });

  if (createErr) {
    const message = String(createErr.message ?? '').toLowerCase();
    if (message.includes('already')) {
      return json(409, { error: 'An account with this email already exists.' });
    }
    return json(500, { error: 'Could not complete signup. Please try again.' });
  }

  await serviceClient
    .from('signup_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('email', email);

  return json(200, { ok: true, userId: created.user?.id ?? null });
});
