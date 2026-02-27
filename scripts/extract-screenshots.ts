import { ensureInitialized, execute } from "../src/lib/db-core";
import { extractScreenshots } from "../src/lib/discovery/screenshots";

interface ToolRow {
  id: number;
  slug: string;
  name: string;
  githubUrl: string;
  websiteUrl: string | null;
}

interface ApprovedQueueRow {
  id: number;
  name: string;
  githubUrl: string;
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

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function mapToolRow(row: Record<string, unknown>): ToolRow {
  return {
    id: toNumber(row.id),
    slug: toStringValue(row.slug),
    name: toStringValue(row.name),
    githubUrl: toStringValue(row.githubUrl),
    websiteUrl: toNullableString(row.websiteUrl),
  };
}

function mapApprovedRow(row: Record<string, unknown>): ApprovedQueueRow {
  return {
    id: toNumber(row.id),
    name: toStringValue(row.name),
    githubUrl: toStringValue(row.githubUrl),
  };
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "tool";
}

async function updateToolScreenshots(toolId: number, screenshotPaths: string[]) {
  await execute("UPDATE tools SET screenshotUrls = ?, updatedAt = ? WHERE id = ?", [
    JSON.stringify(screenshotPaths),
    new Date().toISOString(),
    toolId,
  ]);
}

async function extractForTool(tool: ToolRow) {
  const screenshots = await extractScreenshots(
    tool.slug,
    tool.githubUrl,
    tool.websiteUrl ?? undefined,
    tool.name,
  );

  if (screenshots.length > 0) {
    await updateToolScreenshots(tool.id, screenshots);
  }

  console.log(`Extracted ${screenshots.length} screenshots for ${tool.name}`);
}

async function extractForApprovedCandidate(candidate: ApprovedQueueRow) {
  const derivedSlug = slugify(candidate.name);
  const screenshots = await extractScreenshots(derivedSlug, candidate.githubUrl, undefined, candidate.name);

  const existingToolResult = await execute(
    "SELECT id FROM tools WHERE lower(githubUrl) = lower(?) LIMIT 1",
    [candidate.githubUrl],
  );

  const existingToolId = toNumber((existingToolResult.rows[0] as Record<string, unknown> | undefined)?.id);

  if (existingToolId && screenshots.length > 0) {
    await updateToolScreenshots(existingToolId, screenshots);
  }

  console.log(`Extracted ${screenshots.length} screenshots for ${candidate.name}`);
}

async function runSingle(targetSlug: string) {
  const toolResult = await execute(
    `
      SELECT id, slug, name, githubUrl, websiteUrl
      FROM tools
      WHERE slug = ?
      LIMIT 1
    `,
    [targetSlug],
  );

  const toolRow = toolResult.rows[0] as Record<string, unknown> | undefined;

  if (toolRow) {
    await extractForTool(mapToolRow(toolRow));
    return;
  }

  const approvedResult = await execute(`
    SELECT id, name, githubUrl
    FROM discovery_queue
    WHERE status = 'approved'
    ORDER BY starCount DESC, id ASC
  `);

  const approved = approvedResult.rows.map((row) => mapApprovedRow(row as Record<string, unknown>));

  const candidate = approved.find((row) => slugify(row.name) === targetSlug);
  if (!candidate) {
    throw new Error(`No tool or approved candidate found for slug "${targetSlug}"`);
  }

  await extractForApprovedCandidate(candidate);
}

async function runAll() {
  const [publishedResult, approvedResult] = await Promise.all([
    execute(`
      SELECT id, slug, name, githubUrl, websiteUrl
      FROM tools
      WHERE isPublished = 1
      ORDER BY name ASC
    `),
    execute(`
      SELECT id, name, githubUrl
      FROM discovery_queue
      WHERE status = 'approved'
      ORDER BY starCount DESC, id ASC
    `),
  ]);

  const publishedTools = publishedResult.rows.map((row) => mapToolRow(row as Record<string, unknown>));
  const approvedCandidates = approvedResult.rows.map((row) =>
    mapApprovedRow(row as Record<string, unknown>),
  );

  for (const tool of publishedTools) {
    await extractForTool(tool);
  }

  for (const candidate of approvedCandidates) {
    await extractForApprovedCandidate(candidate);
  }
}

async function main() {
  await ensureInitialized();

  const arg = process.argv[2];

  if (!arg) {
    console.error("Usage: node scripts/extract-screenshots.ts <tool-slug|all>");
    process.exitCode = 1;
    return;
  }

  if (arg === "all") {
    await runAll();
    return;
  }

  await runSingle(arg);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[extract-screenshots] Failed: ${message}`);
  process.exitCode = 1;
});
