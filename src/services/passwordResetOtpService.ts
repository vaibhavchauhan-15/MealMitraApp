import { invokeOtpFunction } from './otpFunctionInvoker';

const OTP_CODE_REGEX = /^\d{6}$/;

export function isValidPasswordResetOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function requestPasswordResetOtp(email: string) {
  return invokeOtpFunction(
    'request-password-reset-otp',
    { email: email.trim().toLowerCase() },
    'Could not send verification code'
  );
}

export async function confirmPasswordResetOtp(email: string, code: string, newPassword: string) {
  return invokeOtpFunction(
    'confirm-password-reset-otp',
    {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    },
    'Could not reset password'
  );
}
