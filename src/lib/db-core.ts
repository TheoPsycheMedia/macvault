import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

import { categorySeed, seedVotes, toolSeed } from "../data/seed";

const LOCAL_DB_URL = "file:./src/data/macvault.db";
const LOCAL_DB_DIR = path.join(process.cwd(), "src", "data");

type DbGlobals = {
  macvaultClient?: Client;
  macvaultDbInitialized?: boolean;
  macvaultDbInitializing?: Promise<void>;
};

const globalForDb = globalThis as unknown as DbGlobals;

function ensureLocalDataDirectory() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
}

function getDatabaseUrl() {
  const fromEnv = process.env.TURSO_DATABASE_URL?.trim();
  return fromEnv || LOCAL_DB_URL;
}

function isLocalFileUrl(url: string) {
  return url.startsWith("file:");
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

export function getClient(): Client {
  if (globalForDb.macvaultClient) {
    return globalForDb.macvaultClient;
  }

  const url = getDatabaseUrl();
  if (isLocalFileUrl(url)) {
    ensureLocalDataDirectory();
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  });

  globalForDb.macvaultClient = client;
  return client;
}

export async function getDb(): Promise<Client> {
  return getClient();
}

async function createTables() {
  const db = getClient();
  const statements = [
    `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        description TEXT NOT NULL,
        toolCount INTEGER NOT NULL DEFAULT 0
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        summary TEXT NOT NULL,
        githubUrl TEXT NOT NULL,
        websiteUrl TEXT,
        category TEXT NOT NULL,
        subcategory TEXT,
        iconUrl TEXT,
        screenshotUrls TEXT NOT NULL DEFAULT '[]',
        brewCommand TEXT,
        installInstructions TEXT,
        score REAL NOT NULL DEFAULT 0,
        starCount INTEGER NOT NULL DEFAULT 0,
        forkCount INTEGER NOT NULL DEFAULT 0,
        lastCommitDate TEXT,
        license TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isPublished INTEGER NOT NULL DEFAULT 1,
        isFeatured INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (category) REFERENCES categories(slug)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        toolId INTEGER NOT NULL UNIQUE,
        functionality REAL NOT NULL,
        usefulness REAL NOT NULL,
        visualQuality REAL NOT NULL,
        installEase REAL NOT NULL,
        maintenanceHealth REAL NOT NULL,
        documentationQuality REAL NOT NULL,
        appleSiliconSupport REAL NOT NULL,
        privacySecurity REAL NOT NULL,
        overallScore REAL NOT NULL,
        FOREIGN KEY (toolId) REFERENCES tools(id) ON DELETE CASCADE
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        toolId INTEGER NOT NULL,
        visitorId TEXT NOT NULL,
        voteType TEXT NOT NULL CHECK(voteType IN ('up', 'down')),
        createdAt TEXT NOT NULL,
        FOREIGN KEY (toolId) REFERENCES tools(id) ON DELETE CASCADE,
        UNIQUE(toolId, visitorId)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        name TEXT,
        createdAt TEXT NOT NULL,
        lastLoginAt TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        userId INTEGER NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES admin_users(id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS discovery_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        githubUrl TEXT NOT NULL UNIQUE,
        repoFullName TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        starCount INTEGER DEFAULT 0,
        forkCount INTEGER DEFAULT 0,
        language TEXT,
        lastCommitDate TEXT,
        license TEXT,
        topics TEXT DEFAULT '[]',
        readmeExcerpt TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        aiSummary TEXT,
        aiScores TEXT,
        aiCategory TEXT,
        aiSubcategory TEXT,
        aiBrewCommand TEXT,
        aiInstallInstructions TEXT,
        evaluatedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `,
    "CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug)",
    "CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category)",
    "CREATE INDEX IF NOT EXISTS idx_scores_toolId ON scores(toolId)",
    "CREATE INDEX IF NOT EXISTS idx_votes_toolId ON votes(toolId)",
    "CREATE INDEX IF NOT EXISTS idx_votes_visitorId ON votes(visitorId)",
    "CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)",
    "CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)",
    "CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiresAt ON admin_sessions(expiresAt)",
    "CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON discovery_queue(status)",
    "CREATE INDEX IF NOT EXISTS idx_discovery_queue_repo ON discovery_queue(repoFullName)",
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }
}

