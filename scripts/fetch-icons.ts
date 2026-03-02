import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "MacVault-Icon-Fetcher";

interface ToolRow {
  id: number;
  name: string;
  githubUrl: string;
  websiteUrl: string | null;
  iconUrl: string | null;
}

interface GitHubRepoResponse {
  owner?: {
    avatar_url?: string | null;
  };
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

function requireEnv(name: "TURSO_DATABASE_URL" | "TURSO_AUTH_TOKEN" | "GITHUB_TOKEN") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function parseGitHubRepo(githubUrl: string): { owner: string; repo: string } | null {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  const owner = match[1].trim();
  const repo = match[2].replace(/\.git$/i, "").trim();
  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

async function fetchGitHubAvatar(owner: string, repo: string, githubToken: string) {
  const repoUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const tokenResponse = await fetch(repoUrl, {
    headers: {
      ...baseHeaders,
      Authorization: `Bearer ${githubToken}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  let response = tokenResponse;
  if (tokenResponse.status === 401 || tokenResponse.status === 403) {
    response = await fetch(repoUrl, {
      headers: baseHeaders,
      signal: AbortSignal.timeout(10000),
    });
  }

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GitHubRepoResponse;
  const avatarUrl = payload.owner?.avatar_url;
  return typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl : null;
}

function normalizeWebsiteUrl(input: string | null) {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function extractIconCandidates(html: string, baseUrl: string) {
  const candidates = new Set<string>();
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch || !/\bicon\b/i.test(relMatch[1])) {
      continue;
    }

    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) {
      continue;
    }

    const href = hrefMatch[1].trim();
    if (!href || href.startsWith("data:")) {
      continue;
    }

    try {
      candidates.add(new URL(href, baseUrl).toString());
    } catch {
      continue;
    }
  }

  try {
    const base = new URL(baseUrl);
    candidates.add(new URL("/favicon.ico", base.origin).toString());
  } catch {
    // No-op for invalid URLs.
  }

  return Array.from(candidates);
}

async function isUsableIconUrl(iconUrl: string) {
  const requestInit = {
    redirect: "follow" as const,
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/*,*/*;q=0.8",
    },
  };

  const headResponse = await fetch(iconUrl, {
    ...requestInit,
    method: "HEAD",
  });

  if (headResponse.ok) {
    const contentType = (headResponse.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.startsWith("image/") || contentType.includes("icon")) {
      return true;
    }

    if (!contentType && /\.(?:ico|png|svg|jpe?g|webp)(?:$|[?#])/i.test(iconUrl)) {
      return true;
    }
  }

  if (headResponse.status === 405 || headResponse.status === 403 || !headResponse.ok) {
    const getResponse = await fetch(iconUrl, {
      ...requestInit,
      method: "GET",
    });

    if (!getResponse.ok) {
      return false;
    }

    const contentType = (getResponse.headers.get("content-type") ?? "").toLowerCase();
    return contentType.startsWith("image/") || contentType.includes("icon");
  }

  return false;
}

async function fetchWebsiteIcon(websiteUrl: string | null) {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
  if (!normalizedUrl) {
    return null;
  }

  let html = "";
  let finalUrl = normalizedUrl;

  try {
    const response = await fetch(normalizedUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,*/*;q=0.9",
      },
    });

    if (response.ok) {
      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      if (contentType.includes("text/html")) {
        html = await response.text();
        finalUrl = response.url || normalizedUrl;
      } else {
        finalUrl = response.url || normalizedUrl;
      }
    }
  } catch {
    // Ignore website fetch failures; favicon fallback may still work.
  }

  const candidates = extractIconCandidates(html, finalUrl);

  for (const candidate of candidates) {
    try {
      if (await isUsableIconUrl(candidate)) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function mapToolRow(row: Record<string, unknown>): ToolRow {
  return {
    id: toNumber(row.id),
    name: toStringValue(row.name),
    githubUrl: toStringValue(row.githubUrl),
    websiteUrl: toNullableString(row.websiteUrl),
    iconUrl: toNullableString(row.iconUrl),
  };
}

async function main() {
  loadEnvFromDotLocal();

  const databaseUrl = requireEnv("TURSO_DATABASE_URL");
  const authToken = requireEnv("TURSO_AUTH_TOKEN");
  const githubToken = requireEnv("GITHUB_TOKEN");

  const db = createClient({
    url: databaseUrl,
    authToken,
  });

  const toolsResult = await db.execute(`
    SELECT id, name, githubUrl, websiteUrl, iconUrl
    FROM tools
    WHERE isPublished = 1
    ORDER BY id ASC
  `);

  const tools = toolsResult.rows.map((row) => mapToolRow(row as Record<string, unknown>));
  console.log(`Found ${tools.length} published tools.`);

  let updatedCount = 0;
  let unchangedCount = 0;
  let missingCount = 0;
  let githubCount = 0;
  let websiteCount = 0;

  for (const tool of tools) {
    let nextIconUrl: string | null = null;
    let source: "github" | "website" | null = null;

    const repoRef = parseGitHubRepo(tool.githubUrl);
    if (repoRef) {
      try {
        nextIconUrl = await fetchGitHubAvatar(repoRef.owner, repoRef.repo, githubToken);
        if (nextIconUrl) {
          source = "github";
        }
      } catch {
        nextIconUrl = null;
      }
    }

    if (!nextIconUrl) {
      try {
        nextIconUrl = await fetchWebsiteIcon(tool.websiteUrl);
        if (nextIconUrl) {
          source = "website";
        }
      } catch {
        nextIconUrl = null;
      }
    }

    if (!nextIconUrl) {
      missingCount += 1;
      console.log(`[missing] ${tool.name}`);
      continue;
    }

    if (tool.iconUrl === nextIconUrl) {
      unchangedCount += 1;
      console.log(`[unchanged] ${tool.name} (${source})`);
      continue;
    }

    await db.execute({
      sql: "UPDATE tools SET iconUrl = ?, updatedAt = ? WHERE id = ?",
      args: [nextIconUrl, new Date().toISOString(), tool.id],
    });

    updatedCount += 1;
    if (source === "github") {
      githubCount += 1;
    } else if (source === "website") {
      websiteCount += 1;
    }

    console.log(`[updated] ${tool.name} -> ${source}: ${nextIconUrl}`);
  }

  console.log("");
  console.log("Icon fetch complete.");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Unchanged: ${unchangedCount}`);
  console.log(`Missing icon source: ${missingCount}`);
  console.log(`Sources used -> GitHub: ${githubCount}, Website: ${websiteCount}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[fetch-icons] Failed: ${message}`);
  process.exitCode = 1;
});
