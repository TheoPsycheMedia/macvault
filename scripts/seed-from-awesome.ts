import fs from "node:fs";
import path from "node:path";

import { ensureInitialized, execute } from "../src/lib/db-core";

const AWESOME_LIST_SOURCES = [
  "https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/README.md",
  "https://raw.githubusercontent.com/serhii-londar/open-source-mac-os-apps/master/README.md",
];

const GITHUB_API_BASE = "https://api.github.com";
const API_DELAY_MS = 1000;

interface ParsedRepoRef {
  fullName: string;
  owner: string;
  repo: string;
  url: string;
}

interface GitHubLicense {
  spdx_id: string | null;
  name: string | null;
}

interface GitHubRepoResponse {
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeGitHubUrl(url: string) {
  return url.trim().replace(/^http:\/\//i, "https://").replace(/\/+$/, "").toLowerCase();
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function loadEnvFromDotLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const delimiterIndex = trimmed.indexOf("=");
    if (delimiterIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    const valueRaw = trimmed.slice(delimiterIndex + 1).trim();
    if (!key) {
      continue;
    }

    const unquotedValue = valueRaw.replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = unquotedValue;
    }
  }
}

function requireGitHubToken() {
  loadEnvFromDotLocal();

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN. Add it to .env.local.");
  }

  return token;
}

async function fetchMarkdown(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MacVault-Awesome-Seed",
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch awesome list (${response.status}): ${url}`);
  }

  return response.text();
}

function extractRepoRefs(markdown: string) {
  const repoMap = new Map<string, ParsedRepoRef>();
  const regex =
    /(?:https?:\/\/)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:[/?#][^\s)<]*)?/gi;

  let match = regex.exec(markdown);
  while (match) {
    const owner = match[1];
    const repoRaw = match[2].replace(/\.git$/i, "");
    const fullName = `${owner}/${repoRaw}`;
    const normalized = fullName.toLowerCase();

    if (!repoMap.has(normalized)) {
      repoMap.set(normalized, {
        fullName,
        owner,
        repo: repoRaw,
        url: `https://github.com/${owner}/${repoRaw}`,
      });
    }

    match = regex.exec(markdown);
  }

  return Array.from(repoMap.values());
}

async function fetchRepoInfo(fullName: string, token: string) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(fullName).replace("%2F", "/")}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "MacVault-Awesome-Seed",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (response.status === 404 || response.status === 451) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    console.warn(`[seed-from-awesome] GitHub API warning (${response.status}) for ${fullName}: ${body}`);
    return null;
  }

  return (await response.json()) as GitHubRepoResponse;
}

function isRecentlyUpdated(pushedAt: string | null) {
  if (!pushedAt) {
    return false;
  }

  const pushedDate = new Date(pushedAt);
  if (Number.isNaN(pushedDate.getTime())) {
    return false;
  }

  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);

  return pushedDate >= cutoff;
}

function pickLicense(license: GitHubLicense | null) {
  if (!license) {
    return null;
  }

  return license.spdx_id ?? license.name ?? null;
}

async function main() {
  await ensureInitialized();

  const token = requireGitHubToken();
  const markdownBodies = await Promise.all(AWESOME_LIST_SOURCES.map((url) => fetchMarkdown(url)));

  const extractedRepoMap = new Map<string, ParsedRepoRef>();
  for (const markdown of markdownBodies) {
    for (const repoRef of extractRepoRefs(markdown)) {
      extractedRepoMap.set(repoRef.fullName.toLowerCase(), repoRef);
    }
  }

  const existingRows = await execute(`
    SELECT githubUrl FROM tools
    UNION
    SELECT githubUrl FROM discovery_queue
  `);

  const knownUrls = new Set(
    existingRows.rows
      .map((row) => normalizeGitHubUrl(toStringValue((row as Record<string, unknown>).githubUrl)))
      .filter(Boolean),
  );

  let addedCount = 0;
  let skippedExisting = 0;
  let skippedLowStarsOrInactive = 0;

  for (const repoRef of extractedRepoMap.values()) {
    const normalizedSourceUrl = normalizeGitHubUrl(repoRef.url);

    if (knownUrls.has(normalizedSourceUrl)) {
      skippedExisting += 1;
      console.log(`Skipped: ${repoRef.fullName} (already exists)`);
      continue;
    }

    const repoInfo = await fetchRepoInfo(repoRef.fullName, token);
    await sleep(API_DELAY_MS);

    if (!repoInfo) {
      skippedLowStarsOrInactive += 1;
      console.log(`Skipped: ${repoRef.fullName} (low stars/inactive)`);
      continue;
    }

    if (repoInfo.stargazers_count <= 50 || !isRecentlyUpdated(repoInfo.pushed_at)) {
      skippedLowStarsOrInactive += 1;
      console.log(`Skipped: ${repoRef.fullName} (low stars/inactive)`);
      continue;
    }

    const now = new Date().toISOString();
    const insertResult = await execute(
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
        repoInfo.html_url,
        repoInfo.full_name,
        repoInfo.name,
        repoInfo.description,
        repoInfo.stargazers_count,
        repoInfo.forks_count,
        repoInfo.language,
        repoInfo.pushed_at,
        pickLicense(repoInfo.license),
        JSON.stringify(Array.isArray(repoInfo.topics) ? repoInfo.topics : []),
        now,
        now,
      ],
    );

    if (Number(insertResult.rowsAffected ?? 0) > 0) {
      addedCount += 1;
      knownUrls.add(normalizeGitHubUrl(repoInfo.html_url));
      console.log(`Added: ${repoInfo.full_name} (★ ${repoInfo.stargazers_count})`);
    } else {
      skippedExisting += 1;
      console.log(`Skipped: ${repoRef.fullName} (already exists)`);
    }
  }

  console.log(
    `Done: ${addedCount} new candidates added, ${skippedExisting} skipped (existing), ${skippedLowStarsOrInactive} skipped (low stars/inactive)`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[seed-from-awesome] Failed: ${message}`);
  process.exitCode = 1;
});
