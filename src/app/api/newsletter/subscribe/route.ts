import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import {
  getNewsletterEmailValidationMessage,
  normalizeNewsletterEmail,
} from "@/lib/newsletter";
import { queueNewsletterEmailFallback, subscribeToNewsletter } from "@/lib/repository";
import { sendNewsletterSignupEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureInitialized();

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = normalizeNewsletterEmail(body?.email ?? "");
  const validationMessage = getNewsletterEmailValidationMessage(email);

  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  const result = await subscribeToNewsletter(email);

  if (!result.created) {
    return NextResponse.json({
      success: true,
      message: "You're already subscribed.",
    });
  }

  const delivery = await sendNewsletterSignupEmail(email);

  if (!delivery.delivered) {
    try {
      await queueNewsletterEmailFallback(email, delivery.reason, delivery.error ?? delivery.message);
    } catch (error) {
      console.error("[newsletter] failed to queue fallback record:", error);
    }

    if (delivery.reason === "missing_api_key") {
      return NextResponse.json(
        {
          success: true,
          message:
            "Subscribed. RESEND_API_KEY is missing, so email notifications are temporarily disabled.",
        },
        { status: 202 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Subscribed. We queued this signup for email retry.",
      },
      { status: 202 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Subscribed. Welcome to MacVault.",
    },
    { status: 201 },
  );
}
