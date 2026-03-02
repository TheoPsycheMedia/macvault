import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";

const SCORE_COLUMNS = [
  "functionality",
  "usefulness",
  "visualQuality",
  "installEase",
  "maintenanceHealth",
  "documentationQuality",
  "appleSiliconSupport",
  "privacySecurity",
  "overallScore",
] as const;

type ScoreColumn = (typeof SCORE_COLUMNS)[number];

interface ScoreRange {
  minScore: number;
  maxScore: number;
}

function loadEnvFromDotLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const delimiterIndex = trimmed.indexOf("=");
    if (delimiterIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    const valueRaw = trimmed.slice(delimiterIndex + 1).trim();
    if (!key) {
      continue;
    }

    const unquotedValue = valueRaw.replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = unquotedValue;
    }
  }
}

function requireEnv(name: "TURSO_DATABASE_URL" | "TURSO_AUTH_TOKEN") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
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

async function getRangeForToolsScore(databaseUrl: string, authToken: string): Promise<ScoreRange> {
  const db = createClient({ url: databaseUrl, authToken });
  const result = await db.execute("SELECT MIN(score) AS minScore, MAX(score) AS maxScore FROM tools");
  const row = (result.rows[0] ?? {}) as Record<string, unknown>;

  return {
    minScore: toNumber(row.minScore),
    maxScore: toNumber(row.maxScore),
  };
}

async function getRangeForScoresColumn(
  databaseUrl: string,
  authToken: string,
  column: ScoreColumn,
): Promise<ScoreRange> {
  const db = createClient({ url: databaseUrl, authToken });
  const result = await db.execute(`SELECT MIN(${column}) AS minScore, MAX(${column}) AS maxScore FROM scores`);
  const row = (result.rows[0] ?? {}) as Record<string, unknown>;

  return {
    minScore: toNumber(row.minScore),
    maxScore: toNumber(row.maxScore),
  };
}

function normalizeExpression(column: string) {
  return `ROUND(CASE WHEN ${column} > 10 THEN ${column} / 10.0 ELSE ${column} END, 1)`;
}

async function main() {
  loadEnvFromDotLocal();

  const databaseUrl = requireEnv("TURSO_DATABASE_URL");
  const authToken = requireEnv("TURSO_AUTH_TOKEN");
  const db = createClient({ url: databaseUrl, authToken });

  const toolsBefore = await getRangeForToolsScore(databaseUrl, authToken);
  const scoreBefore = new Map<ScoreColumn, ScoreRange>();

  for (const column of SCORE_COLUMNS) {
    scoreBefore.set(column, await getRangeForScoresColumn(databaseUrl, authToken, column));
  }

  console.log("Before normalization:");
  console.log(`tools.score -> min: ${toolsBefore.minScore}, max: ${toolsBefore.maxScore}`);
  for (const column of SCORE_COLUMNS) {
    const range = scoreBefore.get(column);
    if (range) {
      console.log(`scores.${column} -> min: ${range.minScore}, max: ${range.maxScore}`);
    }
  }

  const now = new Date().toISOString();

  const toolsUpdate = await db.execute({
    sql: `
      UPDATE tools
      SET score = ${normalizeExpression("score")},
          updatedAt = ?
      WHERE score IS NOT NULL
    `,
    args: [now],
  });

  const scoresUpdate = await db.execute(`
    UPDATE scores
    SET
      functionality = ${normalizeExpression("functionality")},
      usefulness = ${normalizeExpression("usefulness")},
      visualQuality = ${normalizeExpression("visualQuality")},
      installEase = ${normalizeExpression("installEase")},
      maintenanceHealth = ${normalizeExpression("maintenanceHealth")},
      documentationQuality = ${normalizeExpression("documentationQuality")},
      appleSiliconSupport = ${normalizeExpression("appleSiliconSupport")},
      privacySecurity = ${normalizeExpression("privacySecurity")},
      overallScore = ${normalizeExpression("overallScore")}
  `);

  const toolsAfter = await getRangeForToolsScore(databaseUrl, authToken);
  const scoreAfter = new Map<ScoreColumn, ScoreRange>();
  for (const column of SCORE_COLUMNS) {
    scoreAfter.set(column, await getRangeForScoresColumn(databaseUrl, authToken, column));
  }

  console.log("");
  console.log("After normalization:");
  console.log(`tools.score -> min: ${toolsAfter.minScore}, max: ${toolsAfter.maxScore}`);
  for (const column of SCORE_COLUMNS) {
    const range = scoreAfter.get(column);
    if (range) {
      console.log(`scores.${column} -> min: ${range.minScore}, max: ${range.maxScore}`);
    }
  }

  console.log("");
  console.log(`tools rows touched: ${toolsUpdate.rowsAffected ?? 0}`);
  console.log(`scores rows touched: ${scoresUpdate.rowsAffected ?? 0}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[normalize-scores] Failed: ${message}`);
  process.exitCode = 1;
});
