import { NextResponse } from "next/server";

import { createSession, getAdminByEmail, updateLastLogin, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

interface LoginPayload {
  email?: string;
  password?: string;
}

export const runtime = "nodejs";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type FailedAttemptState = {
  count: number;
  lockedUntil: number | null;
};

const failedAttemptsByEmail = new Map<string, FailedAttemptState>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getLockState(email: string, now: number) {
  const state = failedAttemptsByEmail.get(email);
  if (!state) {
    return null;
  }

  if (state.lockedUntil && state.lockedUntil > now) {
    return state;
  }

  if (state.lockedUntil && state.lockedUntil <= now) {
    failedAttemptsByEmail.delete(email);
    return null;
  }

  return state;
}

function markFailedAttempt(email: string, now: number) {
  const state = getLockState(email, now);
  const nextCount = (state?.count ?? 0) + 1;

  if (nextCount >= LOCK_AFTER_ATTEMPTS) {
    failedAttemptsByEmail.set(email, {
      count: 0,
      lockedUntil: now + LOCK_DURATION_MS,
    });
    return;
  }

  failedAttemptsByEmail.set(email, {
    count: nextCount,
    lockedUntil: null,
  });
}

export async function POST(request: Request) {
  let payload: LoginPayload | null = null;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof payload?.email === "string" ? normalizeEmail(payload.email) : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const now = Date.now();
  const lockState = getLockState(email, now);
  if (lockState?.lockedUntil && lockState.lockedUntil > now) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const admin = getAdminByEmail(email);
  if (!admin) {
    markFailedAttempt(email, now);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const isPasswordValid = await verifyPassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    markFailedAttempt(email, now);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  failedAttemptsByEmail.delete(email);
  updateLastLogin(admin.id);

  const token = createSession();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS).toISOString();

  db.prepare("DELETE FROM admin_sessions WHERE expiresAt <= ?").run(createdAt.toISOString());
  db.prepare(
    `
    INSERT INTO admin_sessions (token, userId, expiresAt, createdAt)
    VALUES (?, ?, ?, ?)
  `,
  ).run(token, admin.id, expiresAt, createdAt.toISOString());

  return NextResponse.json({ ok: true, token, expiresAt });
}
