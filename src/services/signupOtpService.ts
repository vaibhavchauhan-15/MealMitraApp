import { supabase } from './supabase';

const OTP_CODE_REGEX = /^\d{6}$/;

type FunctionErrorResult = {
  message: string;
};

export type CompleteSignupPayload = {
  email: string;
  code: string;
  password: string;
  name: string;
  username: string;
  avatarIcon: string;
};

function normalizeFunctionError(err: unknown, fallback: string) {
  if (!err || typeof err !== 'object') return fallback;
  const maybeMessage = (err as { message?: string }).message;
  if (maybeMessage && maybeMessage.trim()) return maybeMessage;
  return fallback;
}

export function isValidSignupOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function requestSignupOtp(email: string) {
  const { data, error } = await supabase.functions.invoke('request-signup-otp', {
    body: { email: email.trim().toLowerCase() },
  });

  if (error) {
    return {
      data: null,
      error: { message: normalizeFunctionError(error, 'Could not send verification code') } as FunctionErrorResult,
    };
  }

  return { data, error: null };
}

export async function completeSignupWithOtp(payload: CompleteSignupPayload) {
  const { data, error } = await supabase.functions.invoke('complete-signup-with-otp', {
    body: {
      email: payload.email.trim().toLowerCase(),
      code: payload.code.trim(),
      password: payload.password,
      name: payload.name.trim(),
      username: payload.username.trim(),
      avatarIcon: payload.avatarIcon,
    },
  });

  if (error) {
    return {
      data: null,
      error: { message: normalizeFunctionError(error, 'Could not complete signup') } as FunctionErrorResult,
    };
  }

  return { data, error: null };
}
