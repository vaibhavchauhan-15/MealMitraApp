// @ts-nocheck
import { Resend } from "npm:resend";

const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const defaultFrom = "MealMitra Security <noreply@mealmitra.online>";

function resolveFromAddress(rawValue: string | undefined) {
  const input = String(rawValue ?? "").trim();
  if (!input) {
    return defaultFrom;
  }

  // Keep explicit "Name <email@domain.com>" values untouched.
  if (input.includes("<") && input.includes(">")) {
    return input;
  }

  // If only an email is provided, apply the polished display name automatically.
  if (input.includes("@")) {
    return `MealMitra Security <${input}>`;
  }

  return defaultFrom;
}

const resendFrom = resolveFromAddress(Deno.env.get("RESEND_FROM_EMAIL"));
const resend = new Resend(resendApiKey);

type OtpPurpose =
  | "signup"
  | "password_reset"
  | "account_change_email"
  | "account_change_username"
  | "account_change_password"
  | "generic";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizePurpose(value: string): OtpPurpose {
  switch (value) {
    case "signup":
    case "password_reset":
    case "account_change_email":
    case "account_change_username":
    case "account_change_password":
      return value;
    default:
      return "generic";
  }
}

function buildPurposeCopy(purpose: OtpPurpose) {
  switch (purpose) {
    case "signup":
      return {
        heading: "Confirm your account",
        intro: "Use this code to complete your signup.",
        subjectPrefix: "signup",
      };
    case "password_reset":
      return {
        heading: "Reset your password",
        intro: "Use this code to reset your password.",
        subjectPrefix: "password reset",
      };
    case "account_change_email":
      return {
        heading: "Verify email change",
        intro: "Use this code to confirm your email update.",
        subjectPrefix: "email change",
      };
    case "account_change_username":
      return {
        heading: "Verify username change",
        intro: "Use this code to confirm your username update.",
        subjectPrefix: "username change",
      };
    case "account_change_password":
      return {
        heading: "Verify password change",
        intro: "Use this code to confirm your password update.",
        subjectPrefix: "password change",
      };
    default:
      return {
        heading: "Your one-time password",
        intro: "Use this code to continue.",
        subjectPrefix: "verification",
      };
  }
}

function buildOtpEmailTemplate(otp: string, purpose: OtpPurpose) {
  const appName = "MealMitra";
  const validityMinutes = 5;
  const copy = buildPurposeCopy(purpose);
  const brandAccent = "#FF6B00";
  const brandAccentLight = "#FFF3E9";
  const brandAccentDarkSurface = "#2A1A14";
  const brandAccentDarkBorder = "#5B2A0B";

  return {
    subject: `${appName} ${copy.subjectPrefix} code`,
    text: `Your ${appName} ${copy.subjectPrefix} code is ${otp}. It is valid for ${validityMinutes} minutes. If you did not request this, you can ignore this email.`,
    html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${appName} ${copy.subjectPrefix} code</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .mm-body { background-color: #14110f !important; }
        .mm-card { background-color: ${brandAccentDarkSurface} !important; border-color: ${brandAccentDarkBorder} !important; }
        .mm-header { background-color: ${brandAccent} !important; }
        .mm-heading { color: #fff3e7 !important; }
        .mm-text { color: #ffd9bd !important; }
        .mm-code-wrap { background-color: #3a2418 !important; border-color: ${brandAccent} !important; }
        .mm-code { color: #fff3e7 !important; }
        .mm-muted { color: #ffbe91 !important; }
        .mm-footer { border-top-color: ${brandAccentDarkBorder} !important; }
      }
    </style>
  </head>
  <body class="mm-body" style="margin:0;padding:0;background-color:${brandAccentLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your ${copy.subjectPrefix} code is ${otp}. Valid for ${validityMinutes} minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brandAccentLight};padding:24px 12px;">
      <tr>
        <td align="center">
          <table class="mm-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ffd7bf;border-radius:14px;overflow:hidden;">
            <tr>
              <td class="mm-header" style="background:${brandAccent};padding:20px 24px;">
                <p style="margin:0;font-size:18px;font-weight:700;color:#f8fafc;letter-spacing:0.2px;">${appName}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#ffedd5;">Secure account verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 10px;">
                <h1 class="mm-heading" style="margin:0 0 10px;font-size:24px;line-height:1.3;color:#8a3300;">${copy.heading}</h1>
                <p class="mm-text" style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#9f3e0a;">${copy.intro} For your security, it expires in ${validityMinutes} minutes.</p>
                <div class="mm-code-wrap" style="display:inline-block;background:#fff8f3;border:1px dashed ${brandAccent};border-radius:12px;padding:14px 18px;">
                  <span class="mm-code" style="font-size:36px;line-height:1;font-weight:800;letter-spacing:8px;color:#8a3300;font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p class="mm-muted" style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#9f3e0a;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td class="mm-footer" style="padding:18px 24px 24px;border-top:1px solid #ffd7bf;">
                <p class="mm-muted" style="margin:0;font-size:12px;line-height:1.6;color:#b45309;">This is an automated message from ${appName}. Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!resendApiKey) {
    return json(500, { error: "Missing RESEND_API_KEY" });
  }

  let email = "";
  let otp = "";
  let purpose: OtpPurpose = "generic";

  try {
    const body = (await req.json()) as { email?: string; otp?: string; purpose?: string };
    email = String(body.email ?? "").trim();
    otp = String(body.otp ?? "").trim();
    purpose = normalizePurpose(String(body.purpose ?? "generic").trim().toLowerCase());
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!email || !otp) {
    return json(400, { error: "email and otp are required" });
  }

  const template = buildOtpEmailTemplate(otp, purpose);

  try {
    const response = await resend.emails.send({
      from: resendFrom,
      to: [email],
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (response?.error) {
      const providerMessage = String(response.error.message ?? "Failed to send email");
      return json(502, { error: providerMessage });
    }

    return json(200, response as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return json(500, { error: message });
  }
});
