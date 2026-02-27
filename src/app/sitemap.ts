import type { MetadataRoute } from "next";

import { execute } from "@/lib/db";

const SITE_URL = "https://macvault.vercel.app";

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [toolResult, categoryResult] = await Promise.all([
    execute(`
      SELECT slug, updatedAt
      FROM tools
      WHERE isPublished = 1
      ORDER BY datetime(updatedAt) DESC
    `),
    execute(`
      SELECT slug
      FROM categories
      ORDER BY name ASC
    `),
  ]);

  const toolRows = toolResult.rows.map((row) => ({
    slug: toStringValue((row as Record<string, unknown>).slug),
    updatedAt: toStringValue((row as Record<string, unknown>).updatedAt),
  }));

  const categoryRows = categoryResult.rows.map((row) => ({
    slug: toStringValue((row as Record<string, unknown>).slug),
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/newsletter`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = toolRows.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: tool.updatedAt ? new Date(tool.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categoryRows.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
