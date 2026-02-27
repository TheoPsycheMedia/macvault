import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { listTrendingTools } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  await ensureInitialized();
  const tools = await listTrendingTools(6);
  return NextResponse.json({ items: tools, count: tools.length });
}
