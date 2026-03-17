import { supabase } from './supabase';

export type AccountOtpAction = 'change_email' | 'change_username' | 'change_password';

const OTP_CODE_REGEX = /^\d{6}$/;

export function isValidAccountOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

function normalizeFunctionError(err: unknown, fallback: string) {
  if (!err || typeof err !== 'object') return fallback;
  const maybeMessage = (err as { message?: string }).message;
  if (maybeMessage && maybeMessage.trim()) return maybeMessage;
  return fallback;
}

export async function sendAccountActionOtp(action: AccountOtpAction) {
  const { data, error } = await supabase.functions.invoke('send-account-otp', {
    body: { action },
  });

  if (error) {
    return { data: null, error: { message: normalizeFunctionError(error, 'Could not send verification code') } };
  }

  return { data, error: null };
}

export async function verifyAccountActionOtp(action: AccountOtpAction, code: string) {
  const { data, error } = await supabase.functions.invoke('verify-account-otp', {
    body: { action, code: code.trim() },
  });

  if (error) {
    return { data: null, error: { message: normalizeFunctionError(error, 'Invalid verification code') } };
  }

  return { data, error: null };
}
