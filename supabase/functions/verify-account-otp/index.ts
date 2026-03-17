// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

type AllowedAction = 'change_email' | 'change_username' | 'change_password';

const allowedActions = new Set<AllowedAction>(['change_email', 'change_username', 'change_password']);
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: 'Server not configured' });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing auth token' });
  }

  let action: AllowedAction;
  let code = '';
  try {
    const body = (await req.json()) as { action?: AllowedAction; code?: string };
    if (!body?.action || !allowedActions.has(body.action)) {
      return json(400, { error: 'Invalid action' });
    }
    if (!body.code || !OTP_CODE_REGEX.test(body.code.trim())) {
      return json(400, { error: 'Invalid verification code' });
    }
    action = body.action;
    code = body.code.trim();
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  const authedClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData.user) {
    return json(401, { error: 'Unauthorized' });
  }

  const userId = userData.user.id;
  const { data: row, error: rowErr } = await serviceClient
    .from('account_action_otps')
    .select('otp_hash,expires_at,attempt_count,consumed_at')
    .eq('user_id', userId)
    .eq('action', action)
    .maybeSingle();

  if (rowErr || !row || row.consumed_at) {
    return json(400, { error: 'No active verification code. Please request a new one.' });
  }

  const expiresAtMs = new Date(String(row.expires_at)).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
    await serviceClient
      .from('account_action_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('action', action);
    return json(400, { error: 'Verification code expired. Please request a new one.' });
  }

  const expectedHash = String(row.otp_hash);
  const codeHash = await sha256(`${userId}:${action}:${code}`);
  if (expectedHash !== codeHash) {
    const nextAttempts = Number(row.attempt_count ?? 0) + 1;
    const consumeNow = nextAttempts >= 5 ? new Date().toISOString() : null;
    await serviceClient
      .from('account_action_otps')
      .update({ attempt_count: nextAttempts, consumed_at: consumeNow })
      .eq('user_id', userId)
      .eq('action', action);
    return json(400, { error: nextAttempts >= 5 ? 'Too many failed attempts. Request a new code.' : 'Invalid verification code' });
  }

  const { error: consumeErr } = await serviceClient
    .from('account_action_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('action', action);

  if (consumeErr) {
    return json(500, { error: 'Verification failed. Please try again.' });
  }

  return json(200, { ok: true, verified: true });
});
