// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

type PushRequest = {
  mode?: 'single' | 'drain-queue';
  limit?: number;
  workerId?: string;
  userId: string;
  title?: string;
  body: string;
  deepLink?: string | null;
  notificationId?: string | null;
};

type QueueJob = {
  id: string;
  user_id: string;
  payload: {
    userId?: string;
    title?: string;
    body?: string;
    deepLink?: string | null;
    notificationId?: string | null;
  };
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidExpoToken(value: string): boolean {
  return /^ExponentPushToken\[[^\]]+\]$/.test(value) || /^ExpoPushToken\[[^\]]+\]$/.test(value);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function postExpoMessages(messages: Array<Record<string, unknown>>) {
  const responses: Array<{ status?: string; message?: string; details?: { error?: string } }> = [];

  for (const chunk of chunkArray(messages, 100)) {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!expoResponse.ok) {
      throw new Error(`Expo push API request failed with status ${expoResponse.status}`);
    }

    const expoJson = await expoResponse.json();
    const chunkData = Array.isArray(expoJson?.data) ? expoJson.data : [];
    responses.push(...chunkData);
  }

  return responses;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const dispatchSecret = Deno.env.get('PUSH_DISPATCH_SECRET') ?? '';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: 'Server not configured' });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const providedSecret = req.headers.get('x-push-dispatch-secret') ?? '';

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  let payload: PushRequest;
  try {
    payload = (await req.json()) as PushRequest;
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  const mode = payload?.mode ?? 'single';
  const useSecretAuth = Boolean(dispatchSecret);

  if (useSecretAuth) {
    if (providedSecret !== dispatchSecret) {
      return json(401, { error: 'Unauthorized' });
    }
  } else {
    if (!authHeader.startsWith('Bearer ')) {
      return json(401, { error: 'Missing auth token' });
    }

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await authedClient.auth.getUser();
    if (userErr || !userData.user) {
      return json(401, { error: 'Unauthorized' });
    }

    if (userData.user.id !== payload.userId) {
      return json(403, { error: 'Forbidden' });
    }
  }

  if (mode === 'drain-queue') {
    const limit = Math.min(Math.max(Number(payload?.limit ?? 50), 1), 200);
    const workerId = String(payload?.workerId ?? 'edge-dispatcher');

    const { data: claimedRaw, error: claimErr } = await serviceClient.rpc('claim_push_dispatch_jobs', {
      p_limit: limit,
      p_worker_id: workerId,
    });

    if (claimErr) {
      return json(500, { error: 'Could not claim queue jobs', details: claimErr.message });
    }

    const claimed = (claimedRaw ?? []) as QueueJob[];
    if (!claimed.length) {
      return json(200, { ok: true, mode, claimed: 0, sentJobs: 0, failedJobs: 0, disabledTokens: 0 });
    }

    const userIds = Array.from(new Set(claimed.map((job) => String(job.user_id)).filter(Boolean)));

    const { data: tokenRows, error: tokenErr } = await serviceClient
      .from('user_push_tokens')
      .select('id,user_id,expo_push_token')
      .in('user_id', userIds)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (tokenErr) {
      for (const job of claimed) {
        await serviceClient.rpc('finalize_push_dispatch_job', {
          p_job_id: job.id,
          p_sent: false,
          p_error: `Could not load push tokens: ${tokenErr.message}`,
          p_retry_delay_seconds: 30,
        });
      }
      return json(500, { error: 'Could not load push tokens', claimed: claimed.length });
    }

    const tokensByUser = new Map<string, Array<{ id: string; token: string }>>();
    for (const row of tokenRows ?? []) {
      const userId = String(row.user_id ?? '');
      if (!userId) continue;
      const list = tokensByUser.get(userId) ?? [];
      list.push({ id: String(row.id), token: String(row.expo_push_token ?? '') });
      tokensByUser.set(userId, list);
    }

    const messages: Array<Record<string, unknown>> = [];
    const messageMeta: Array<{ jobId: string; tokenId: string }> = [];
    const rowsToDisable = new Set<string>();
    const jobState = new Map<string, { hasAnyToken: boolean; success: boolean; errors: string[] }>();

    for (const job of claimed) {
      const state = { hasAnyToken: false, success: false, errors: [] as string[] };
      jobState.set(job.id, state);

      const userId = String(job.user_id ?? job.payload?.userId ?? '');
      const body = String(job.payload?.body ?? '');
      if (!userId || !body) {
        state.errors.push('Missing userId or body in queued payload');
        continue;
      }

      const userTokens = tokensByUser.get(userId) ?? [];
      if (!userTokens.length) {
        state.success = true;
        continue;
      }

      for (const tokenRow of userTokens) {
        state.hasAnyToken = true;
        if (!isValidExpoToken(tokenRow.token)) {
          continue;
        }
        messages.push({
          to: tokenRow.token,
          title: job.payload?.title || 'MealMitra',
          body,
          sound: 'default',
          data: {
            deepLink: job.payload?.deepLink || null,
            notificationId: job.payload?.notificationId || null,
          },
        });
        messageMeta.push({ jobId: job.id, tokenId: tokenRow.id });
      }

      if (!state.hasAnyToken) {
        state.success = true;
      }
    }

    if (messages.length) {
      try {
        const expoResults = await postExpoMessages(messages);
        for (let i = 0; i < messageMeta.length; i += 1) {
          const meta = messageMeta[i];
          const result = expoResults[i];
          const state = jobState.get(meta.jobId);
          if (!state) continue;

          if (result?.status === 'ok') {
            state.success = true;
            continue;
          }

          const detailsError = String(result?.details?.error ?? '');
          const message = String(result?.message ?? 'Expo send error');
          if (detailsError === 'DeviceNotRegistered') {
            rowsToDisable.add(meta.tokenId);
          }
          state.errors.push(detailsError || message);
        }
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Expo request failed';
        for (const [, state] of jobState) {
          state.errors.push(errMessage);
        }
      }
    }

    if (rowsToDisable.size) {
      await serviceClient
        .from('user_push_tokens')
        .update({ is_active: false })
        .in('id', Array.from(rowsToDisable));
    }

    let sentJobs = 0;
    let failedJobs = 0;
    for (const job of claimed) {
      const state = jobState.get(job.id) ?? { hasAnyToken: false, success: false, errors: ['Unknown job state'] };
      const sent = state.success;
      const errorText = state.errors.length ? state.errors.join('; ').slice(0, 1000) : null;

      const { error: finalizeErr } = await serviceClient.rpc('finalize_push_dispatch_job', {
        p_job_id: job.id,
        p_sent: sent,
        p_error: sent ? null : errorText,
      });

      if (finalizeErr) {
        failedJobs += 1;
        continue;
      }

      if (sent) sentJobs += 1;
      else failedJobs += 1;
    }

    return json(200, {
      ok: true,
      mode,
      claimed: claimed.length,
      sentJobs,
      failedJobs,
      disabledTokens: rowsToDisable.size,
    });
  }

  if (!payload?.userId || !payload?.body) {
    return json(400, { error: 'userId and body are required' });
  }

  const { data: tokenRows, error: tokenErr } = await serviceClient
    .from('user_push_tokens')
    .select('id,expo_push_token')
    .eq('user_id', payload.userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (tokenErr) {
    return json(500, { error: 'Could not load push tokens' });
  }

  const tokens = (tokenRows ?? [])
    .map((row) => String(row.expo_push_token ?? ''))
    .filter((token) => token.length > 0);

  if (!tokens.length) {
    return json(200, { ok: true, sent: 0, reason: 'No active tokens' });
  }

  const messages = tokens
    .filter(isValidExpoToken)
    .map((to) => ({
      to,
      title: payload.title || 'MealMitra',
      body: payload.body,
      sound: 'default',
      data: {
        deepLink: payload.deepLink || null,
        notificationId: payload.notificationId || null,
      },
    }));

  if (!messages.length) {
    return json(200, { ok: true, sent: 0, reason: 'No valid Expo tokens' });
  }

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!expoResponse.ok) {
    return json(502, { error: 'Expo push API request failed' });
  }

  const expoJson = await expoResponse.json();
  const rowsToDisable: string[] = [];

  for (let i = 0; i < (expoJson?.data?.length ?? 0); i += 1) {
    const entry = expoJson.data[i];
    if (entry?.status !== 'error') continue;
    const detailsError = String(entry?.details?.error ?? '');
    if (detailsError === 'DeviceNotRegistered') {
      const row = tokenRows?.[i];
      if (row?.id) rowsToDisable.push(String(row.id));
    }
  }

  if (rowsToDisable.length) {
    await serviceClient
      .from('user_push_tokens')
      .update({ is_active: false })
      .in('id', rowsToDisable);
  }

  return json(200, {
    ok: true,
    sent: messages.length,
    disabledTokens: rowsToDisable.length,
    expo: expoJson,
  });
});
