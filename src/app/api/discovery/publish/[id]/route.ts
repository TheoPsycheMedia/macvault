import { NextResponse } from "next/server";

import { ensureInitialized, execute } from "@/lib/db";
import type { DiscoveryAiScores, DiscoveryQueueItem } from "@/lib/discovery/types";

export const runtime = "nodejs";

interface PublishRouteContext {
  params: Promise<{ id: string }>;
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

function mapQueueItem(row: Record<string, unknown>): DiscoveryQueueItem {
  return {
    id: toNumber(row.id),
    githubUrl: toStringValue(row.githubUrl),
    repoFullName: toStringValue(row.repoFullName),
    name: toStringValue(row.name),
    description: toNullableString(row.description),
    starCount: toNumber(row.starCount),
    forkCount: toNumber(row.forkCount),
    language: toNullableString(row.language),
    lastCommitDate: toNullableString(row.lastCommitDate),
    license: toNullableString(row.license),
    topics: toStringValue(row.topics) || "[]",
    readmeExcerpt: toNullableString(row.readmeExcerpt),
    status: toStringValue(row.status) as DiscoveryQueueItem["status"],
    aiSummary: toNullableString(row.aiSummary),
    aiScores: toNullableString(row.aiScores),
    aiCategory: toNullableString(row.aiCategory),
    aiSubcategory: toNullableString(row.aiSubcategory),
    aiBrewCommand: toNullableString(row.aiBrewCommand),
    aiInstallInstructions: toNullableString(row.aiInstallInstructions),
    evaluatedAt: toNullableString(row.evaluatedAt),
    createdAt: toStringValue(row.createdAt),
    updatedAt: toStringValue(row.updatedAt),
  };
}

function parseScores(value: string | null): DiscoveryAiScores | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as DiscoveryAiScores;
  } catch {
    return null;
  }
}

function roundScore(value: number) {
  return Number(value.toFixed(1));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function mapDiscoveryScoresToToolScores(scores: DiscoveryAiScores) {
  const overall = roundScore(
    average([
      scores.design,
      scores.performance,
      scores.documentation,
      scores.maintenance,
      scores.integration,
      scores.uniqueness,
      scores.value,
      scores.community,
    ]),
  );

  return {
    functionality: roundScore(average([scores.performance, scores.integration, scores.uniqueness])),
    usefulness: roundScore(scores.value),
    visualQuality: roundScore(scores.design),
    installEase: roundScore(average([scores.integration, scores.documentation])),
    maintenanceHealth: roundScore(scores.maintenance),
    documentationQuality: roundScore(scores.documentation),
    appleSiliconSupport: roundScore(average([scores.performance, scores.integration])),
    privacySecurity: roundScore(average([scores.community, scores.maintenance])),
    overallScore: overall,
  };
}

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "mac-tool";
}

