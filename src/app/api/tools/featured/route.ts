import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { listFeaturedTools } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  await ensureInitialized();
  const tools = await listFeaturedTools(4);
  return NextResponse.json({ items: tools, count: tools.length });
}
