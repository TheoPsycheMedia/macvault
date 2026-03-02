import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string) {
  // Until a custom domain is verified on Resend, onboarding@resend.dev can only
  // send to the account owner (macvaultapp@proton.me). Send there as a notification.
  const RESEND_ACCOUNT_EMAIL = "macvaultapp@proton.me";
  try {
    await resend.emails.send({
      from: "MacVault <onboarding@resend.dev>",
      to: RESEND_ACCOUNT_EMAIL,
      subject: `New MacVault subscriber: ${email}`,
      html: `<h2>New Subscriber</h2>
<p><strong>${email}</strong> just signed up for MacVault Weekly.</p>
<p>Once a custom domain is verified on Resend, welcome emails will go directly to subscribers automatically.</p>`,
    });
  } catch (e) {
    console.error("[resend] welcome email failed:", e);
  }
}

export async function sendNewsletter(
  subscribers: string[],
  subject: string,
  html: string
) {
  const results = { sent: 0, failed: 0 };
  for (const to of subscribers) {
    try {
      await resend.emails.send({
        from: "MacVault <onboarding@resend.dev>",
        to,
        subject,
        html,
      });
      results.sent++;
    } catch {
      results.failed++;
    }
  }
  return results;
}
