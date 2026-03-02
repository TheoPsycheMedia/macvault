import { promises as fs } from "node:fs";
import path from "node:path";

import { createClient, type Client, type InValue } from "@libsql/client";
import sharp from "sharp";

const USER_AGENT = "MacVault-Screenshot-Rebuilder/1.0";
const GITHUB_API_BASE = "https://api.github.com";

const SCREENSHOT_ROOT = path.join(process.cwd(), "public", "screenshots");
const TRACKER_PATH = "/Users/edgariraheta/.openclaw/workspace/memory/macvault-screenshot-tracker.md";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_SCREENSHOTS_PER_TOOL = 3;
const MAX_README_CANDIDATES = 16;
const MAX_WEBSITE_CANDIDATES = 16;
const MAX_APP_STORE_CANDIDATES = 12;
const MAX_DOWNLOAD_BYTES = 40 * 1024 * 1024;

const MIN_FILE_BYTES = 10 * 1024;
const MIN_WIDTH = 401;
const MIN_HEIGHT = 251;
const MAX_OUTPUT_WIDTH = 800;
const JPEG_QUALITY = 85;
const README_WIDE_IMAGE_MIN_WIDTH = 601;

const WEBSITE_IMAGE_MIN_WIDTH = 401;
const APP_STORE_TRACK_MATCH_THRESHOLD = 0.72;

type SourceType = "website" | "readme" | "app-store" | "none";

interface ToolRow {
  id: number;
  slug: string;
  name: string;
  githubUrl: string;
  websiteUrl: string | null;
}

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

interface ImageCandidate {
  source: Exclude<SourceType, "none">;
  url: string;
  score: number;
  keywordMatch: boolean;
  minWidth: number;
  reason: string;
}

interface ProcessResult {
  source: SourceType;
  screenshotPaths: string[];
  note: string;
}

