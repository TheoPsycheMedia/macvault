import { promises as fs } from "node:fs";
import path from "node:path";

const GITHUB_API_BASE = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_README_SCREENSHOTS = 5;
const MAX_APP_STORE_SCREENSHOTS = 3;

interface GitHubReadmeResponse {
  content?: string;
  encoding?: string;
  download_url?: string;
}

interface ITunesResult {
  trackName?: string;
  screenshotUrls?: string[];
}

interface ITunesSearchResponse {
  results?: ITunesResult[];
}

interface ReadmeImageCandidate {
  altText: string;
  imageUrl: string;
  score: number;
}

function normalizeToolSlug(toolSlug: string) {
  const normalized = toolSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return normalized.replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "tool";
}

function buildToolScreenshotDir(toolSlug: string) {
  return path.join(process.cwd(), "public", "screenshots", toolSlug);
}

async function ensureToolScreenshotDir(toolSlug: string) {
  const screenshotDir = buildToolScreenshotDir(toolSlug);
  await fs.mkdir(screenshotDir, { recursive: true });

  const existingFiles = await fs.readdir(screenshotDir).catch(() => []);
  await Promise.all(
    existingFiles
      .filter((name) => name.startsWith("screenshot-"))
      .map((name) => fs.unlink(path.join(screenshotDir, name)).catch(() => undefined)),
  );

  return screenshotDir;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function buildGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "MacVault-Screenshot-Extractor",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

function parseGitHubRepo(githubUrl: string) {
  try {
    const normalizedUrl = githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`;
    const parsed = new URL(normalizedUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }

    const parts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");

    if (!owner || !repo) {
      return null;
    }

    return { owner, repo, repoFullName: `${owner}/${repo}` };
  } catch {
    return null;
  }
}

function decodeReadmeContent(payload: GitHubReadmeResponse) {
  if (!payload.content) {
    return "";
  }

  if (payload.encoding === "base64") {
    return Buffer.from(payload.content, "base64").toString("utf-8");
  }

  return payload.content;
}

function buildReadmeUrlContext(downloadUrl: string) {
  try {
    const parsed = new URL(downloadUrl);
    const readmeBaseUrl = downloadUrl.slice(0, downloadUrl.lastIndexOf("/") + 1);

    if (parsed.hostname !== "raw.githubusercontent.com") {
      return { readmeBaseUrl, rawRootUrl: readmeBaseUrl };
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 3) {
      return { readmeBaseUrl, rawRootUrl: readmeBaseUrl };
    }

    const rawRootUrl = `${parsed.protocol}//${parsed.host}/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}/`;
    return { readmeBaseUrl, rawRootUrl };
  } catch {
    return { readmeBaseUrl: downloadUrl, rawRootUrl: downloadUrl };
  }
}

function normalizeMarkdownImageRef(rawRef: string) {
  const withoutAngles = rawRef.trim().replace(/^<|>$/g, "");
  const match = withoutAngles.match(/^(\S+)/);
  return (match ? match[1] : withoutAngles).trim();
}

function hasScreenshotKeyword(value: string) {
  return /\b(screenshot|preview|demo|ui|interface|app)\b/i.test(value);
}

function isBadgeLike(altText: string, imageUrl: string, nearbyText: string) {
  const context = `${altText} ${imageUrl} ${nearbyText}`.toLowerCase();

  if (context.includes("shields.io") || context.includes("img.shields.io")) {
    return true;
  }

  if (/\b(badge|build status|coverage|workflow|ci)\b/i.test(context)) {
    return true;
  }

  if (/github\.com\/.+\/actions\/workflows/i.test(context)) {
    return true;
  }

  return false;
}

function isTinyIconReference(altText: string, imageUrl: string) {
  const combined = `${altText} ${imageUrl}`.toLowerCase();

  if (/\b(icon|logo|favicon)\b/i.test(combined)) {
    return true;
  }

  const sizeMatch = imageUrl.match(/(?:^|[^\d])(1[0-9]|[2-4][0-9])x(1[0-9]|[2-4][0-9])(?:[^\d]|$)/);
  if (sizeMatch) {
    return true;
  }

  try {
    const parsed = new URL(imageUrl);
    const width = Number(parsed.searchParams.get("width") ?? parsed.searchParams.get("w") ?? "");
    const height = Number(parsed.searchParams.get("height") ?? parsed.searchParams.get("h") ?? "");

    if ((Number.isFinite(width) && width > 0 && width < 50) || (Number.isFinite(height) && height > 0 && height < 50)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function resolveReadmeImageUrl(imageRef: string, readmeBaseUrl: string, rawRootUrl: string) {
  const normalized = normalizeMarkdownImageRef(imageRef);
  if (!normalized || normalized.startsWith("data:")) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }

  try {
    if (normalized.startsWith("/")) {
      return new URL(normalized.slice(1), rawRootUrl).toString();
    }

    return new URL(normalized, readmeBaseUrl).toString();
  } catch {
    return null;
  }
}

function collectReadmeImages(markdown: string, readmeBaseUrl: string, rawRootUrl: string) {
  const imageRegex = /!\[([^\]]*)\]\(([^)\n]+)\)/g;
  const candidates: ReadmeImageCandidate[] = [];
  const seen = new Set<string>();

  for (const match of markdown.matchAll(imageRegex)) {
    const rawAlt = (match[1] ?? "").trim();
    const rawRef = (match[2] ?? "").trim();
    const index = match.index ?? 0;
    const nearbyStart = Math.max(0, index - 450);
    const nearbyText = markdown.slice(nearbyStart, index + match[0].length).toLowerCase();

    const headingMatches = Array.from(nearbyText.matchAll(/(?:^|\n)#{1,6}\s+([^\n]+)/g));
    const nearbyHeading = headingMatches.at(-1)?.[1] ?? "";

    if (isBadgeLike(rawAlt, rawRef, nearbyText)) {
      continue;
    }

    const resolvedUrl = resolveReadmeImageUrl(rawRef, readmeBaseUrl, rawRootUrl);
    if (!resolvedUrl || seen.has(resolvedUrl)) {
      continue;
    }

    if (isTinyIconReference(rawAlt, resolvedUrl)) {
      continue;
    }

    let score = 1;
    if (hasScreenshotKeyword(rawAlt)) {
      score += 4;
    }
    if (hasScreenshotKeyword(nearbyHeading)) {
      score += 3;
    }
    if (hasScreenshotKeyword(resolvedUrl)) {
      score += 2;
    }
    if (hasScreenshotKeyword(nearbyText)) {
      score += 1;
    }

    seen.add(resolvedUrl);
    candidates.push({
      altText: rawAlt,
      imageUrl: resolvedUrl,
      score,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function extractOgImageFromHtml(html: string, baseUrl: string) {
  const metaTagRegex = /<meta\s+[^>]*>/gi;
  const tags = html.match(metaTagRegex) ?? [];

  for (const tag of tags) {
    const ogImageMatch = tag.match(/\b(?:property|name)=["']og:image(?::secure_url)?["']/i);
    if (!ogImageMatch) {
      continue;
    }

    const contentMatch = tag.match(/\bcontent=["']([^"']+)["']/i);
    if (!contentMatch?.[1]) {
      continue;
    }

    const content = contentMatch[1].trim();
    if (!content) {
      continue;
    }

    try {
      return new URL(content, baseUrl).toString();
    } catch {
      continue;
    }
  }

  return null;
}

function extensionFromContentType(contentType: string | null, imageUrl: string) {
  const normalizedType = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";

  if (normalizedType === "image/png") {
    return "png";
  }

  if (normalizedType === "image/jpeg" || normalizedType === "image/jpg") {
    return "jpg";
  }

  if (normalizedType === "image/webp") {
    return "webp";
  }

  if (normalizedType === "image/gif") {
    return "gif";
  }

  if (normalizedType === "image/svg+xml") {
    return "svg";
  }

  try {
    const pathname = new URL(imageUrl).pathname.toLowerCase();
    if (pathname.endsWith(".png")) {
      return "png";
    }
    if (pathname.endsWith(".webp")) {
      return "webp";
    }
    if (pathname.endsWith(".gif")) {
      return "gif";
    }
    if (pathname.endsWith(".svg")) {
      return "svg";
    }
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
      return "jpg";
    }
  } catch {
    return "png";
  }

  return "png";
}

async function downloadImages(imageUrls: string[], toolSlug: string, limit: number) {
  const savedPaths: string[] = [];
  const screenshotDir = buildToolScreenshotDir(toolSlug);
  let index = 1;

  for (const imageUrl of imageUrls) {
    if (!imageUrl || savedPaths.length >= limit) {
      break;
    }

    try {
      const response = await fetchWithTimeout(
        imageUrl,
        {
          headers: {
            Accept: "image/*",
            "User-Agent": "MacVault-Screenshot-Extractor",
          },
        },
        20_000,
      );

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.toLowerCase().startsWith("image/")) {
        continue;
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());
      if (fileBuffer.byteLength < 1_024) {
        continue;
      }

      const ext = extensionFromContentType(contentType, imageUrl);
      const fileName = `screenshot-${index}.${ext}`;
      const outputPath = path.join(screenshotDir, fileName);

      await fs.writeFile(outputPath, fileBuffer);
      savedPaths.push(`/screenshots/${toolSlug}/${fileName}`);
      index += 1;
    } catch {
      continue;
    }
  }

  return savedPaths;
}

async function extractFromReadme(repoFullName: string, toolSlug: string) {
  const response = await fetchWithTimeout(
    `${GITHUB_API_BASE}/repos/${repoFullName}/readme`,
    {
      headers: buildGitHubHeaders(),
    },
    20_000,
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as GitHubReadmeResponse;
  const markdown = decodeReadmeContent(payload);

  if (!markdown || !payload.download_url) {
    return [];
  }

  const { readmeBaseUrl, rawRootUrl } = buildReadmeUrlContext(payload.download_url);
  const rankedImages = collectReadmeImages(markdown, readmeBaseUrl, rawRootUrl);
  const selected = rankedImages.slice(0, MAX_README_SCREENSHOTS).map((item) => item.imageUrl);

  if (selected.length === 0) {
    return [];
  }

  return downloadImages(selected, toolSlug, MAX_README_SCREENSHOTS);
}

async function extractFromMacAppStore(toolName: string | undefined, toolSlug: string) {
  const queryTerm = (toolName?.trim() || toolSlug.replace(/-/g, " ")).trim();
  if (!queryTerm) {
    return [];
  }

  const response = await fetchWithTimeout(
    `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=macSoftware&limit=3`,
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as ITunesSearchResponse;
  const results = Array.isArray(payload.results) ? payload.results : [];
  const screenshotUrls: string[] = [];

  for (const result of results) {
    if (!Array.isArray(result.screenshotUrls)) {
      continue;
    }

    for (const screenshotUrl of result.screenshotUrls) {
      if (!screenshotUrl || screenshotUrls.includes(screenshotUrl)) {
        continue;
      }

      screenshotUrls.push(screenshotUrl);
      if (screenshotUrls.length >= MAX_APP_STORE_SCREENSHOTS) {
        break;
      }
    }

    if (screenshotUrls.length >= MAX_APP_STORE_SCREENSHOTS) {
      break;
    }
  }

  if (screenshotUrls.length === 0) {
    return [];
  }

  return downloadImages(screenshotUrls, toolSlug, MAX_APP_STORE_SCREENSHOTS);
}

async function extractFromWebsiteOgImage(websiteUrl: string, toolSlug: string) {
  const normalizedWebsite = normalizeWebsiteUrl(websiteUrl);
  if (!normalizedWebsite) {
    return [];
  }

  const response = await fetchWithTimeout(
    normalizedWebsite,
    {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "MacVault-Screenshot-Extractor",
      },
      redirect: "follow",
    },
    20_000,
  );

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const ogImage = extractOgImageFromHtml(html, normalizedWebsite);
  if (!ogImage) {
    return [];
  }

  return downloadImages([ogImage], toolSlug, 1);
}

async function extractFromGitHubSocialPreview(repoFullName: string, toolSlug: string) {
  const pageUrl = `https://github.com/${repoFullName}`;

  const response = await fetchWithTimeout(
    pageUrl,
    {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "MacVault-Screenshot-Extractor",
      },
    },
    20_000,
  );

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const ogImage = extractOgImageFromHtml(html, pageUrl);
  if (!ogImage) {
    return [];
  }

  return downloadImages([ogImage], toolSlug, 1);
}

export async function extractScreenshots(
  toolSlug: string,
  githubUrl: string,
  websiteUrl?: string,
  toolName?: string,
): Promise<string[]> {
  const normalizedSlug = normalizeToolSlug(toolSlug);
  await ensureToolScreenshotDir(normalizedSlug);

  const githubRepo = parseGitHubRepo(githubUrl);
  const repoFullName = githubRepo?.repoFullName ?? null;

  const tiers: Array<() => Promise<string[]>> = [
    async () => (repoFullName ? extractFromReadme(repoFullName, normalizedSlug) : []),
    async () => extractFromMacAppStore(toolName, normalizedSlug),
    async () => (websiteUrl ? extractFromWebsiteOgImage(websiteUrl, normalizedSlug) : []),
    async () => (repoFullName ? extractFromGitHubSocialPreview(repoFullName, normalizedSlug) : []),
  ];

  for (const runTier of tiers) {
    try {
      const screenshots = await runTier();
      if (screenshots.length > 0) {
        return screenshots;
      }
    } catch {
      continue;
    }
  }

  return [];
}
