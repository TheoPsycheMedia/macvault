import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { submitVote } from "@/lib/repository";
import type { VoteType } from "@/lib/types";
import { deriveVisitorId } from "@/lib/visitor";

export const runtime = "nodejs";

interface ToolVoteRouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: ToolVoteRouteContext) {
  await ensureInitialized();

  const { slug } = await params;

  const body = (await request.json().catch(() => null)) as { voteType?: VoteType } | null;
  const voteType = body?.voteType;

  if (!voteType || !["up", "down"].includes(voteType)) {
    return NextResponse.json({ message: "voteType must be up or down" }, { status: 400 });
  }

  const visitorId = deriveVisitorId(request);
  const result = await submitVote(slug, visitorId, voteType);

  if (!result) {
    return NextResponse.json({ message: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json({
    upvotes: result.tool.upvotes,
    downvotes: result.tool.downvotes,
    voteCount: result.tool.voteCount,
    currentVote: result.currentVote,
  });
}
