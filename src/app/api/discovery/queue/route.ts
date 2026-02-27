import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import type {
  DiscoveryAiScores,
  DiscoveryQueueItem,
  DiscoveryStatus,
} from "@/lib/discovery/types";

export const runtime = "nodejs";

const allowedStatuses: DiscoveryStatus[] = [
  "pending",
  "approved",
  "rejected",
  "published",
];

function parseTopics(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseScores(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as DiscoveryAiScores;
  } catch {
    return null;
  }
}

export function GET(request: NextRequest) {
  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam && allowedStatuses.includes(statusParam as DiscoveryStatus)
      ? (statusParam as DiscoveryStatus)
      : "approved";

  const rows = db
    .prepare(
      `
      SELECT *
      FROM discovery_queue
      WHERE status = ?
      ORDER BY
        CASE status
          WHEN 'approved' THEN starCount
          WHEN 'pending' THEN starCount
          ELSE 0
        END DESC,
        datetime(updatedAt) DESC
    `,
    )
    .all(status) as DiscoveryQueueItem[];

  const items = rows.map((row) => ({
    ...row,
    topics: parseTopics(row.topics),
    aiScores: parseScores(row.aiScores),
  }));

  return NextResponse.json({
    status,
    count: items.length,
    items,
  });
}
