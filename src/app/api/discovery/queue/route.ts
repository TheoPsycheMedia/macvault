import { NextRequest, NextResponse } from "next/server";

import { ensureInitialized, execute } from "@/lib/db";
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

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

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

function mapQueueItem(row: Record<string, unknown>): DiscoveryQueueItem {
  return {
    id: toNumber(row.id),
    githubUrl: toStringValue(row.githubUrl),
    repoFullName: toStringValue(row.repoFullName),
    name: toStringValue(row.name),
    description: toNullableString(row.description),
    starCount: toNumber(row.starCount),
    forkCount: toNumber(row.forkCount),
    language: toNullableString(row.language),
    lastCommitDate: toNullableString(row.lastCommitDate),
    license: toNullableString(row.license),
    topics: toStringValue(row.topics) || "[]",
    readmeExcerpt: toNullableString(row.readmeExcerpt),
    status: toStringValue(row.status) as DiscoveryStatus,
    aiSummary: toNullableString(row.aiSummary),
    aiScores: toNullableString(row.aiScores),
    aiCategory: toNullableString(row.aiCategory),
    aiSubcategory: toNullableString(row.aiSubcategory),
    aiBrewCommand: toNullableString(row.aiBrewCommand),
    aiInstallInstructions: toNullableString(row.aiInstallInstructions),
    evaluatedAt: toNullableString(row.evaluatedAt),
    createdAt: toStringValue(row.createdAt),
    updatedAt: toStringValue(row.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  await ensureInitialized();

  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam && allowedStatuses.includes(statusParam as DiscoveryStatus)
      ? (statusParam as DiscoveryStatus)
      : "pending";

  const result = await execute(
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
    [status],
  );

  const items = result.rows.map((row) => {
    const mapped = mapQueueItem(row as Record<string, unknown>);

    return {
      ...mapped,
      topics: parseTopics(mapped.topics),
      aiScores: parseScores(mapped.aiScores),
    };
  });

  return NextResponse.json({
    status,
    count: items.length,
    items,
  });
}
