import { supabase } from './supabase';

type FunctionErrorResult = {
  message: string;
};

const OTP_CODE_REGEX = /^\d{6}$/;

function normalizeFunctionError(err: unknown, fallback: string) {
  if (!err || typeof err !== 'object') return fallback;
  const maybeMessage = (err as { message?: string }).message;
  if (maybeMessage && maybeMessage.trim()) return maybeMessage;
  return fallback;
}

export function generateSixDigitOtp() {
  const value = Math.floor(Math.random() * 1000000);
  return String(value).padStart(6, '0');
}

export function isValidSendOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function sendOtpEmail(email: string, otp: string, purpose = 'generic') {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      purpose: purpose.trim().toLowerCase(),
    },
  });

  if (error) {
    const normalizedError: FunctionErrorResult = {
      message: normalizeFunctionError(error, 'Could not send OTP email'),
    };
    return { data: null, error: normalizedError };
  }

  return { data, error: null };
}