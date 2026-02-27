import { NextResponse } from "next/server";

import { ensureInitialized } from "@/lib/db";
import { isCronAuthorized } from "@/lib/discovery/auth";
import { saveCandidateEvaluation } from "@/lib/discovery/evaluator";
import type { DiscoveryAiScores, EvaluationResult } from "@/lib/discovery/types";

export const runtime = "nodejs";

const scoreKeys: Array<keyof DiscoveryAiScores> = [
  "design",
  "performance",
  "documentation",
  "maintenance",
  "integration",
  "uniqueness",
  "value",
  "community",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseScores(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const parsed = {} as DiscoveryAiScores;

  for (const key of scoreKeys) {
    const score = Number(value[key]);
    if (!Number.isFinite(score)) {
      return null;
    }

    parsed[key] = score;
  }

  return parsed;
}

function parseEvaluationBody(body: unknown): { queueId: number; evaluation: EvaluationResult } | null {
  if (!isRecord(body)) {
    return null;
  }

  const queueId = Number(body.queueId);
  const summary = typeof body.summary === "string" ? body.summary : null;
  const category = typeof body.category === "string" ? body.category : null;
  const isApproved = typeof body.isApproved === "boolean" ? body.isApproved : null;
  const scores = parseScores(body.scores);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    return null;
  }

  if (!summary || !category || isApproved === null || !scores) {
    return null;
  }

  const evaluation: EvaluationResult = {
    summary,
    scores,
    category,
    subcategory: typeof body.subcategory === "string" ? body.subcategory : undefined,
    brewCommand: typeof body.brewCommand === "string" ? body.brewCommand : undefined,
    installInstructions:
      typeof body.installInstructions === "string" ? body.installInstructions : undefined,
    isApproved,
  };

  return {
    queueId,
    evaluation,
  };
}

export async function POST(request: Request) {
  await ensureInitialized();

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseEvaluationBody(payload);
  if (!parsed) {
    return NextResponse.json(
      {
        message:
          "Body must include queueId, summary, scores, category, and isApproved (plus optional subcategory, brewCommand, installInstructions).",
      },
      { status: 400 },
    );
  }

  try {
    const saved = await saveCandidateEvaluation(parsed.queueId, parsed.evaluation);
    return NextResponse.json({ saved: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save evaluation";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
