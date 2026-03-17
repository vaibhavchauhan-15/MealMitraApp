import { supabase } from './supabase';

const OTP_CODE_REGEX = /^\d{6}$/;

type FunctionErrorResult = {
  message: string;
};

function normalizeFunctionError(err: unknown, fallback: string) {
  if (!err || typeof err !== 'object') return fallback;
  const maybeMessage = (err as { message?: string }).message;
  if (maybeMessage && maybeMessage.trim()) return maybeMessage;
  return fallback;
}

export function isValidPasswordResetOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function requestPasswordResetOtp(email: string) {
  const { data, error } = await supabase.functions.invoke('request-password-reset-otp', {
    body: { email: email.trim().toLowerCase() },
  });

  if (error) {
    const normalizedError: FunctionErrorResult = {
      message: normalizeFunctionError(error, 'Could not send verification code'),
    };
    return { data: null, error: normalizedError };
  }

  return { data, error: null };
}

export async function confirmPasswordResetOtp(email: string, code: string, newPassword: string) {
  const { data, error } = await supabase.functions.invoke('confirm-password-reset-otp', {
    body: {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    },
  });

  if (error) {
    const normalizedError: FunctionErrorResult = {
      message: normalizeFunctionError(error, 'Could not reset password'),
    };
    return { data: null, error: normalizedError };
  }

  return { data, error: null };
}
