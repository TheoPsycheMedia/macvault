import "server-only";

import { db } from "../db";
import type {
  CandidateContext,
  DiscoveryAiScores,
  DiscoveryCommitContext,
  DiscoveryQueueItem,
  EvaluationResult,
} from "./types";

const GITHUB_API_BASE = "https://api.github.com";

interface GitHubReadmeResponse {
  content?: string;
  encoding?: string;
}

interface GitHubCommitResponse {
  sha: string;
  commit?: {
    message?: string;
    author?: {
      date?: string;
    };
  };
}

interface GitHubRepoResponse {
  open_issues_count?: number;
}

const DEFAULT_AI_SCORES: DiscoveryAiScores = {
  design: 5,
  performance: 5,
  documentation: 5,
  maintenance: 5,
  integration: 5,
  uniqueness: 5,
  value: 5,
  community: 5,
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requireGitHubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  return token;
}

async function respectRateLimit(headers: Headers) {
  const remaining = Number(headers.get("x-ratelimit-remaining") ?? "");
  const reset = Number(headers.get("x-ratelimit-reset") ?? "");

  if (Number.isFinite(remaining) && remaining <= 0 && Number.isFinite(reset)) {
    const waitMs = Math.max(0, reset * 1000 - Date.now()) + 1000;
    await sleep(waitMs);
  }
}

async function githubFetch(path: string, token: string) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "MacVault-Discovery-Evaluator",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  await respectRateLimit(response.headers);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${text}`);
  }

  return response;
}

function decodeReadme(payload: GitHubReadmeResponse) {
  if (!payload.content) {
    return "";
  }

  if (payload.encoding !== "base64") {
    return payload.content;
  }

  return Buffer.from(payload.content, "base64").toString("utf-8");
}

function clampScore(value: number | undefined) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 5;
  }

  return Math.max(1, Math.min(10, numberValue));
}

function normalizeScores(scores: Partial<DiscoveryAiScores> | undefined): DiscoveryAiScores {
  return {
    design: clampScore(scores?.design),
    performance: clampScore(scores?.performance),
    documentation: clampScore(scores?.documentation),
    maintenance: clampScore(scores?.maintenance),
    integration: clampScore(scores?.integration),
    uniqueness: clampScore(scores?.uniqueness),
    value: clampScore(scores?.value),
    community: clampScore(scores?.community),
  };
}

function normalizeCategory(category: string | undefined, allowed: string[]) {
  if (!category) {
    return allowed[0] ?? "developer-tools";
  }

  const normalized = category.trim().toLowerCase();
  if (allowed.includes(normalized)) {
    return normalized;
  }

  return allowed[0] ?? "developer-tools";
}

function normalizeText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

async function fetchReadme(repoFullName: string, token: string) {
  try {
    const response = await githubFetch(`/repos/${repoFullName}/readme`, token);
    const payload = (await response.json()) as GitHubReadmeResponse;
    return decodeReadme(payload);
  } catch {
    return "";
  }
}

async function fetchRecentCommits(repoFullName: string, token: string): Promise<DiscoveryCommitContext[]> {
  try {
    const response = await githubFetch(`/repos/${repoFullName}/commits?per_page=10`, token);
    const payload = (await response.json()) as GitHubCommitResponse[];
    const commits = Array.isArray(payload) ? payload.slice(0, 10) : [];

    return commits.map((commit) => ({
      sha: commit.sha,
      message: (commit.commit?.message ?? "").split("\n")[0]?.trim() || "",
      date: commit.commit?.author?.date ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchOpenIssues(repoFullName: string, token: string) {
  try {
    const response = await githubFetch(`/repos/${repoFullName}`, token);
    const payload = (await response.json()) as GitHubRepoResponse;
    return Number(payload.open_issues_count ?? 0);
  } catch {
    return 0;
  }
}

function getCandidate(queueId: number) {
  return db
    .prepare("SELECT * FROM discovery_queue WHERE id = ? LIMIT 1")
    .get(queueId) as DiscoveryQueueItem | undefined;
}

function getCategorySlugs() {
  const categories = db
    .prepare("SELECT slug FROM categories ORDER BY name ASC")
    .all() as Array<{ slug: string }>;

  return categories.map((row) => row.slug);
}

export async function fetchCandidateContext(queueId: number): Promise<CandidateContext> {
  const candidate = getCandidate(queueId);
  if (!candidate) {
    throw new Error(`Candidate ${queueId} not found`);
  }

  const githubToken = requireGitHubToken();

  const [readme, recentCommits, openIssuesCount] = await Promise.all([
    fetchReadme(candidate.repoFullName, githubToken),
    fetchRecentCommits(candidate.repoFullName, githubToken),
    fetchOpenIssues(candidate.repoFullName, githubToken),
  ]);

  return {
    candidate,
    readme,
    recentCommits,
    openIssuesCount,
  };
}

export function saveCandidateEvaluation(queueId: number, evaluation: EvaluationResult) {
  const candidate = getCandidate(queueId);
  if (!candidate) {
    throw new Error(`Candidate ${queueId} not found`);
  }

  const categorySlugs = getCategorySlugs();
  const status = evaluation.isApproved ? "approved" : "rejected";
  const evaluatedAt = new Date().toISOString();
  const summary = normalizeText(evaluation.summary, "No summary available.");
  const scores = normalizeScores(evaluation.scores ?? DEFAULT_AI_SCORES);
  const category = normalizeCategory(evaluation.category, categorySlugs);
  const subcategory = normalizeText(evaluation.subcategory, "General");
  const brewCommand = normalizeText(evaluation.brewCommand, "");
  const installInstructions = normalizeText(
    evaluation.installInstructions,
    "Review the project README for installation instructions.",
  );

  db.prepare(
    `
      UPDATE discovery_queue
      SET
        status = @status,
        aiSummary = @aiSummary,
        aiScores = @aiScores,
        aiCategory = @aiCategory,
        aiSubcategory = @aiSubcategory,
        aiBrewCommand = @aiBrewCommand,
        aiInstallInstructions = @aiInstallInstructions,
        evaluatedAt = @evaluatedAt,
        updatedAt = @updatedAt
      WHERE id = @id
    `,
  ).run({
    id: queueId,
    status,
    aiSummary: summary,
    aiScores: JSON.stringify(scores),
    aiCategory: category,
    aiSubcategory: subcategory,
    aiBrewCommand: brewCommand,
    aiInstallInstructions: installInstructions,
    evaluatedAt,
    updatedAt: evaluatedAt,
  });

  return {
    queueId,
    status,
  };
}