async function seedDatabase() {
  const db = getClient();
  const existingTools = await db.execute("SELECT COUNT(*) AS count FROM tools");
  const toolCount = toNumber(existingTools.rows[0]?.count);

  if (toolCount > 0) {
    return;
  }

  const now = new Date().toISOString();

  for (const category of categorySeed) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO categories (name, slug, icon, description, toolCount)
        VALUES (?, ?, ?, ?, 0)
      `,
      args: [category.name, category.slug, category.icon, category.description],
    });
  }

  for (const tool of toolSeed) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO tools (
          name, slug, description, summary, githubUrl, websiteUrl,
          category, subcategory, iconUrl, screenshotUrls, brewCommand,
          installInstructions, score, starCount, forkCount, lastCommitDate,
          license, createdAt, updatedAt, isPublished, isFeatured
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      args: [
        tool.name,
        tool.slug,
        tool.description,
        tool.summary,
        tool.githubUrl,
        tool.websiteUrl,
        tool.category,
        tool.subcategory,
        tool.iconUrl,
        JSON.stringify(tool.screenshotUrls),
        tool.brewCommand,
        tool.installInstructions,
        tool.score,
        tool.starCount,
        tool.forkCount,
        tool.lastCommitDate,
        tool.license,
        tool.createdAt,
        tool.updatedAt,
        tool.isPublished ? 1 : 0,
        tool.isFeatured ? 1 : 0,
      ] as InValue[],
    });

    const toolIdResult = await db.execute({
      sql: "SELECT id FROM tools WHERE slug = ? LIMIT 1",
      args: [tool.slug],
    });

    const toolId = toNumber(toolIdResult.rows[0]?.id);
    if (!toolId) {
      continue;
    }

    await db.execute({
      sql: `
        INSERT OR REPLACE INTO scores (
          toolId,
          functionality,
          usefulness,
          visualQuality,
          installEase,
          maintenanceHealth,
          documentationQuality,
          appleSiliconSupport,
          privacySecurity,
          overallScore
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      args: [
        toolId,
        tool.scores.functionality,
        tool.scores.usefulness,
        tool.scores.visualQuality,
        tool.scores.installEase,
        tool.scores.maintenanceHealth,
        tool.scores.documentationQuality,
        tool.scores.appleSiliconSupport,
        tool.scores.privacySecurity,
        tool.scores.overallScore,
      ] as InValue[],
    });
  }

  for (const voteSeed of seedVotes) {
    const toolIdResult = await db.execute({
      sql: "SELECT id FROM tools WHERE slug = ? LIMIT 1",
      args: [voteSeed.slug],
    });

    const toolId = toNumber(toolIdResult.rows[0]?.id);
    if (!toolId) {
      continue;
    }

    for (let i = 0; i < voteSeed.upvotes; i += 1) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO votes (toolId, visitorId, voteType, createdAt) VALUES (?, ?, ?, ?)",
        args: [toolId, `${voteSeed.slug}-seed-up-${i}`, "up", now],
      });
    }

    for (let i = 0; i < voteSeed.downvotes; i += 1) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO votes (toolId, visitorId, voteType, createdAt) VALUES (?, ?, ?, ?)",
        args: [toolId, `${voteSeed.slug}-seed-down-${i}`, "down", now],
      });
    }
  }

  await db.execute(`
    UPDATE categories
    SET toolCount = (
      SELECT COUNT(*)
      FROM tools
      WHERE tools.category = categories.slug
        AND tools.isPublished = 1
    )
  `);
}

export async function ensureInitialized() {
  if (globalForDb.macvaultDbInitialized) {
    return;
  }

  if (globalForDb.macvaultDbInitializing) {
    await globalForDb.macvaultDbInitializing;
    return;
  }

  globalForDb.macvaultDbInitializing = (async () => {
    await createTables();
    await seedDatabase();
    globalForDb.macvaultDbInitialized = true;
  })();

  try {
    await globalForDb.macvaultDbInitializing;
  } finally {
    globalForDb.macvaultDbInitializing = undefined;
  }
}

export async function execute(sql: string, args?: InValue[]) {
  await ensureInitialized();
  const db = getClient();

  return db.execute({
    sql,
    args: args ?? [],
  });
}

export async function executeMany(statements: string[]) {
  await ensureInitialized();
  const db = getClient();

  for (const sql of statements) {
    await db.execute(sql);
  }
}
