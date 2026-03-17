import { supabase } from './supabase';

const OTP_CODE_REGEX = /^\d{6}$/;

export function isValidOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function sendEmailOtpCode(email: string) {
  return supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
    },
  });
}

export async function verifyEmailOtpCode(email: string, code: string) {
  return supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: 'email',
  });
}
