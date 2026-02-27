import { NextResponse } from "next/server";

import { listTrendingTools } from "@/lib/repository";

export const runtime = "nodejs";

export function GET() {
  const tools = listTrendingTools(6);
  return NextResponse.json({ items: tools, count: tools.length });
}
