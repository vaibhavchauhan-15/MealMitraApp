// @ts-nocheck
import { Resend } from "npm:resend";

const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resend = new Resend(resendApiKey);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

  try {
    const body = (await req.json()) as { email?: string; otp?: string };
    email = String(body.email ?? "").trim();
    otp = String(body.otp ?? "").trim();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!email || !otp) {
    return json(400, { error: "email and otp are required" });
  }

  try {
    const response = await resend.emails.send({
      from: "MealMitra <onboarding@resend.dev>",
      to: [email],
      subject: "Your OTP Code",
      html: `<h1>${otp}</h1><p>This OTP is valid for 5 minutes.</p>`,
    });

    return json(200, response as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return json(500, { error: message });
  }
});
