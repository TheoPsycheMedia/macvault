import { NextResponse } from "next/server";

import { createAdmin } from "@/lib/auth";
import { ensureInitialized, execute } from "@/lib/db";

interface RegisterPayload {
  email?: string;
  password?: string;
  name?: string;
  setupKey?: string;
}

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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

async function getAdminCount() {
  const result = await execute("SELECT COUNT(*) AS count FROM admin_users");
  return toNumber((result.rows[0] as Record<string, unknown> | undefined)?.count);
}

export async function POST(request: Request) {
  await ensureInitialized();

  let payload: RegisterPayload | null = null;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof payload?.email === "string" ? normalizeEmail(payload.email) : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const setupKey = typeof payload?.setupKey === "string" ? payload.setupKey.trim() : "";

  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 },
    );
  }

  const existingAdminCount = await getAdminCount();
  if (existingAdminCount > 0) {
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedSetupKey) {
      return NextResponse.json({ error: "ADMIN_SETUP_KEY is not configured" }, { status: 500 });
    }

    if (!setupKey || setupKey !== expectedSetupKey) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
    }
  }

  try {
    const userId = await createAdmin(email, password, name || undefined);
    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed: admin_users.email/i.test(error.message)) {
      return NextResponse.json({ error: "An admin with this email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
  }
}
