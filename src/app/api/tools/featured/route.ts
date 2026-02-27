import { NextResponse } from "next/server";

import { listFeaturedTools } from "@/lib/repository";

export const runtime = "nodejs";

export function GET() {
  const tools = listFeaturedTools(4);
  return NextResponse.json({ items: tools, count: tools.length });
}
