import { NextResponse } from "next/server";

import { ensureInitialized, execute } from "@/lib/db";
import { sendNewsletter } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = request.headers.get("x-cron-secret");
  const secret = cronSecret || auth;

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureInitialized();

  const body = (await request.json().catch(() => null)) as {
    subject?: string;
    html?: string;
  } | null;

  if (!body?.subject || !body?.html) {
    return NextResponse.json(
      { error: "subject and html are required" },
      { status: 400 }
    );
  }

  const result = await execute("SELECT email FROM newsletter_subscribers", []);
  const subscribers = (result.rows ?? []).map((r) => String(r.email ?? r[0]));

  if (subscribers.length === 0) {
    return NextResponse.json({ message: "No subscribers", sent: 0 });
  }

  const results = await sendNewsletter(subscribers, body.subject, body.html);

  if ("error" in results) {
    return NextResponse.json(
      {
        message: results.error,
        ...results,
        total: subscribers.length,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    message: "Newsletter sent",
    ...results,
    total: subscribers.length,
  });
}
