import "server-only";

import { db } from "../db";
import { evaluateCandidate } from "./evaluator";
import { scanGitHub } from "./scanner";

interface PipelineSummary {
  scanned: number;
  evaluated: number;
  approved: number;
  rejected: number;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runDiscoveryPipeline(): Promise<PipelineSummary> {
  const scanned = await scanGitHub();
  const pendingRows = db
    .prepare(
      `
      SELECT id
      FROM discovery_queue
      WHERE status = 'pending'
      ORDER BY starCount DESC, datetime(createdAt) ASC
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
      await sleep(2000);
    }
  }

  return {
    scanned,
    evaluated,
    approved,
    rejected,
  };
}
