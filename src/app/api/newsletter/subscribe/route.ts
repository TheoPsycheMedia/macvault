import { NextResponse } from "next/server";
import { Resend } from "resend";

import { ensureInitialized } from "@/lib/db";
import { subscribeToNewsletter } from "@/lib/repository";

export const runtime = "nodejs";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  await ensureInitialized();

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const result = await subscribeToNewsletter(email);

  if (!result.created) {
    return NextResponse.json({
      success: true,
      message: "You're already subscribed.",
    });
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json({ message: "RESEND_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "MacVault <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to MacVault 🛠️",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e4e4e7; padding: 28px;">
          <div style="max-width: 560px; margin: 0 auto; border: 1px solid #27272a; border-radius: 14px; background: #18181b; padding: 24px;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa;">MacVault</p>
            <h1 style="margin: 12px 0 8px; font-size: 28px; line-height: 1.2; color: #fafafa;">Welcome aboard</h1>
            <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
              Thanks for joining the MacVault newsletter. You'll get a weekly digest of practical Mac tools, notable updates, and curated picks worth trying.
            </p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
              No spam. Just useful recommendations for your setup.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[newsletter] welcome email failed:", error);
    return NextResponse.json(
      { message: "Subscription saved, but welcome email could not be sent right now." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, message: "Subscribed. Welcome to MacVault." });
}
