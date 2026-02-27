import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { categorySeed, seedVotes, toolSeed } from "../data/seed";

const dbFilePath = path.join(process.cwd(), "src/data/macvault.db");

const globalForDb = globalThis as unknown as {
  macvaultDb?: Database.Database;
  macvaultDbInitialized?: boolean;
};

function ensureDataDirectory() {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      toolCount INTEGER NOT NULL DEFAULT 0
    );

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
    );

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
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      toolId INTEGER NOT NULL,
      visitorId TEXT NOT NULL,
      voteType TEXT NOT NULL CHECK(voteType IN ('up', 'down')),
      createdAt TEXT NOT NULL,
      FOREIGN KEY (toolId) REFERENCES tools(id) ON DELETE CASCADE,
      UNIQUE(toolId, visitorId)
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    );

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
    );

    CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
    CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
    CREATE INDEX IF NOT EXISTS idx_scores_toolId ON scores(toolId);
    CREATE INDEX IF NOT EXISTS idx_votes_toolId ON votes(toolId);
    CREATE INDEX IF NOT EXISTS idx_votes_visitorId ON votes(visitorId);
    CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON discovery_queue(status);
    CREATE INDEX IF NOT EXISTS idx_discovery_queue_repo ON discovery_queue(repoFullName);
  `);
}

function seedDatabase(db: Database.Database) {
  const now = new Date().toISOString();

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, icon, description, toolCount)
    VALUES (@name, @slug, @icon, @description, 0)
  `);

  const insertTool = db.prepare(`
    INSERT OR IGNORE INTO tools (
      name, slug, description, summary, githubUrl, websiteUrl,
      category, subcategory, iconUrl, screenshotUrls, brewCommand,
      installInstructions, score, starCount, forkCount, lastCommitDate,
      license, createdAt, updatedAt, isPublished, isFeatured
    ) VALUES (
      @name, @slug, @description, @summary, @githubUrl, @websiteUrl,
      @category, @subcategory, @iconUrl, @screenshotUrls, @brewCommand,
      @installInstructions, @score, @starCount, @forkCount, @lastCommitDate,
      @license, @createdAt, @updatedAt, @isPublished, @isFeatured
    )
  `);

  const insertScore = db.prepare(`
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
      @toolId,
      @functionality,
      @usefulness,
      @visualQuality,
      @installEase,
      @maintenanceHealth,
      @documentationQuality,
      @appleSiliconSupport,
      @privacySecurity,
      @overallScore
    )
  `);

  const insertVote = db.prepare(`
    INSERT OR IGNORE INTO votes (toolId, visitorId, voteType, createdAt)
    VALUES (?, ?, ?, ?)
  `);

  const getToolIdBySlug = db.prepare(
    "SELECT id FROM tools WHERE slug = ? LIMIT 1",
  );

  const seedTx = db.transaction(() => {
    for (const category of categorySeed) {
      insertCategory.run(category);
    }

    for (const tool of toolSeed) {
      insertTool.run({
        ...tool,
        screenshotUrls: JSON.stringify(tool.screenshotUrls),
        isPublished: tool.isPublished ? 1 : 0,
        isFeatured: tool.isFeatured ? 1 : 0,
      });

      const row = getToolIdBySlug.get(tool.slug) as { id: number } | undefined;
      if (!row) {
        continue;
      }

      insertScore.run({
        toolId: row.id,
        ...tool.scores,
      });
    }

    for (const voteSeed of seedVotes) {
      const row = getToolIdBySlug.get(voteSeed.slug) as { id: number } | undefined;
      if (!row) {
        continue;
      }

      for (let i = 0; i < voteSeed.upvotes; i += 1) {
        insertVote.run(row.id, `${voteSeed.slug}-seed-up-${i}`, "up", now);
      }

      for (let i = 0; i < voteSeed.downvotes; i += 1) {
        insertVote.run(row.id, `${voteSeed.slug}-seed-down-${i}`, "down", now);
      }
    }

    db.exec(`
      UPDATE categories
      SET toolCount = (
        SELECT COUNT(*)
        FROM tools
        WHERE tools.category = categories.slug
          AND tools.isPublished = 1
      );
    `);
  });

  seedTx();
}

function initialize(db: Database.Database) {
  if (globalForDb.macvaultDbInitialized) {
    return;
  }

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createTables(db);
  seedDatabase(db);

  globalForDb.macvaultDbInitialized = true;
}

function getDatabase() {
  if (globalForDb.macvaultDb) {
    return globalForDb.macvaultDb;
  }

  ensureDataDirectory();

  const database = new Database(dbFilePath);
  globalForDb.macvaultDb = database;

  initialize(database);

  return database;
}

export const db = getDatabase();
