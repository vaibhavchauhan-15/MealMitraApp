// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

type AllowedAction = 'change_email' | 'change_username' | 'change_password';

const allowedActions = new Set<AllowedAction>(['change_email', 'change_username', 'change_password']);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function randomCode() {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(value).padStart(6, '0');
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getFunctionsBaseUrl(supabaseUrl: string) {
  try {
    const host = new URL(supabaseUrl).host;
    const projectRef = host.split('.')[0];
    if (!projectRef) return '';
    return `https://${projectRef}.functions.supabase.co`;
  } catch {
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const functionsBaseUrl = getFunctionsBaseUrl(supabaseUrl);

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !functionsBaseUrl) {
    return json(500, { error: 'Server not configured' });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing auth token' });
  }

  let action: AllowedAction;
  try {
    const body = (await req.json()) as { action?: AllowedAction };
    if (!body?.action || !allowedActions.has(body.action)) {
      return json(400, { error: 'Invalid action' });
    }
    action = body.action;
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
  const { data: profile, error: profileErr } = await serviceClient
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr || !profile?.email) {
    return json(400, { error: 'Registered email not found' });
  }

  const email = String(profile.email).trim().toLowerCase();

  const { data: existingOtp } = await serviceClient
    .from('account_action_otps')
    .select('last_sent_at')
    .eq('user_id', userId)
    .eq('action', action)
    .maybeSingle();

  const lastSentMs = existingOtp?.last_sent_at ? new Date(String(existingOtp.last_sent_at)).getTime() : 0;
  if (lastSentMs && Date.now() - lastSentMs < 30_000) {
    return json(429, { error: 'Please wait 30 seconds before requesting a new code.' });
  }

  const code = randomCode();
  const otpHash = await sha256(`${userId}:${action}:${code}`);

  const { error: upsertErr } = await serviceClient
    .from('account_action_otps')
    .upsert(
      {
        user_id: userId,
        action,
        email,
        otp_hash: otpHash,
        attempt_count: 0,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        consumed_at: null,
        last_sent_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,action' }
    );

  if (upsertErr) {
    return json(500, { error: 'Could not create verification challenge' });
  }

  const mailResp = await fetch(`${functionsBaseUrl}/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      otp: code,
    }),
  });

  if (!mailResp.ok) {
    return json(502, { error: 'Failed to send verification code email' });
  }

  return json(200, { ok: true });
});
