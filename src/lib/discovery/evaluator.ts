import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { db } from "../db";
import type { DiscoveryAiScores, DiscoveryQueueItem, EvaluationResult } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const ANTHROPIC_MODEL = "claude-sonnet-4-6-20250514";

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

interface ClaudeEvaluationPayload {
  isMacTool?: boolean;
  decision?: string;
  reason?: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  brewCommand?: string;
  installInstructions?: string;
  scores?: Partial<DiscoveryAiScores>;
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

function requireAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  return apiKey;
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

function stripMarkdown(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptReadme(readme: string, maxLength = 1200) {
  const plain = stripMarkdown(readme);
  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength - 1)}…`;
}

function safeJsonParse<T>(raw: string) {
  const normalized = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(normalized.slice(start, end + 1)) as T;
    }

    throw new Error("Model response did not contain valid JSON");
  }
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

async function fetchReadme(repoFullName: string, token: string) {
  try {
    const response = await githubFetch(`/repos/${repoFullName}/readme`, token);
    const payload = (await response.json()) as GitHubReadmeResponse;
    return decodeReadme(payload);
  } catch {
    return "";
  }
}

async function fetchRecentCommits(repoFullName: string, token: string) {
  try {
    const response = await githubFetch(`/repos/${repoFullName}/commits?per_page=10`, token);
    const payload = (await response.json()) as GitHubCommitResponse[];
    return Array.isArray(payload) ? payload.slice(0, 10) : [];
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

async function callClaudeEvaluator({
  anthropicApiKey,
  categories,
  candidate,
  readmeText,
  openIssuesCount,
  recentCommits,
}: {
  anthropicApiKey: string;
  categories: string[];
  candidate: DiscoveryQueueItem;
  readmeText: string;
  openIssuesCount: number;
  recentCommits: GitHubCommitResponse[];
}) {
  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });

  const categoryText = categories.join(", ");
  const readmeExcerpt = excerptReadme(readmeText, 5500);
  const commitLines = recentCommits
    .map((commit) => {
      const date = commit.commit?.author?.date ?? "unknown";
      const message = (commit.commit?.message ?? "").split("\n")[0]?.trim() ?? "";
      return `${date} :: ${message}`;
    })
    .slice(0, 10)
    .join("\n");

  const prompt = `
Evaluate this GitHub repository for inclusion in MacVault, a catalog of Mac desktop tools.

Repository:
- Full name: ${candidate.repoFullName}
- Name: ${candidate.name}
- Description: ${candidate.description ?? "N/A"}
- URL: ${candidate.githubUrl}
- Stars: ${candidate.starCount}
- Forks: ${candidate.forkCount}
- Language: ${candidate.language ?? "Unknown"}
- Last commit: ${candidate.lastCommitDate ?? "Unknown"}
- License: ${candidate.license ?? "Unknown"}
- Topics: ${candidate.topics}
- Open issues: ${openIssuesCount}

Recent commits (newest first):
${commitLines || "No commits data found."}

README excerpt:
${readmeExcerpt || "No README found."}

Rules:
- Determine whether this is a real macOS desktop tool.
- Reject if it is primarily a library, SDK, server/backend service, iOS-only app, or non-Mac utility.
- Category must be one of: ${categoryText}
- Scores must be integers from 1 to 10.
- Summary must be 2 to 3 sentences.
- Return ONLY valid JSON (no markdown fences, no prose).

Required JSON:
{
  "isMacTool": boolean,
  "decision": "approved" | "rejected",
  "reason": "short reason",
  "summary": "2-3 sentence summary",
  "category": "one allowed category slug",
  "subcategory": "specific subcategory label",
  "brewCommand": "brew install ... or empty string if unavailable",
  "installInstructions": "concise installation steps for macOS users",
  "scores": {
    "design": 1-10,
    "performance": 1-10,
    "documentation": 1-10,
    "maintenance": 1-10,
    "integration": 1-10,
    "uniqueness": 1-10,
    "value": 1-10,
    "community": 1-10
  }
}
  `.trim();

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1400,
    temperature: 0,
    system:
      "You evaluate open-source repositories for a macOS desktop tool catalog. " +
      "Output strict JSON only with no extra text.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawContent = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!rawContent) {
    throw new Error("Claude API returned an empty response");
  }

  return safeJsonParse<ClaudeEvaluationPayload>(rawContent);
}

function fallbackResult(queueId: number, status: "approved" | "rejected", summary: string): EvaluationResult {
  return {
    queueId,
    status,
    isMacTool: false,
    summary,
    category: "developer-tools",
    subcategory: "Unknown",
    brewCommand: "",
    installInstructions: "Review repository README for installation instructions.",
    scores: { ...DEFAULT_AI_SCORES },
  };
}

export async function evaluateCandidate(queueId: number): Promise<EvaluationResult> {
  const candidate = db
    .prepare("SELECT * FROM discovery_queue WHERE id = ? LIMIT 1")
    .get(queueId) as DiscoveryQueueItem | undefined;

  if (!candidate) {
    throw new Error(`Candidate ${queueId} not found`);
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE discovery_queue SET status = 'evaluating', updatedAt = ? WHERE id = ?").run(now, queueId);

  try {
    const githubToken = requireGitHubToken();
    const anthropicApiKey = requireAnthropicApiKey();

    const categories = db
      .prepare("SELECT slug FROM categories ORDER BY name ASC")
      .all() as Array<{ slug: string }>;
    const categorySlugs = categories.map((row) => row.slug);

    const [readmeText, recentCommits, openIssuesCount] = await Promise.all([
      fetchReadme(candidate.repoFullName, githubToken),
      fetchRecentCommits(candidate.repoFullName, githubToken),
      fetchOpenIssues(candidate.repoFullName, githubToken),
    ]);

    const aiOutput = await callClaudeEvaluator({
      anthropicApiKey,
      categories: categorySlugs,
      candidate,
      readmeText,
      openIssuesCount,
      recentCommits,
    });

    const scores = normalizeScores(aiOutput.scores);
    const isMacTool = Boolean(aiOutput.isMacTool);
    const modelDecision = aiOutput.decision?.toLowerCase() === "approved";
    const finalStatus: "approved" | "rejected" = isMacTool && modelDecision ? "approved" : "rejected";
    const category = normalizeCategory(aiOutput.category, categorySlugs);
    const summary = aiOutput.summary?.trim() || aiOutput.reason?.trim() || "No summary available.";
    const subcategory = aiOutput.subcategory?.trim() || "General";
    const brewCommand = aiOutput.brewCommand?.trim() ?? "";
    const installInstructions =
      aiOutput.installInstructions?.trim() || "Review the project README for installation details.";
    const evaluatedAt = new Date().toISOString();
    const readmeExcerpt = excerptReadme(readmeText, 1200);

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
        readmeExcerpt = @readmeExcerpt,
        evaluatedAt = @evaluatedAt,
        updatedAt = @updatedAt
      WHERE id = @id
    `,
    ).run({
      id: queueId,
      status: finalStatus,
      aiSummary: summary,
      aiScores: JSON.stringify(scores),
      aiCategory: category,
      aiSubcategory: subcategory,
      aiBrewCommand: brewCommand,
      aiInstallInstructions: installInstructions,
      readmeExcerpt,
      evaluatedAt,
      updatedAt: evaluatedAt,
    });

    return {
      queueId,
      status: finalStatus,
      isMacTool,
      summary,
      category,
      subcategory,
      brewCommand,
      installInstructions,
      scores,
    };
  } catch (error) {
    const evaluatedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Unknown evaluation error";

    db.prepare(
      `
      UPDATE discovery_queue
      SET
        status = 'rejected',
        aiSummary = @summary,
        evaluatedAt = @evaluatedAt,
        updatedAt = @updatedAt
      WHERE id = @id
    `,
    ).run({
      id: queueId,
      summary: `Evaluation failed: ${message}`,
      evaluatedAt,
      updatedAt: evaluatedAt,
    });

    return fallbackResult(queueId, "rejected", `Evaluation failed: ${message}`);
  }
}
