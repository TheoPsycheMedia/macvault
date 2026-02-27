import { NextResponse } from "next/server";

import { getToolBySlug } from "@/lib/repository";

export const runtime = "nodejs";

interface ToolRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: ToolRouteContext) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return NextResponse.json({ message: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json(tool);
}
