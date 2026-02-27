import { NextRequest, NextResponse } from "next/server";

import { ensureInitialized, execute } from "@/lib/db";

export const runtime = "nodejs";

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

async function getAdminCount() {
  const result = await execute("SELECT COUNT(*) AS count FROM admin_users");
  return toNumber((result.rows[0] as Record<string, unknown> | undefined)?.count);
}

function readBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function GET(request: NextRequest) {
  await ensureInitialized();

  const adminCount = await getAdminCount();
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

  const result = await execute(
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
    [token],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionId = toNumber(row.sessionId);
  const expiresAt = toStringValue(row.expiresAt);
  const userId = toNumber(row.userId);
  const email = toStringValue(row.email);
  const name = toNullableString(row.name);

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    await execute("DELETE FROM admin_sessions WHERE id = ?", [sessionId]);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email,
      name,
    },
  });
}
