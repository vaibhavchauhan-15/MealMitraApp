// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const functionsBaseUrl = getFunctionsBaseUrl(supabaseUrl);

  if (!supabaseUrl || !serviceRoleKey || !functionsBaseUrl) {
    return json(500, { error: 'Server not configured' });
  }

  let email = '';
  try {
    const body = (await req.json()) as { email?: string };
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (!email) {
    return json(400, { error: 'Email is required' });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('id,email')
    .eq('email', email)
    .maybeSingle();

  // Prevent account enumeration: return success even when email is unknown.
  if (!profile?.id) {
    return json(200, { ok: true });
  }

  const userId = String(profile.id);

  const { data: existingOtp } = await serviceClient
    .from('password_reset_otps')
    .select('last_sent_at')
    .eq('user_id', userId)
    .maybeSingle();

  const lastSentMs = existingOtp?.last_sent_at ? new Date(String(existingOtp.last_sent_at)).getTime() : 0;
  if (lastSentMs && Date.now() - lastSentMs < 30_000) {
    return json(429, { error: 'Please wait 30 seconds before requesting a new code.' });
  }

  const code = randomCode();
  const otpHash = await sha256(`${userId}:reset_password:${code}`);

  const { error: upsertErr } = await serviceClient
    .from('password_reset_otps')
    .upsert(
      {
        user_id: userId,
        email,
        otp_hash: otpHash,
        attempt_count: 0,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        consumed_at: null,
        last_sent_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertErr) {
    return json(500, { error: 'Could not create password reset challenge' });
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
