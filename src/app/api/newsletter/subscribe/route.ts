import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { subscribeToNewsletter } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureInitialized();

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const result = await subscribeToNewsletter(email);

  if (!result.created && result.reason === "Invalid email format") {
    return NextResponse.json({ message: result.reason }, { status: 400 });
  }

  // Save to DB regardless of email provider setup.
  // Only attempt welcome email dispatch when Resend is configured.
  if (result.created && process.env.RESEND_API_KEY?.trim()) {
    import("@/lib/resend")
      .then(({ sendWelcomeEmail }) => sendWelcomeEmail(email))
      .catch(() => {});
  }

  return NextResponse.json({
    success: true,
    message: result.created
      ? "You are subscribed to the MacVault digest."
      : "You are already subscribed.",
  });
}
