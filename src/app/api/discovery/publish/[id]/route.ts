import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import type { DiscoveryAiScores, DiscoveryQueueItem } from "@/lib/discovery/types";

export const runtime = "nodejs";

interface PublishRouteContext {
  params: Promise<{ id: string }>;
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

function findUniqueSlug(baseName: string) {
  const baseSlug = slugify(baseName);
  const existsStmt = db.prepare("SELECT id FROM tools WHERE slug = ? LIMIT 1");

  let slug = baseSlug;
  let suffix = 2;

  while (existsStmt.get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function pickCategory(requested: string | null) {
  if (requested) {
    const existing = db
      .prepare("SELECT slug FROM categories WHERE slug = ? LIMIT 1")
      .get(requested) as { slug: string } | undefined;

    if (existing) {
      return existing.slug;
    }
  }

  const fallback = db
    .prepare("SELECT slug FROM categories ORDER BY CASE WHEN slug = 'developer-tools' THEN 0 ELSE 1 END, name ASC LIMIT 1")
    .get() as { slug: string } | undefined;

  return fallback?.slug ?? "developer-tools";
}

function toNumber(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

export async function POST(_: Request, { params }: PublishRouteContext) {
  const { id } = await params;
  const queueId = Number(id);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    return NextResponse.json({ message: "Invalid queue id" }, { status: 400 });
  }

  const candidate = db
    .prepare("SELECT * FROM discovery_queue WHERE id = ? LIMIT 1")
    .get(queueId) as DiscoveryQueueItem | undefined;

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

  const category = pickCategory(candidate.aiCategory);
  const mappedScores = mapDiscoveryScoresToToolScores(aiScores);
  const now = new Date().toISOString();
  const slug = findUniqueSlug(candidate.name || candidate.repoFullName.split("/")[1] || "mac-tool");
  const summary = (candidate.aiSummary ?? candidate.description ?? "").trim();
  const description = (candidate.description ?? candidate.aiSummary ?? "").trim();
  const brewCommand = (candidate.aiBrewCommand ?? "").trim();
  const installInstructions =
    (candidate.aiInstallInstructions ?? "").trim() ||
    "Review the project README for installation instructions.";
  const subcategory = (candidate.aiSubcategory ?? "").trim() || "General";
  const license = candidate.license ?? "Unknown";

  const insertTool = db.prepare(`
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
      @name,
      @slug,
      @description,
      @summary,
      @githubUrl,
      @websiteUrl,
      @category,
      @subcategory,
      @iconUrl,
      @screenshotUrls,
      @brewCommand,
      @installInstructions,
      @score,
      @starCount,
      @forkCount,
      @lastCommitDate,
      @license,
      @createdAt,
      @updatedAt,
      1,
      0
    )
  `);

  const insertScores = db.prepare(`
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

  const publishTx = db.transaction(() => {
    const toolInsertResult = insertTool.run({
      name: candidate.name,
      slug,
      description:
        description ||
        `${candidate.name} is an open-source Mac project discovered by the MacVault pipeline.`,
      summary: summary || description || `${candidate.name} discovered by MacVault.`,
      githubUrl: candidate.githubUrl,
      websiteUrl: candidate.githubUrl,
      category,
      subcategory,
      iconUrl: "",
      screenshotUrls: "[]",
      brewCommand,
      installInstructions,
      score: mappedScores.overallScore,
      starCount: candidate.starCount,
      forkCount: candidate.forkCount,
      lastCommitDate: candidate.lastCommitDate ?? now,
      license,
      createdAt: now,
      updatedAt: now,
    });

    const toolId = toNumber(toolInsertResult.lastInsertRowid);

    insertScores.run({
      toolId,
      ...mappedScores,
    });

    db.prepare("UPDATE discovery_queue SET status = 'published', updatedAt = ? WHERE id = ?").run(now, queueId);

    db.prepare(
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
    ).run(category);

    return { toolId };
  });

  const result = publishTx();

  return NextResponse.json({
    published: true,
    toolId: result.toolId,
    slug,
    category,
  });
}
