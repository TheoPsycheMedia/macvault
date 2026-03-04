import "server-only";

import { Resend } from "resend";

export type NewsletterSignupEmailResult =
  | {
      delivered: true;
      mode: "notification";
      message: string;
    }
  | {
      delivered: false;
      reason: "missing_api_key" | "resend_error";
      message: string;
      error?: string;
    };

const DEFAULT_FROM_EMAIL = "MacVault <onboarding@resend.dev>";
const DEFAULT_NOTIFY_EMAIL = "macvaultapp@proton.me";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendNewsletterSignupEmail(email: string): Promise<NewsletterSignupEmailResult> {
  const resend = getResend();
  if (!resend) {
    return {
      delivered: false,
      reason: "missing_api_key",
      message: "RESEND_API_KEY is not configured.",
    };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const notifyTo = process.env.RESEND_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;

  try {
    await resend.emails.send({
      from,
      to: notifyTo,
      subject: `New MacVault newsletter subscriber: ${email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e4e4e7; padding: 24px;">
          <div style="max-width: 520px; margin: 0 auto; border: 1px solid #27272a; border-radius: 12px; background: #18181b; padding: 20px;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa;">MacVault</p>
            <h2 style="margin: 10px 0 8px; font-size: 24px; line-height: 1.2; color: #fafafa;">New newsletter signup</h2>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
              <strong>${escapeHtml(email)}</strong> just joined the newsletter list.
            </p>
          </div>
        </div>
      `,
    });

    return {
      delivered: true,
      mode: "notification",
      message: "Subscribed. You're on the list.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Resend error";
    console.error("[newsletter] resend notification failed:", error);

    return {
      delivered: false,
      reason: "resend_error",
      message: "Resend could not send the signup notification.",
      error: errorMessage,
    };
  }
}

export async function sendNewsletter(
  subscribers: string[],
  subject: string,
  html: string,
) {
  const resend = getResend();
  if (!resend) {
    return {
      sent: 0,
      failed: subscribers.length,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const results = { sent: 0, failed: 0 };

  for (const to of subscribers) {
    try {
      await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
      results.sent += 1;
    } catch (error) {
      results.failed += 1;
      console.error("[newsletter] bulk send failed:", error);
    }
  }

  return results;
}
