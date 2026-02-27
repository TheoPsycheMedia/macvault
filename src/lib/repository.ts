import "server-only";

import { db } from "@/lib/db";
import type { Category, Tool, ToolFilters, VoteType } from "@/lib/types";

type DbToolRow = Omit<Tool, "screenshotUrls" | "isPublished" | "isFeatured"> & {
  screenshotUrls: string;
  isPublished: number;
  isFeatured: number;
};

const toolSelect = `
  SELECT
    t.id,
    t.name,
    t.slug,
    t.description,
    t.summary,
    t.githubUrl,
    t.websiteUrl,
    t.category,
    t.subcategory,
    t.iconUrl,
    t.screenshotUrls,
    t.brewCommand,
    t.installInstructions,
    t.score,
    t.starCount,
    t.forkCount,
    t.lastCommitDate,
    t.license,
    t.createdAt,
    t.updatedAt,
    t.isPublished,
    t.isFeatured,
    s.functionality,
    s.usefulness,
    s.visualQuality,
    s.installEase,
    s.maintenanceHealth,
    s.documentationQuality,
    s.appleSiliconSupport,
    s.privacySecurity,
    s.overallScore,
    c.name AS categoryName,
    c.icon AS categoryIcon,
    COALESCE(SUM(CASE WHEN v.voteType = 'up' THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN v.voteType = 'down' THEN 1 ELSE 0 END), 0) AS downvotes,
    COALESCE(SUM(
      CASE
        WHEN v.voteType = 'up' THEN 1
        WHEN v.voteType = 'down' THEN -1
        ELSE 0
      END
    ), 0) AS voteCount
  FROM tools t
  LEFT JOIN scores s ON s.toolId = t.id
  LEFT JOIN categories c ON c.slug = t.category
  LEFT JOIN votes v ON v.toolId = t.id
`;

