import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { isCronAuthorized } from "@/lib/discovery/auth";
import { scanGitHub } from "@/lib/discovery/scanner";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureInitialized();

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const newCandidates = await scanGitHub();
    return NextResponse.json({ newCandidates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
