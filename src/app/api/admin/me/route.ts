import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

function getAdminCount() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM admin_users").get() as { count: number };
  return Number(row.count);
}

function readBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function GET(request: NextRequest) {
  const adminCount = getAdminCount();
  if (adminCount === 0) {
    return NextResponse.json(
      { error: "No admin users found", code: "NO_ADMINS" },
      { status: 404 },
    );
  }

  const bearerToken = readBearerToken(request);
  const cookieToken = request.cookies.get("macvault-session")?.value ?? "";
  const token = bearerToken || cookieToken;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const row = db
    .prepare(
      `
      SELECT
        s.id AS sessionId,
        s.expiresAt,
        u.id AS userId,
        u.email,
        u.name
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.userId
      WHERE s.token = ?
      LIMIT 1
    `,
    )
    .get(token) as
    | {
        sessionId: number;
        expiresAt: string;
        userId: number;
        email: string;
        name: string | null;
      }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const expiresAtMs = Date.parse(row.expiresAt);
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    db.prepare("DELETE FROM admin_sessions WHERE id = ?").run(row.sessionId);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: row.userId,
      email: row.email,
      name: row.name,
    },
  });
}
