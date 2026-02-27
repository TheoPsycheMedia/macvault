import { db } from "../src/lib/db-core";
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

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "tool";
}

function updateToolScreenshots(toolId: number, screenshotPaths: string[]) {
  db.prepare("UPDATE tools SET screenshotUrls = ?, updatedAt = ? WHERE id = ?").run(
    JSON.stringify(screenshotPaths),
    new Date().toISOString(),
    toolId,
  );
}

async function extractForTool(tool: ToolRow) {
  const screenshots = await extractScreenshots(
    tool.slug,
    tool.githubUrl,
    tool.websiteUrl ?? undefined,
    tool.name,
  );

  if (screenshots.length > 0) {
    updateToolScreenshots(tool.id, screenshots);
  }

  console.log(`Extracted ${screenshots.length} screenshots for ${tool.name}`);
}

async function extractForApprovedCandidate(candidate: ApprovedQueueRow) {
  const derivedSlug = slugify(candidate.name);
  const screenshots = await extractScreenshots(derivedSlug, candidate.githubUrl, undefined, candidate.name);

  const existingTool = db
    .prepare("SELECT id FROM tools WHERE lower(githubUrl) = lower(?) LIMIT 1")
    .get(candidate.githubUrl) as { id: number } | undefined;

  if (existingTool && screenshots.length > 0) {
    updateToolScreenshots(existingTool.id, screenshots);
  }

  console.log(`Extracted ${screenshots.length} screenshots for ${candidate.name}`);
}

async function runSingle(targetSlug: string) {
  const tool = db
    .prepare(
      `
      SELECT id, slug, name, githubUrl, websiteUrl
      FROM tools
      WHERE slug = ?
      LIMIT 1
    `,
    )
    .get(targetSlug) as ToolRow | undefined;

  if (tool) {
    await extractForTool(tool);
    return;
  }

  const approved = db
    .prepare(
      `
      SELECT id, name, githubUrl
      FROM discovery_queue
      WHERE status = 'approved'
      ORDER BY starCount DESC, id ASC
    `,
    )
    .all() as ApprovedQueueRow[];

  const candidate = approved.find((row) => slugify(row.name) === targetSlug);
  if (!candidate) {
    throw new Error(`No tool or approved candidate found for slug "${targetSlug}"`);
  }

  await extractForApprovedCandidate(candidate);
}

async function runAll() {
  const publishedTools = db
    .prepare(
      `
      SELECT id, slug, name, githubUrl, websiteUrl
      FROM tools
      WHERE isPublished = 1
      ORDER BY name ASC
    `,
    )
    .all() as ToolRow[];

  const approvedCandidates = db
    .prepare(
      `
      SELECT id, name, githubUrl
      FROM discovery_queue
      WHERE status = 'approved'
      ORDER BY starCount DESC, id ASC
    `,
    )
    .all() as ApprovedQueueRow[];

  for (const tool of publishedTools) {
    await extractForTool(tool);
  }

  for (const candidate of approvedCandidates) {
    await extractForApprovedCandidate(candidate);
  }
}

async function main() {
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
