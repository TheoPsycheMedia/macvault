import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isCronAuthorized } from "@/lib/discovery/auth";
import { evaluateCandidate } from "@/lib/discovery/evaluator";

export const runtime = "nodejs";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingRows = db
      .prepare(
        `
        SELECT id
        FROM discovery_queue
        WHERE status = 'pending'
        ORDER BY starCount DESC, datetime(createdAt) ASC
        LIMIT 10
      `,
      )
      .all() as Array<{ id: number }>;

    let approved = 0;
    let rejected = 0;
    let evaluated = 0;

    for (let index = 0; index < pendingRows.length; index += 1) {
      const row = pendingRows[index];
      const result = await evaluateCandidate(row.id);
      evaluated += 1;

      if (result.status === "approved") {
        approved += 1;
      } else {
        rejected += 1;
      }

      if (index < pendingRows.length - 1) {
        await sleep(350);
      }
    }

    return NextResponse.json({ evaluated, approved, rejected });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation run failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
