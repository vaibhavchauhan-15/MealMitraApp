import { supabase } from './supabase';

type FunctionErrorResult = {
  message: string;
};

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function normalizeFunctionError(err: unknown, fallback: string) {
  if (!err || typeof err !== 'object') return fallback;

  const maybeErr = err as {
    message?: string;
    context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
  };

  try {
    const contextBody = await maybeErr.context?.json?.();
    if (contextBody && typeof contextBody === 'object') {
      const asRecord = contextBody as Record<string, unknown>;
      const nestedError = asRecord.error;
      if (typeof nestedError === 'string' && nestedError.trim()) {
        return nestedError;
      }
      if (nestedError && typeof nestedError === 'object') {
        const nestedMessage = (nestedError as { message?: string }).message;
        if (nestedMessage && nestedMessage.trim()) {
          return nestedMessage;
        }
      }
      const topLevelMessage = asRecord.message;
      if (typeof topLevelMessage === 'string' && topLevelMessage.trim()) {
        return topLevelMessage;
      }
    }
  } catch {
    // Ignore JSON parse failure and try plain text or SDK message.
  }

  try {
    const contextText = await maybeErr.context?.text?.();
    if (contextText && contextText.trim()) {
      return contextText;
    }
  } catch {
    // Ignore response text extraction failure.
  }

  const maybeMessage = maybeErr.message;
  if (maybeMessage && maybeMessage.trim()) return maybeMessage;
  return fallback;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    }),
  ]);
}

function isRetriableMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('timeout') ||
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('temporar') ||
    lower.includes('fetch') ||
    lower.includes('gateway') ||
    lower.includes('service unavailable') ||
    lower.includes('5')
  );
}

function toUserMessage(rawMessage: string) {
  const msg = rawMessage.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('30 seconds') || lower.includes('too many')) {
    return 'Rate limit reached. Please wait before requesting another code.';
  }

  if (lower.includes('timeout') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network issue while contacting server. Please check internet and try again.';
  }

  if (lower.includes('missing auth token') || lower.includes('unauthorized')) {
    return 'Session expired. Please log in again and retry.';
  }

  return msg;
}

export async function invokeOtpFunction(
  functionName: string,
  body: Record<string, unknown>,
  fallbackMessage: string
): Promise<{ data: unknown; error: null } | { data: null; error: FunctionErrorResult }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const result = await withTimeout(
        supabase.functions.invoke(functionName, {
          body,
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }),
        REQUEST_TIMEOUT_MS
      );

      if (!result.error) {
        return { data: result.data, error: null };
      }

      const rawMessage = await normalizeFunctionError(result.error, fallbackMessage);
      const canRetry = isRetriableMessage(rawMessage) && attempt < MAX_RETRIES;

      if (canRetry) {
        await sleep(350 * (attempt + 1));
        continue;
      }

      return {
        data: null,
        error: { message: toUserMessage(rawMessage) },
      };
    } catch (error) {
      const rawMessage = await normalizeFunctionError(error, fallbackMessage);
      const canRetry = isRetriableMessage(rawMessage) && attempt < MAX_RETRIES;

      if (canRetry) {
        await sleep(350 * (attempt + 1));
        continue;
      }

      return {
        data: null,
        error: { message: toUserMessage(rawMessage) },
      };
    }
  }

  return {
    data: null,
    error: { message: fallbackMessage },
  };
}