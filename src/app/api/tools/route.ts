import { NextRequest, NextResponse } from "next/server";

import { listTools } from "@/lib/repository";
import type { ToolSort } from "@/lib/types";

export const runtime = "nodejs";

const allowedSorts: ToolSort[] = ["score", "stars", "recent", "votes"];

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.get("category");
  const search = searchParams.get("search") ?? undefined;
  const sortInput = searchParams.get("sort") as ToolSort | null;
  const sort = allowedSorts.includes(sortInput ?? "score")
    ? (sortInput as ToolSort)
    : "score";

  const minScoreRaw = Number(searchParams.get("minScore") ?? "0");
  const minScore = Number.isFinite(minScoreRaw) ? minScoreRaw : 0;

  const limitRaw = Number(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;

  const tools = listTools({
    category: category && category !== "all" ? category : undefined,
    search,
    minScore,
    sort,
    limit,
  });

  return NextResponse.json({
    items: tools,
    count: tools.length,
  });
}