async function findUniqueSlug(baseName: string) {
  const baseSlug = slugify(baseName);

  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const exists = await execute("SELECT id FROM tools WHERE slug = ? LIMIT 1", [slug]);
    if (exists.rows.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function pickCategory(requested: string | null) {
  if (requested) {
    const existing = await execute("SELECT slug FROM categories WHERE slug = ? LIMIT 1", [requested]);
    const existingSlug = toStringValue((existing.rows[0] as Record<string, unknown> | undefined)?.slug);

    if (existingSlug) {
      return existingSlug;
    }
  }

  const fallback = await execute(
    "SELECT slug FROM categories ORDER BY CASE WHEN slug = 'developer-tools' THEN 0 ELSE 1 END, name ASC LIMIT 1",
  );

  const fallbackSlug = toStringValue((fallback.rows[0] as Record<string, unknown> | undefined)?.slug);
  return fallbackSlug || "developer-tools";
}

export async function POST(_: Request, { params }: PublishRouteContext) {
  await ensureInitialized();

  const { id } = await params;
  const queueId = Number(id);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    return NextResponse.json({ message: "Invalid queue id" }, { status: 400 });
  }

  const candidateResult = await execute("SELECT * FROM discovery_queue WHERE id = ? LIMIT 1", [queueId]);
  const candidateRow = candidateResult.rows[0] as Record<string, unknown> | undefined;
  const candidate = candidateRow ? mapQueueItem(candidateRow) : undefined;

  if (!candidate) {
    return NextResponse.json({ message: "Discovery item not found" }, { status: 404 });
  }

  if (candidate.status !== "approved") {
    return NextResponse.json({ message: "Only approved items can be published" }, { status: 400 });
  }

  const aiScores = parseScores(candidate.aiScores);
  if (!aiScores) {
    return NextResponse.json({ message: "Missing AI scores for this candidate" }, { status: 400 });
  }

  const category = await pickCategory(candidate.aiCategory);
  const mappedScores = mapDiscoveryScoresToToolScores(aiScores);
  const now = new Date().toISOString();
  const slug = await findUniqueSlug(candidate.name || candidate.repoFullName.split("/")[1] || "mac-tool");
  const summary = (candidate.aiSummary ?? candidate.description ?? "").trim();
  const description = (candidate.description ?? candidate.aiSummary ?? "").trim();
  const brewCommand = (candidate.aiBrewCommand ?? "").trim();
  const installInstructions =
    (candidate.aiInstallInstructions ?? "").trim() ||
    "Review the project README for installation instructions.";
  const subcategory = (candidate.aiSubcategory ?? "").trim() || "General";
  const license = candidate.license ?? "Unknown";

  const toolInsertResult = await execute(
    `
      INSERT INTO tools (
        name,
        slug,
        description,
        summary,
        githubUrl,
        websiteUrl,
        category,
        subcategory,
        iconUrl,
        screenshotUrls,
        brewCommand,
        installInstructions,
        score,
        starCount,
        forkCount,
        lastCommitDate,
        license,
        createdAt,
        updatedAt,
        isPublished,
        isFeatured
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0
      )
    `,
    [
      candidate.name,
      slug,
      description ||
        `${candidate.name} is an open-source Mac project discovered by the MacVault pipeline.`,
      summary || description || `${candidate.name} discovered by MacVault.`,
      candidate.githubUrl,
      candidate.githubUrl,
      category,
      subcategory,
      "",
      "[]",
      brewCommand,
      installInstructions,
      mappedScores.overallScore,
      candidate.starCount,
      candidate.forkCount,
      candidate.lastCommitDate ?? now,
      license,
      now,
      now,
    ],
  );

  let toolId = toNumber(toolInsertResult.lastInsertRowid);

  if (!toolId) {
    const toolIdResult = await execute("SELECT id FROM tools WHERE slug = ? LIMIT 1", [slug]);
    toolId = toNumber((toolIdResult.rows[0] as Record<string, unknown> | undefined)?.id);
  }

  if (!toolId) {
    return NextResponse.json({ message: "Failed to publish tool" }, { status: 500 });
  }

  await execute(
    `
      INSERT INTO scores (
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
    [
      toolId,
      mappedScores.functionality,
      mappedScores.usefulness,
      mappedScores.visualQuality,
      mappedScores.installEase,
      mappedScores.maintenanceHealth,
      mappedScores.documentationQuality,
      mappedScores.appleSiliconSupport,
      mappedScores.privacySecurity,
      mappedScores.overallScore,
    ],
  );

  await execute("UPDATE discovery_queue SET status = 'published', updatedAt = ? WHERE id = ?", [now, queueId]);

  await execute(
    `
      UPDATE categories
      SET toolCount = (
        SELECT COUNT(*)
        FROM tools
        WHERE tools.category = categories.slug
          AND tools.isPublished = 1
      )
      WHERE slug = ?
    `,
    [category],
  );

  return NextResponse.json({
    published: true,
    toolId,
    slug,
    category,
  });
}
