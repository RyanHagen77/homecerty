// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Base URL for building links
const APP_BASE_URL =
  process.env.APP_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

type PasswordResetEmailParams = {
  to: string;
  token: string;
};

export async function sendPasswordResetEmail({
  to,
  token,
}: PasswordResetEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set – password reset email will not be sent."
    );
    return;
  }

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Reset your Dwella password";

  const text = [
    "You requested to reset your Dwella password.",
    "",
    `Click the link below to choose a new password:`,
    resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your Dwella password</h1>
      <p style="margin: 0 0 12px 0;">You requested to reset the password for your Dwella account.</p>
      <p style="margin: 0 0 16px 0;">Click the button below to choose a new password:</p>
      <p>
        <a href="${resetUrl}" style="
          display:inline-block;
          background-color:#F35A1F;
          color:#ffffff;
          padding:10px 18px;
          border-radius:999px;
          font-size:14px;
          text-decoration:none;
          font-weight:500;
        ">
          Reset password
        </a>
      </p>
      <p style="margin: 16px 0 8px 0; font-size: 13px; color:#4B5563;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color:#4B5563;">
        <a href="${resetUrl}" style="color:#F35A1F;">${resetUrl}</a>
      </p>
      <p style="margin: 0; font-size: 12px; color:#6B7280;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Dwella <no-reply@dwella.app>",
    to,
    subject,
    text,
    html,
  });
}