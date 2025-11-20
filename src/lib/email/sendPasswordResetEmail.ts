import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000";

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Reset your Dwella password";

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
      <h2 style="margin-bottom:16px;">Reset your Dwella password</h2>
      <p>You requested to reset your password. Click below:</p>
      <p>
        <a href="${resetUrl}"
           style="background:#F35A1F;color:white;padding:10px 20px;
                  border-radius:8px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p style="margin-top:16px;font-size:13px;">
        Or copy this link:<br/>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p style="font-size:12px;color:#555;margin-top:20px;">
        If you didn't request this, ignore this email.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Dwella <noreply@dwella.app>",
    to,
    subject,
    html,
  });
}