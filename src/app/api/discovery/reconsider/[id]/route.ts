import { NextResponse } from "next/server";

import { ensureInitialized, execute } from "@/lib/db";

export const runtime = "nodejs";

interface ReconsiderRouteContext {
  params: Promise<{ id: string }>;
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function POST(_: Request, { params }: ReconsiderRouteContext) {
  await ensureInitialized();

  const { id } = await params;
  const queueId = Number(id);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    return NextResponse.json({ message: "Invalid queue id" }, { status: 400 });
  }

  const candidateResult = await execute("SELECT id, status FROM discovery_queue WHERE id = ? LIMIT 1", [queueId]);
  const candidateId = toNumber((candidateResult.rows[0] as Record<string, unknown> | undefined)?.id);

  if (!candidateId) {
    return NextResponse.json({ message: "Discovery item not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  await execute(
    `
      UPDATE discovery_queue
      SET status = 'pending', updatedAt = ?
      WHERE id = ?
    `,
    [now, queueId],
  );

  return NextResponse.json({ reconsidered: true, id: queueId });
}
