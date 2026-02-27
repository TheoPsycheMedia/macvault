import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { listCategories } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  await ensureInitialized();
  const categories = await listCategories();
  return NextResponse.json({ items: categories, count: categories.length });
}
