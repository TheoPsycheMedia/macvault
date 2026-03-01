import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: "MacVault <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to MacVault Weekly",
      html: `<h2>Welcome to MacVault Weekly!</h2>
<p>Every Friday, you'll get a curated list of the best native macOS tools we reviewed that week, each scored across 8 dimensions.</p>
<p>No spam. No fluff. Just good tools.</p>
<p>— MacVault</p>`,
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
