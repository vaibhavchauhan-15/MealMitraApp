import { invokeOtpFunction } from './otpFunctionInvoker';

const OTP_CODE_REGEX = /^\d{6}$/;

export type CompleteSignupPayload = {
  email: string;
  code: string;
  password: string;
  name: string;
  username: string;
  avatarIcon: string;
};

export function isValidSignupOtpCode(code: string) {
  return OTP_CODE_REGEX.test(code.trim());
}

export async function requestSignupOtp(email: string) {
  return invokeOtpFunction(
    'request-signup-otp',
    { email: email.trim().toLowerCase() },
    'Could not send verification code'
  );
}

export async function completeSignupWithOtp(payload: CompleteSignupPayload) {
  return invokeOtpFunction(
    'complete-signup-with-otp',
    {
      email: payload.email.trim().toLowerCase(),
      code: payload.code.trim(),
      password: payload.password,
      name: payload.name.trim(),
      username: payload.username.trim(),
      avatarIcon: payload.avatarIcon,
    },
    'Could not complete signup'
  );
}