function parseScreenshotUrls(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapTool(row: DbToolRow): Tool {
  return {
    ...row,
    screenshotUrls: parseScreenshotUrls(row.screenshotUrls),
    isPublished: Boolean(row.isPublished),
    isFeatured: Boolean(row.isFeatured),
  } as Tool;
}

function sortToSql(sort: ToolFilters["sort"]) {
  switch (sort) {
    case "stars":
      return "t.starCount DESC, s.overallScore DESC";
    case "recent":
      return "datetime(t.createdAt) DESC";
    case "votes":
      return "voteCount DESC, s.overallScore DESC";
    case "score":
    default:
      return "s.overallScore DESC, t.starCount DESC";
  }
}

export function listTools(filters: ToolFilters = {}): Tool[] {
  const whereClauses: string[] = ["t.isPublished = 1"];
  const params: Record<string, string | number> = {
    limit: filters.limit ?? 100,
  };

  if (filters.category) {
    whereClauses.push("t.category = @category");
    params.category = filters.category;
  }

  if (typeof filters.minScore === "number" && !Number.isNaN(filters.minScore)) {
    whereClauses.push("s.overallScore >= @minScore");
    params.minScore = filters.minScore;
  }

  if (filters.search?.trim()) {
    whereClauses.push(`(
      t.name LIKE @search
      OR t.description LIKE @search
      OR t.summary LIKE @search
      OR t.subcategory LIKE @search
    )`);
    params.search = `%${filters.search.trim()}%`;
  }

  const query = `
    ${toolSelect}
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY t.id
    ORDER BY ${sortToSql(filters.sort)}
    LIMIT @limit
  `;

  const rows = db.prepare(query).all(params) as DbToolRow[];
  return rows.map(mapTool);
}

export function listFeaturedTools(limit = 4): Tool[] {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1 AND t.isFeatured = 1
    GROUP BY t.id
    ORDER BY s.overallScore DESC, t.starCount DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(limit) as DbToolRow[];
  return rows.map(mapTool);
}

export function listTrendingTools(limit = 6): Tool[] {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1
    GROUP BY t.id
    ORDER BY
      (
        COALESCE(SUM(CASE WHEN v.voteType = 'up' THEN 1 WHEN v.voteType = 'down' THEN -1 ELSE 0 END), 0) * 1.8
        + (t.score * 12)
        + CASE
            WHEN julianday('now') - julianday(t.lastCommitDate) <= 14 THEN 14
            WHEN julianday('now') - julianday(t.lastCommitDate) <= 30 THEN 8
            ELSE 0
          END
      ) DESC,
      t.starCount DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(limit) as DbToolRow[];
  return rows.map(mapTool);
}

export function listRecentTools(limit = 6): Tool[] {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1
    GROUP BY t.id
    ORDER BY datetime(t.createdAt) DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(limit) as DbToolRow[];
  return rows.map(mapTool);
}

export function getToolBySlug(slug: string): Tool | null {
  const query = `
    ${toolSelect}
    WHERE t.slug = ? AND t.isPublished = 1
    GROUP BY t.id
    LIMIT 1
  `;

  const row = db.prepare(query).get(slug) as DbToolRow | undefined;
  return row ? mapTool(row) : null;
}

export function listSimilarTools(tool: Tool, limit = 3): Tool[] {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1 AND t.category = ? AND t.id != ?
    GROUP BY t.id
    ORDER BY s.overallScore DESC, t.starCount DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(tool.category, tool.id, limit) as DbToolRow[];
  return rows.map(mapTool);
}

export function listCategories(): Category[] {
  const rows = db
    .prepare(
      `
      SELECT id, name, slug, icon, description, toolCount
      FROM categories
      ORDER BY toolCount DESC, name ASC
    `,
    )
    .all() as Category[];

  return rows;
}

export function getCategoryBySlug(slug: string): Category | null {
  const row = db
    .prepare(
      `
      SELECT id, name, slug, icon, description, toolCount
      FROM categories
      WHERE slug = ?
      LIMIT 1
    `,
    )
    .get(slug) as Category | undefined;

  return row ?? null;
}

function getVoteStats(toolId: number) {
  const row = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN voteType = 'up' THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN voteType = 'down' THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(SUM(CASE WHEN voteType = 'up' THEN 1 WHEN voteType = 'down' THEN -1 ELSE 0 END), 0) AS voteCount
      FROM votes
      WHERE toolId = ?
    `,
    )
    .get(toolId) as { upvotes: number; downvotes: number; voteCount: number };

  return row;
}

export function submitVote(
  slug: string,
  visitorId: string,
  voteType: VoteType,
):
  | {
      tool: Tool;
      currentVote: VoteType | null;
    }
  | null {
  const toolRow = db
    .prepare("SELECT id FROM tools WHERE slug = ? AND isPublished = 1 LIMIT 1")
    .get(slug) as { id: number } | undefined;

  if (!toolRow) {
    return null;
  }

  const findExisting = db.prepare(
    "SELECT id, voteType FROM votes WHERE toolId = ? AND visitorId = ? LIMIT 1",
  );
  const updateVote = db.prepare("UPDATE votes SET voteType = ?, createdAt = ? WHERE id = ?");
  const insertVote = db.prepare(
    "INSERT INTO votes (toolId, visitorId, voteType, createdAt) VALUES (?, ?, ?, ?)",
  );
  const deleteVote = db.prepare("DELETE FROM votes WHERE id = ?");

  const existing = findExisting.get(toolRow.id, visitorId) as
    | { id: number; voteType: VoteType }
    | undefined;

  const now = new Date().toISOString();
  let currentVote: VoteType | null = voteType;

  const tx = db.transaction(() => {
    if (!existing) {
      insertVote.run(toolRow.id, visitorId, voteType, now);
      return;
    }

    if (existing.voteType === voteType) {
      deleteVote.run(existing.id);
      currentVote = null;
      return;
    }

    updateVote.run(voteType, now, existing.id);
  });

  tx();

  const tool = getToolBySlug(slug);
  if (!tool) {
    return null;
  }

  const voteStats = getVoteStats(toolRow.id);
  const mergedTool: Tool = {
    ...tool,
    ...voteStats,
  };

  return {
    tool: mergedTool,
    currentVote,
  };
}

export function subscribeToNewsletter(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { created: false, reason: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { created: false, reason: "Invalid email format" };
  }

  const result = db
    .prepare(
      `
      INSERT OR IGNORE INTO newsletter_subscribers (email, createdAt)
      VALUES (?, ?)
    `,
    )
    .run(normalizedEmail, new Date().toISOString());

  return {
    created: result.changes > 0,
    reason: result.changes > 0 ? null : "Email is already subscribed",
  };
}
