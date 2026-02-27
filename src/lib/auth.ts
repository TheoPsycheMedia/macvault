import "server-only";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { execute } from "./db";

export interface AdminUserRecord {
  id: number;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

type DbRow = Record<string, unknown>;

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

function mapAdminUser(row: DbRow): AdminUserRecord {
  return {
    id: toNumber(row.id),
    email: toStringValue(row.email),
    passwordHash: toStringValue(row.passwordHash),
    name: toNullableString(row.name),
    createdAt: toStringValue(row.createdAt),
    lastLoginAt: toNullableString(row.lastLoginAt),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(): string {
  return randomBytes(32).toString("hex");
}

export async function getAdminByEmail(email: string): Promise<AdminUserRecord | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return undefined;
  }

  const result = await execute(
    `
      SELECT id, email, passwordHash, name, createdAt, lastLoginAt
      FROM admin_users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail],
  );

  const row = result.rows[0] as DbRow | undefined;
  return row ? mapAdminUser(row) : undefined;
}

export async function createAdmin(
  email: string,
  password: string,
  name?: string,
): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = typeof name === "string" && name.trim() ? name.trim() : null;
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const result = await execute(
    `
      INSERT INTO admin_users (email, passwordHash, name, createdAt)
      VALUES (?, ?, ?, ?)
    `,
    [normalizedEmail, passwordHash, normalizedName, now],
  );

  const inserted = result.lastInsertRowid;

  if (typeof inserted === "bigint") {
    return Number(inserted);
  }

  if (typeof inserted === "number") {
    return inserted;
  }

  if (typeof inserted === "string") {
    const parsed = Number(inserted);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function updateLastLogin(id: number): Promise<void> {
  await execute(
    `
      UPDATE admin_users
      SET lastLoginAt = ?
      WHERE id = ?
    `,
    [new Date().toISOString(), id],
  );
}
