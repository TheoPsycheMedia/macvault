import { NextResponse } from "next/server";

import { listCategories } from "@/lib/repository";

export const runtime = "nodejs";

export function GET() {
  const categories = listCategories();
  return NextResponse.json({ items: categories, count: categories.length });
}
