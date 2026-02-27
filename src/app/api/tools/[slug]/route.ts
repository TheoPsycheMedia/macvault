import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { getToolBySlug } from "@/lib/repository";

export const runtime = "nodejs";

interface ToolRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: ToolRouteContext) {
  await ensureInitialized();

  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return NextResponse.json({ message: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json(tool);
}