interface ReadmeImageReference {
  rawAlt: string;
  rawRef: string;
  index: number;
  rawMatch: string;
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

function mapToolRow(row: Record<string, unknown>): ToolRow {
  return {
    id: toNumber(row.id),
    slug: toStringValue(row.slug),
    name: toStringValue(row.name),
    githubUrl: toStringValue(row.githubUrl),
    websiteUrl: toNullableString(row.websiteUrl),
  };
}

function loadEnvFromDotLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  return fs
    .readFile(envPath, "utf8")
    .then((raw) => {
      const lines = raw.split(/\r?\n/);

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        const delimiterIndex = trimmed.indexOf("=");
        if (delimiterIndex <= 0) {
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
    })
    .catch(() => undefined);
}

function requireEnv(name: "TURSO_DATABASE_URL" | "TURSO_AUTH_TOKEN") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function normalizeToolSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "tool";
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

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenizeName(value: string) {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function fuzzyNameScore(toolName: string, trackName: string) {
  const left = normalizeName(toolName);
  const right = normalizeName(trackName);

  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return 0.93;
  }

  const leftTokens = tokenizeName(left);
  const rightTokens = tokenizeName(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);

  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  const maxLen = Math.max(left.length, right.length);
  const levenshteinSimilarity = maxLen > 0 ? 1 - levenshteinDistance(left, right) / maxLen : 0;

  const overlapRatio = intersection / Math.max(leftSet.size, rightSet.size);

  return Math.max(jaccard, levenshteinSimilarity * 0.85, overlapRatio * 0.95);
}

function extractAttribute(tag: string, name: string) {
  const regex = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(regex);
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function pickBestSrcFromSrcSet(srcset: string) {
  const entries = srcset
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return null;
  }

  let bestUrl = "";
  let bestWidth = 0;

  for (const entry of entries) {
    const [urlPart, descriptorPart] = entry.split(/\s+/, 2);
    const url = (urlPart ?? "").trim();
    if (!url) {
      continue;
    }

    const widthMatch = descriptorPart?.match(/(\d+)w/i);
    const width = widthMatch ? Number(widthMatch[1]) : 0;

    if (!bestUrl || width > bestWidth) {
      bestUrl = url;
      bestWidth = width;
    }
  }

  return bestUrl || null;
}

function hasScreenshotKeyword(value: string) {
  if (/(screenshot|screen[\s\-_]?shot|preview|demo|desktop|interface|window|product[\s\-_]?shot|ui)/i.test(value)) {
    return true;
  }

  return /\bapp\b/i.test(value);
}

function hasDiagramKeyword(value: string) {
  return /\b(architecture|diagram|flowchart|sequence|uml|entity\s*relationship|graph|mermaid|topology|chart)\b/i.test(value);
}

function hasContributorGraphKeyword(value: string) {
  return /\b(contributor(s)?|stargazer(s)?|stars-history|commit-activity|activity-graph|traffic)\b/i.test(value);
}

function hasLogoKeyword(value: string) {
  return /\b(logo|icon|favicon|wordmark|brand|avatar)\b/i.test(value);
}

function isShieldLikeUrl(imageUrl: string) {
  return /(?:^|\.)shields\.io\b|\bimg\.shields\.io\b/i.test(imageUrl);
}

function isForbiddenReadmeCandidate(context: string) {
  if (isShieldLikeUrl(context)) {
    return true;
  }

  if (/\b(badge|build\s*status|coverage|workflow|ci|pipeline)\b/i.test(context)) {
    return true;
  }

  if (hasLogoKeyword(context)) {
    return true;
  }

  if (hasDiagramKeyword(context)) {
    return true;
  }

  if (hasContributorGraphKeyword(context)) {
    return true;
  }

  return false;
}

function parseGitHubRepo(githubUrl: string) {
  try {
    const normalized = githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`;
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean).slice(0, 2);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0]?.trim();
    const repo = parts[1]?.replace(/\.git$/i, "").trim();

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo,
      repoFullName: `${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

function decodeReadmeContent(payload: GitHubReadmeResponse) {
  if (!payload.content) {
    return "";
  }

  if (payload.encoding === "base64") {
    return Buffer.from(payload.content, "base64").toString("utf8");
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

function resolveImageUrl(imageRef: string, baseUrl: string, rawRootUrl: string) {
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

    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
}

function buildGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
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

function collectMarkdownImageRefs(markdown: string): ReadmeImageReference[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)\n]+)\)/g;
  const refs: ReadmeImageReference[] = [];

  for (const match of markdown.matchAll(imageRegex)) {
    refs.push({
      rawAlt: (match[1] ?? "").trim(),
      rawRef: (match[2] ?? "").trim(),
      index: match.index ?? 0,
      rawMatch: match[0] ?? "",
    });
  }

  return refs;
}

function collectHtmlImageRefs(markdown: string): ReadmeImageReference[] {
  const imgTagRegex = /<img\b[^>]*>/gi;
  const refs: ReadmeImageReference[] = [];

  for (const match of markdown.matchAll(imgTagRegex)) {
    const tag = match[0] ?? "";
    const rawRef = extractAttribute(tag, "src");

    if (!rawRef) {
      continue;
    }

    refs.push({
      rawAlt: extractAttribute(tag, "alt"),
      rawRef,
      index: match.index ?? 0,
      rawMatch: tag,
    });
  }

  return refs;
}

function parseWidthHint(tagOrUrl: string) {
  const widthAttrMatch = tagOrUrl.match(/\bwidth\s*=\s*(?:"(\d+)"|'(\d+)'|(\d+))/i);
  const widthAttr = Number(widthAttrMatch?.[1] ?? widthAttrMatch?.[2] ?? widthAttrMatch?.[3] ?? "");
  if (Number.isFinite(widthAttr) && widthAttr > 0) {
    return widthAttr;
  }

  const styleWidthMatch = tagOrUrl.match(/width\s*:\s*(\d+)px/i);
  const styleWidth = Number(styleWidthMatch?.[1] ?? "");
  if (Number.isFinite(styleWidth) && styleWidth > 0) {
    return styleWidth;
  }

  const sizePatternMatch = tagOrUrl.match(/(?:^|[^\d])(\d{3,4})x(\d{2,4})(?:[^\d]|$)/i);
  const sizeWidth = Number(sizePatternMatch?.[1] ?? "");
  if (Number.isFinite(sizeWidth) && sizeWidth > 0) {
    return sizeWidth;
  }

  try {
    const parsed = new URL(tagOrUrl);
    const widthQuery = parsed.searchParams.get("width") ?? parsed.searchParams.get("w");
    const widthFromQuery = Number(widthQuery ?? "");

    if (Number.isFinite(widthFromQuery) && widthFromQuery > 0) {
      return widthFromQuery;
    }
  } catch {
    return 0;
  }

  return 0;
}

function dedupeCandidates(candidates: ImageCandidate[]) {
  const byUrl = new Map<string, ImageCandidate>();

  for (const candidate of candidates) {
    const existing = byUrl.get(candidate.url);

    if (!existing || candidate.score > existing.score) {
      byUrl.set(candidate.url, candidate);
    }
  }

  return Array.from(byUrl.values()).sort((a, b) => b.score - a.score);
}

function parseMetaImageCandidates(html: string, baseUrl: string) {
  const metaRegex = /<meta\b[^>]*>/gi;
  const tags = html.match(metaRegex) ?? [];

  const candidates: ImageCandidate[] = [];

  for (const tag of tags) {
    const property = `${extractAttribute(tag, "property")} ${extractAttribute(tag, "name")}`.toLowerCase();

    if (!/\bog:image\b|\bog:image:secure_url\b|\btwitter:image\b|\btwitter:image:src\b/.test(property)) {
      continue;
    }

    const content = extractAttribute(tag, "content");
    if (!content) {
      continue;
    }

    try {
      const resolved = new URL(content, baseUrl).toString();
      candidates.push({
        source: "website",
        url: resolved,
        score: 120,
        keywordMatch: true,
        minWidth: WEBSITE_IMAGE_MIN_WIDTH,
        reason: "meta-og-image",
      });
    } catch {
      continue;
    }
  }

  return candidates;
}

function collectSectionFragments(html: string) {
  const fragments: string[] = [];

  for (const match of html.matchAll(/<main\b[\s\S]*?<\/main>/gi)) {
    if (match[0]) {
      fragments.push(match[0]);
    }
  }

  for (const match of html.matchAll(/<(?:section|div|header)\b[^>]*(?:id|class)=(?:"[^"]*(?:hero|masthead|showcase|product|app)[^"]*"|'[^']*(?:hero|masthead|showcase|product|app)[^']*')[^>]*>[\s\S]*?<\/(?:section|div|header)>/gi)) {
    if (match[0]) {
      fragments.push(match[0]);
    }
  }

  return fragments;
}

function parseImageCandidatesFromHtmlFragment(fragment: string, baseUrl: string) {
  const imageRegex = /<img\b[^>]*>/gi;
  const candidates: ImageCandidate[] = [];

  for (const match of fragment.matchAll(imageRegex)) {
    const tag = match[0] ?? "";
    const srcFromSrcset = pickBestSrcFromSrcSet(extractAttribute(tag, "srcset"));
    const src =
      srcFromSrcset ||
      extractAttribute(tag, "src") ||
      extractAttribute(tag, "data-src") ||
      extractAttribute(tag, "data-lazy-src") ||
      extractAttribute(tag, "data-original");

    if (!src || src.startsWith("data:")) {
      continue;
    }

    let resolvedUrl = "";
    try {
      resolvedUrl = new URL(src, baseUrl).toString();
    } catch {
      continue;
    }

    const alt = extractAttribute(tag, "alt");
    const context = `${alt} ${resolvedUrl} ${tag}`;

    if (isShieldLikeUrl(resolvedUrl) || hasLogoKeyword(context)) {
      continue;
    }

    const widthHint = parseWidthHint(`${tag} ${resolvedUrl}`);
    const keywordMatch = hasScreenshotKeyword(context);

    if (widthHint < WEBSITE_IMAGE_MIN_WIDTH && !keywordMatch) {
      continue;
    }

    let score = 20;
    score += keywordMatch ? 12 : 0;
    score += widthHint >= 1200 ? 8 : 0;
    score += widthHint >= 800 ? 5 : 0;
    score += widthHint >= WEBSITE_IMAGE_MIN_WIDTH ? 3 : 0;

    candidates.push({
      source: "website",
      url: resolvedUrl,
      score,
      keywordMatch,
      minWidth: WEBSITE_IMAGE_MIN_WIDTH,
      reason: "hero-main-image",
    });
  }

  return candidates;
}

function parseGlobalScreenshotCandidates(html: string, baseUrl: string) {
  const imageRegex = /<img\b[^>]*>/gi;
  const candidates: ImageCandidate[] = [];

  for (const match of html.matchAll(imageRegex)) {
    const tag = match[0] ?? "";
    const srcFromSrcset = pickBestSrcFromSrcSet(extractAttribute(tag, "srcset"));
    const src =
      srcFromSrcset ||
      extractAttribute(tag, "src") ||
      extractAttribute(tag, "data-src") ||
      extractAttribute(tag, "data-lazy-src") ||
      extractAttribute(tag, "data-original");

    if (!src || src.startsWith("data:")) {
      continue;
    }

    let resolvedUrl = "";
    try {
      resolvedUrl = new URL(src, baseUrl).toString();
    } catch {
      continue;
    }

    const alt = extractAttribute(tag, "alt");
    const context = `${alt} ${resolvedUrl} ${tag}`;

    if (isShieldLikeUrl(resolvedUrl) || hasLogoKeyword(context)) {
      continue;
    }

    // Global fallback is strict to avoid unrelated images:
    // only explicit screenshot-style keywords outside hero/main sections.
    const explicitScreenshotHint = /(screenshot|screen[\s\-_]?shot|preview|demo)/i.test(context);
    if (!explicitScreenshotHint) {
      continue;
    }

    const widthHint = parseWidthHint(`${tag} ${resolvedUrl}`);

    candidates.push({
      source: "website",
      url: resolvedUrl,
      score: 14 + (widthHint >= 800 ? 4 : 0),
      keywordMatch: true,
      minWidth: WEBSITE_IMAGE_MIN_WIDTH,
      reason: "global-screenshot-image",
    });
  }

  return candidates;
}

async function collectWebsiteCandidates(websiteUrl: string | null): Promise<ImageCandidate[]> {
  const normalized = normalizeWebsiteUrl(websiteUrl);
  if (!normalized) {
    return [];
  }

  const response = await fetchWithTimeout(
    normalized,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
      },
      redirect: "follow",
    },
  );

