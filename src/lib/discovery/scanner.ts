import { execute } from "../db-core";

const GITHUB_API_BASE = "https://api.github.com";
const SEARCH_PAGE_SIZE = 100;
const MAX_SEARCH_PAGES = 3;
const INTER_PAGE_DELAY_MS = 700;

const MAC_TOPIC_QUERY =
  "(topic:macos OR topic:mac OR topic:menubar OR topic:swiftui OR topic:homebrew OR topic:apple-silicon OR topic:macapp)";

interface GitHubLicense {
  spdx_id: string | null;
  name: string | null;
}

interface GitHubRepo {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string | null;
  license: GitHubLicense | null;
  topics?: string[];
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

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

function normalizeGitHubUrl(url: string) {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
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
      "User-Agent": "MacVault-Discovery-Scanner",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  await respectRateLimit(response.headers);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${errorText}`);
  }

  return response;
}

async function searchRepositories(query: string, token: string) {
  const collected: GitHubRepo[] = [];

  for (let page = 1; page <= MAX_SEARCH_PAGES; page += 1) {
    const searchPath = `/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`;
    const response = await githubFetch(searchPath, token);
    const payload = (await response.json()) as GitHubSearchResponse;
    const items = Array.isArray(payload.items) ? payload.items : [];

    collected.push(...items);

    if (items.length < SEARCH_PAGE_SIZE) {
      break;
    }

    await sleep(INTER_PAGE_DELAY_MS);
  }

  return collected;
}

function parsePushedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickLicense(license: GitHubLicense | null) {
  if (!license) {
    return null;
  }

  return license.spdx_id ?? license.name ?? null;
}

function uniqueRepos(repos: GitHubRepo[]) {
  const byFullName = new Map<string, GitHubRepo>();

  for (const repo of repos) {
    byFullName.set(repo.full_name.toLowerCase(), repo);
  }

  return Array.from(byFullName.values());
}

export async function scanGitHub() {
  const token = requireGitHubToken();
  const pushedAfter = isoDateDaysAgo(90);

  const existing = await execute(`
    SELECT githubUrl FROM tools
    UNION
    SELECT githubUrl FROM discovery_queue
  `);

  const knownUrls = new Set(
    existing.rows
      .map((row) => normalizeGitHubUrl(toStringValue((row as Record<string, unknown>).githubUrl)))
      .filter(Boolean),
  );

  const topicQuery = `${MAC_TOPIC_QUERY} stars:>50 pushed:>=${pushedAfter} archived:false`;
  const topicRepos = await searchRepositories(topicQuery, token);

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 90);

  const now = new Date().toISOString();
  let insertedCount = 0;

  for (const repo of uniqueRepos(topicRepos)) {
    const normalizedUrl = normalizeGitHubUrl(repo.html_url);
    const pushedAt = parsePushedAt(repo.pushed_at);

    if (knownUrls.has(normalizedUrl)) {
      continue;
    }

    if (repo.stargazers_count <= 50) {
      continue;
    }

    if (!pushedAt || pushedAt < cutoff) {
      continue;
    }

    const result = await execute(
      `
        INSERT OR IGNORE INTO discovery_queue (
          githubUrl,
          repoFullName,
          name,
          description,
          starCount,
          forkCount,
          language,
          lastCommitDate,
          license,
          topics,
          status,
          createdAt,
          updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?
        )
      `,
      [
        repo.html_url,
        repo.full_name,
        repo.name,
        repo.description,
        repo.stargazers_count,
        repo.forks_count,
        repo.language,
        pushedAt.toISOString(),
        pickLicense(repo.license),
        JSON.stringify(Array.isArray(repo.topics) ? repo.topics : []),
        now,
        now,
      ],
    );

    if (Number(result.rowsAffected ?? 0) > 0) {
      insertedCount += 1;
      knownUrls.add(normalizedUrl);
    }
  }

  return insertedCount;
}
