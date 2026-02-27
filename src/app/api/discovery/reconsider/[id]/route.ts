import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

interface ReconsiderRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: ReconsiderRouteContext) {
  const { id } = await params;
  const queueId = Number(id);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    return NextResponse.json({ message: "Invalid queue id" }, { status: 400 });
  }

  const candidate = db
    .prepare("SELECT id, status FROM discovery_queue WHERE id = ? LIMIT 1")
    .get(queueId) as { id: number; status: string } | undefined;

  if (!candidate) {
    return NextResponse.json({ message: "Discovery item not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE discovery_queue
    SET status = 'pending', updatedAt = ?
    WHERE id = ?
  `,
  ).run(now, queueId);

  return NextResponse.json({ reconsidered: true, id: queueId });
}
