import "server-only";

import { execute } from "@/lib/db";
import type { Category, Tool, ToolFilters, VoteType } from "@/lib/types";

type DbRow = Record<string, unknown>;

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
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function toNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parseScreenshotUrls(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapTool(row: DbRow): Tool {
  return {
    id: toNumber(row.id),
    name: toStringValue(row.name),
    slug: toStringValue(row.slug),
    description: toStringValue(row.description),
    summary: toStringValue(row.summary),
    githubUrl: toStringValue(row.githubUrl),
    websiteUrl: toStringValue(row.websiteUrl),
    category: toStringValue(row.category),
    subcategory: toStringValue(row.subcategory),
    iconUrl: toStringValue(row.iconUrl),
    screenshotUrls: parseScreenshotUrls(row.screenshotUrls),
    brewCommand: toStringValue(row.brewCommand),
    installInstructions: toStringValue(row.installInstructions),
    score: toNumber(row.score),
    starCount: toNumber(row.starCount),
    forkCount: toNumber(row.forkCount),
    lastCommitDate: toStringValue(row.lastCommitDate),
    license: toStringValue(row.license),
    createdAt: toStringValue(row.createdAt),
    updatedAt: toStringValue(row.updatedAt),
    isPublished: toNumber(row.isPublished) === 1,
    isFeatured: toNumber(row.isFeatured) === 1,
    functionality: toNumber(row.functionality),
    usefulness: toNumber(row.usefulness),
    visualQuality: toNumber(row.visualQuality),
    installEase: toNumber(row.installEase),
    maintenanceHealth: toNumber(row.maintenanceHealth),
    documentationQuality: toNumber(row.documentationQuality),
    appleSiliconSupport: toNumber(row.appleSiliconSupport),
    privacySecurity: toNumber(row.privacySecurity),
    overallScore: toNumber(row.overallScore),
    categoryName: toStringValue(row.categoryName) || toStringValue(row.category),
    categoryIcon: toStringValue(row.categoryIcon),
    upvotes: toNumber(row.upvotes),
    downvotes: toNumber(row.downvotes),
    voteCount: toNumber(row.voteCount),
  };
}

function mapCategory(row: DbRow): Category {
  return {
    id: toNumber(row.id),
    name: toStringValue(row.name),
    slug: toStringValue(row.slug),
    icon: toStringValue(row.icon),
    description: toStringValue(row.description),
    toolCount: toNumber(row.toolCount),
  };
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

export async function listTools(filters: ToolFilters = {}): Promise<Tool[]> {
  const whereClauses: string[] = ["t.isPublished = 1"];
  const params: Array<string | number> = [];

  if (filters.category) {
    whereClauses.push("t.category = ?");
    params.push(filters.category);
  }

  if (
    typeof filters.minScore === "number" &&
    !Number.isNaN(filters.minScore) &&
    filters.minScore > 0
  ) {
    whereClauses.push("s.overallScore >= ?");
    params.push(filters.minScore);
  }

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    whereClauses.push(`(
      t.name LIKE ?
      OR t.description LIKE ?
      OR t.summary LIKE ?
      OR t.subcategory LIKE ?
    )`);
    params.push(search, search, search, search);
  }

  const query = `
    ${toolSelect}
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY t.id
    ORDER BY ${sortToSql(filters.sort)}
    LIMIT ?
  `;

  params.push(filters.limit ?? 100);

  const result = await execute(query, params);
  return result.rows.map((row) => mapTool(row as DbRow));
}

export async function listFeaturedTools(limit = 4): Promise<Tool[]> {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1 AND t.isFeatured = 1
    GROUP BY t.id
    ORDER BY s.overallScore DESC, t.starCount DESC
    LIMIT ?
  `;

  const result = await execute(query, [limit]);
  return result.rows.map((row) => mapTool(row as DbRow));
}

export async function listTrendingTools(limit = 6): Promise<Tool[]> {
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

  const result = await execute(query, [limit]);
  return result.rows.map((row) => mapTool(row as DbRow));
}

export async function listRecentTools(limit = 6): Promise<Tool[]> {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1
    GROUP BY t.id
    ORDER BY datetime(t.createdAt) DESC
    LIMIT ?
  `;

  const result = await execute(query, [limit]);
  return result.rows.map((row) => mapTool(row as DbRow));
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const query = `
    ${toolSelect}
    WHERE t.slug = ? AND t.isPublished = 1
    GROUP BY t.id
    LIMIT 1
  `;

  const result = await execute(query, [slug]);
  const row = result.rows[0] as DbRow | undefined;
  return row ? mapTool(row) : null;
}

export async function listSimilarTools(tool: Tool, limit = 3): Promise<Tool[]> {
  const query = `
    ${toolSelect}
    WHERE t.isPublished = 1 AND t.category = ? AND t.id != ?
    GROUP BY t.id
    ORDER BY s.overallScore DESC, t.starCount DESC
    LIMIT ?
  `;

  const result = await execute(query, [tool.category, tool.id, limit]);
  return result.rows.map((row) => mapTool(row as DbRow));
}

export async function getPublishedToolCount(): Promise<number> {
  const result = await execute(
    "SELECT COUNT(*) as c FROM tools WHERE isPublished = 1",
  );

  return toNumber(result.rows[0]?.c);
}

export async function listCategories(): Promise<Category[]> {
  const result = await execute(`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.icon,
      c.description,
      (
        SELECT COUNT(*)
        FROM tools t
        WHERE t.category = c.slug AND t.isPublished = 1
      ) as toolCount
    FROM categories c
    ORDER BY toolCount DESC, c.name ASC
  `);

  return result.rows.map((row) => mapCategory(row as DbRow));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const result = await execute(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.icon,
        c.description,
        (
          SELECT COUNT(*)
          FROM tools t
          WHERE t.category = c.slug AND t.isPublished = 1
        ) as toolCount
      FROM categories c
      WHERE c.slug = ?
      LIMIT 1
    `,
    [slug],
  );

  const row = result.rows[0] as DbRow | undefined;
  return row ? mapCategory(row) : null;
}

async function getVoteStats(toolId: number) {
  const result = await execute(
    `
      SELECT
        COALESCE(SUM(CASE WHEN voteType = 'up' THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN voteType = 'down' THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(SUM(CASE WHEN voteType = 'up' THEN 1 WHEN voteType = 'down' THEN -1 ELSE 0 END), 0) AS voteCount
      FROM votes
      WHERE toolId = ?
    `,
    [toolId],
  );

  const row = (result.rows[0] as DbRow | undefined) ?? {};

  return {
    upvotes: toNumber(row.upvotes),
    downvotes: toNumber(row.downvotes),
    voteCount: toNumber(row.voteCount),
  };
}

export async function submitVote(
  slug: string,
  visitorId: string,
  voteType: VoteType,
): Promise<
  | {
      tool: Tool;
      currentVote: VoteType | null;
    }
  | null
> {
  const toolResult = await execute(
    "SELECT id FROM tools WHERE slug = ? AND isPublished = 1 LIMIT 1",
    [slug],
  );
  const toolRow = toolResult.rows[0] as DbRow | undefined;
  const toolId = toNumber(toolRow?.id);

  if (!toolId) {
    return null;
  }

  const existingResult = await execute(
    "SELECT id, voteType FROM votes WHERE toolId = ? AND visitorId = ? LIMIT 1",
    [toolId, visitorId],
  );

  const existing = existingResult.rows[0] as DbRow | undefined;
  const existingId = toNumber(existing?.id);
  const existingVoteType = toNullableString(existing?.voteType) as VoteType | null;

  const now = new Date().toISOString();
  let currentVote: VoteType | null = voteType;

  if (!existingId) {
    await execute(
      "INSERT INTO votes (toolId, visitorId, voteType, createdAt) VALUES (?, ?, ?, ?)",
      [toolId, visitorId, voteType, now],
    );
  } else if (existingVoteType === voteType) {
    await execute("DELETE FROM votes WHERE id = ?", [existingId]);
    currentVote = null;
  } else {
    await execute("UPDATE votes SET voteType = ?, createdAt = ? WHERE id = ?", [voteType, now, existingId]);
  }

  const tool = await getToolBySlug(slug);
  if (!tool) {
    return null;
  }

  const voteStats = await getVoteStats(toolId);
  const mergedTool: Tool = {
    ...tool,
    ...voteStats,
  };

  return {
    tool: mergedTool,
    currentVote,
  };
}

export async function subscribeToNewsletter(email: string): Promise<{
  created: boolean;
  reason: string | null;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { created: false, reason: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { created: false, reason: "Invalid email format" };
  }

  const result = await execute(
    `
      INSERT OR IGNORE INTO newsletter_subscribers (email, createdAt)
      VALUES (?, ?)
    `,
    [normalizedEmail, new Date().toISOString()],
  );

  const created = Number(result.rowsAffected ?? 0) > 0;

  return {
    created,
    reason: created ? null : "Email is already subscribed",
  };
}
