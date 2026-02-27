import "server-only";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { db } from "./db";

export interface AdminUserRecord {
  id: number;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: string;
  lastLoginAt: string | null;
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

export function getAdminByEmail(email: string): AdminUserRecord | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return undefined;
  }

  return db
    .prepare(
      `
      SELECT id, email, passwordHash, name, createdAt, lastLoginAt
      FROM admin_users
      WHERE email = ?
      LIMIT 1
    `,
    )
    .get(normalizedEmail) as AdminUserRecord | undefined;
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

  const result = db
    .prepare(
      `
      INSERT INTO admin_users (email, passwordHash, name, createdAt)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(normalizedEmail, passwordHash, normalizedName, now);

  return Number(result.lastInsertRowid);
}

export function updateLastLogin(id: number): void {
  db.prepare(
    `
    UPDATE admin_users
    SET lastLoginAt = ?
    WHERE id = ?
  `,
  ).run(new Date().toISOString(), id);
}