  if (!response.ok) {
    return [];
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("text/html")) {
    return [];
  }

  const html = await response.text();
  const finalUrl = response.url || normalized;

  const metaCandidates = parseMetaImageCandidates(html, finalUrl);
  const sectionFragments = collectSectionFragments(html);

  const sectionCandidates: ImageCandidate[] = [];
  for (const fragment of sectionFragments) {
    sectionCandidates.push(...parseImageCandidatesFromHtmlFragment(fragment, finalUrl));
  }

  const globalCandidates = parseGlobalScreenshotCandidates(html, finalUrl);

  return dedupeCandidates([...metaCandidates, ...sectionCandidates, ...globalCandidates]).slice(
    0,
    MAX_WEBSITE_CANDIDATES,
  );
}

async function collectReadmeCandidates(githubUrl: string): Promise<ImageCandidate[]> {
  const repo = parseGitHubRepo(githubUrl);
  if (!repo) {
    return [];
  }

  const response = await fetchWithTimeout(`${GITHUB_API_BASE}/repos/${repo.repoFullName}/readme`, {
    headers: buildGitHubHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as GitHubReadmeResponse;
  const markdown = decodeReadmeContent(payload);

  if (!markdown || !payload.download_url) {
    return [];
  }

  const { readmeBaseUrl, rawRootUrl } = buildReadmeUrlContext(payload.download_url);
  const references = [...collectMarkdownImageRefs(markdown), ...collectHtmlImageRefs(markdown)].sort(
    (a, b) => a.index - b.index,
  );

  const candidates: ImageCandidate[] = [];

  for (const reference of references) {
    const resolvedUrl = resolveImageUrl(reference.rawRef, readmeBaseUrl, rawRootUrl);
    if (!resolvedUrl) {
      continue;
    }

    const contextStart = Math.max(0, reference.index - 500);
    const context = markdown.slice(contextStart, reference.index + reference.rawMatch.length + 500);

    const mergedContext = `${reference.rawAlt} ${resolvedUrl} ${context}`;

    if (isForbiddenReadmeCandidate(mergedContext)) {
      continue;
    }

    const keywordMatch = hasScreenshotKeyword(`${reference.rawAlt} ${resolvedUrl}`);
    const minWidth = keywordMatch ? WEBSITE_IMAGE_MIN_WIDTH : README_WIDE_IMAGE_MIN_WIDTH;

    let score = 8;
    score += keywordMatch ? 16 : 0;
    score += /(?:^|\n)#{1,6}\s+.*(?:screenshot|preview|demo|ui)/i.test(context) ? 7 : 0;
    score += /\bapp\b/i.test(reference.rawAlt) ? 3 : 0;

    candidates.push({
      source: "readme",
      url: resolvedUrl,
      score,
      keywordMatch,
      minWidth,
      reason: keywordMatch ? "readme-keyword" : "readme-wide-image",
    });
  }

  return dedupeCandidates(candidates).slice(0, MAX_README_CANDIDATES);
}

async function collectAppStoreCandidates(toolName: string): Promise<ImageCandidate[]> {
  const term = toolName.trim();
  if (!term) {
    return [];
  }

  const response = await fetchWithTimeout(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=macSoftware&limit=3`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json,*/*;q=0.9",
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as ITunesSearchResponse;
  const results = Array.isArray(payload.results) ? payload.results : [];

  const candidates: ImageCandidate[] = [];

  for (const result of results) {
    const trackName = (result.trackName ?? "").trim();
    if (!trackName) {
      continue;
    }

    const score = fuzzyNameScore(toolName, trackName);
    if (score < APP_STORE_TRACK_MATCH_THRESHOLD) {
      continue;
    }

    const screenshotUrls = Array.isArray(result.screenshotUrls) ? result.screenshotUrls : [];

    for (const screenshotUrl of screenshotUrls) {
      if (!screenshotUrl) {
        continue;
      }

      candidates.push({
        source: "app-store",
        url: screenshotUrl,
        score: Math.round(score * 100),
        keywordMatch: true,
        minWidth: WEBSITE_IMAGE_MIN_WIDTH,
        reason: `app-store:${trackName}`,
      });
    }
  }

  return dedupeCandidates(candidates).slice(0, MAX_APP_STORE_CANDIDATES);
}

async function downloadCandidateBuffer(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    return null;
  }

  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
    },
    25_000,
  );

  if (!response.ok) {
    return null;
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (contentType && !contentType.startsWith("image/")) {
    return null;
  }

  const contentLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOAD_BYTES) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  if (fileBuffer.byteLength === 0 || fileBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
    return null;
  }

  return fileBuffer;
}

async function saveCandidateAsJpeg(candidate: ImageCandidate, toolDir: string, toolSlug: string, index: number) {
  if (isShieldLikeUrl(candidate.url)) {
    return null;
  }

  const fileBuffer = await downloadCandidateBuffer(candidate.url);
  if (!fileBuffer) {
    return null;
  }

  if (fileBuffer.byteLength <= MIN_FILE_BYTES) {
    return null;
  }

  const metadata = await sharp(fileBuffer, { failOn: "none" }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return null;
  }

  if (width < candidate.minWidth) {
    return null;
  }

  const outputWidth = Math.min(width, MAX_OUTPUT_WIDTH);
  const outputHeight = Math.round((height / width) * outputWidth);

  if (outputWidth < MIN_WIDTH || outputHeight < MIN_HEIGHT) {
    return null;
  }

  const fileName = `screenshot-${index}.jpg`;
  const filePath = path.join(toolDir, fileName);

  await sharp(fileBuffer, { failOn: "none", animated: false })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: MAX_OUTPUT_WIDTH, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(filePath);

  const outputStats = await fs.stat(filePath).catch(() => null);
  if (!outputStats || outputStats.size <= MIN_FILE_BYTES) {
    await fs.unlink(filePath).catch(() => undefined);
    return null;
  }

  return `/screenshots/${toolSlug}/${fileName}`;
}

async function persistCandidates(candidates: ImageCandidate[], toolSlug: string, toolDir: string) {
  const savedPaths: string[] = [];

  for (const candidate of candidates) {
    if (savedPaths.length >= MAX_SCREENSHOTS_PER_TOOL) {
      break;
    }

    try {
      const savedPath = await saveCandidateAsJpeg(candidate, toolDir, toolSlug, savedPaths.length + 1);
      if (savedPath) {
        savedPaths.push(savedPath);
      }
    } catch {
      continue;
    }
  }

  return savedPaths;
}

async function ensureCleanToolDirectory(toolSlug: string) {
  const toolDir = path.join(SCREENSHOT_ROOT, toolSlug);
  await fs.rm(toolDir, { recursive: true, force: true });
  await fs.mkdir(toolDir, { recursive: true });
  return toolDir;
}

async function rebuildToolScreenshots(tool: ToolRow): Promise<ProcessResult> {
  const toolSlug = normalizeToolSlug(tool.slug || tool.name);
  const toolDir = await ensureCleanToolDirectory(toolSlug);

  try {
    const websiteCandidates = await collectWebsiteCandidates(tool.websiteUrl);
    if (websiteCandidates.length > 0) {
      const saved = await persistCandidates(websiteCandidates, toolSlug, toolDir);
      if (saved.length > 0) {
        return {
          source: "website",
          screenshotPaths: saved,
          note: `website candidates: ${websiteCandidates.length}`,
        };
      }
    }
  } catch {
    // Continue to fallback source.
  }

  try {
    const readmeCandidates = await collectReadmeCandidates(tool.githubUrl);
    if (readmeCandidates.length > 0) {
      const saved = await persistCandidates(readmeCandidates, toolSlug, toolDir);
      if (saved.length > 0) {
        return {
          source: "readme",
          screenshotPaths: saved,
          note: `readme candidates: ${readmeCandidates.length}`,
        };
      }
    }
  } catch {
    // Continue to fallback source.
  }

  try {
    const appStoreCandidates = await collectAppStoreCandidates(tool.name);
    if (appStoreCandidates.length > 0) {
      const saved = await persistCandidates(appStoreCandidates, toolSlug, toolDir);
      if (saved.length > 0) {
        return {
          source: "app-store",
          screenshotPaths: saved,
          note: `app-store candidates: ${appStoreCandidates.length}`,
        };
      }
    }
  } catch {
    // Exhausted all fallback sources.
  }

  return {
    source: "none",
    screenshotPaths: [],
    note: "no valid screenshots from any source",
  };
}

async function updateToolScreenshots(db: Client, toolId: number, screenshotPaths: string[]) {
  await db.execute({
    sql: "UPDATE tools SET screenshotUrls = ?, updatedAt = ? WHERE id = ?",
    args: [JSON.stringify(screenshotPaths), new Date().toISOString(), toolId] as InValue[],
  });
}

async function appendTrackerLine(line: string) {
  await fs.mkdir(path.dirname(TRACKER_PATH), { recursive: true });
  await fs.appendFile(TRACKER_PATH, `${line}\n`, "utf8");
}

async function clearAllScreenshots() {
  await fs.rm(SCREENSHOT_ROOT, { recursive: true, force: true });
  await fs.mkdir(SCREENSHOT_ROOT, { recursive: true });
}

async function fetchPublishedTools(db: Client) {
  const result = await db.execute(`
    SELECT id, slug, name, githubUrl, websiteUrl
    FROM tools
    WHERE isPublished = 1
    ORDER BY name ASC
  `);

  return result.rows.map((row) => mapToolRow(row as Record<string, unknown>));
}

async function main() {
  await loadEnvFromDotLocal();

  const databaseUrl = requireEnv("TURSO_DATABASE_URL");
  const authToken = requireEnv("TURSO_AUTH_TOKEN");

  const db = createClient({
    url: databaseUrl,
    authToken,
  });

  const tools = await fetchPublishedTools(db);
  if (tools.length === 0) {
    throw new Error("No published tools found.");
  }

  await clearAllScreenshots();

  const startedAt = new Date().toISOString();
  await appendTrackerLine(`\n## Screenshot rebuild run ${startedAt}`);
  await appendTrackerLine(`- total-published-tools: ${tools.length}`);

  let websiteCount = 0;
  let readmeCount = 0;
  let appStoreCount = 0;
  let noneCount = 0;

  for (const [index, tool] of tools.entries()) {
    const position = `${index + 1}/${tools.length}`;
    const toolSlug = normalizeToolSlug(tool.slug || tool.name);

    let result: ProcessResult;

    try {
      result = await rebuildToolScreenshots(tool);
      await updateToolScreenshots(db, tool.id, result.screenshotPaths);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      result = {
        source: "none",
        screenshotPaths: [],
        note: `pipeline-error: ${message}`,
      };

      await updateToolScreenshots(db, tool.id, []);
    }

    if (result.source === "website") {
      websiteCount += 1;
    } else if (result.source === "readme") {
      readmeCount += 1;
    } else if (result.source === "app-store") {
      appStoreCount += 1;
    } else {
      noneCount += 1;
    }

    const pathsDisplay = result.screenshotPaths.length > 0 ? result.screenshotPaths.join(", ") : "[]";

    const trackerLine = `- ${new Date().toISOString()} | ${position} | slug=${toolSlug} | name=${tool.name} | source=${result.source} | screenshots=${result.screenshotPaths.length} | ${result.note} | paths=${pathsDisplay}`;
    await appendTrackerLine(trackerLine);

    console.log(
      `[${position}] ${tool.name} (${toolSlug}) -> source=${result.source}, screenshots=${result.screenshotPaths.length}`,
    );
  }

  console.log("\nScreenshot rebuild complete.");
  console.log(`Published tools processed: ${tools.length}`);
  console.log(`Source usage: website=${websiteCount}, readme=${readmeCount}, app-store=${appStoreCount}, none=${noneCount}`);
  console.log(`Tracker: ${TRACKER_PATH}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[fetch-tool-screenshots] Failed: ${message}`);
  process.exitCode = 1;
});
