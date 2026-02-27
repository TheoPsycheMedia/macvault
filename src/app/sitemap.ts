import type { MetadataRoute } from "next";

import { db } from "@/lib/db";

const SITE_URL = "https://macvault.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const toolRows = db
    .prepare(
      `
      SELECT slug, updatedAt
      FROM tools
      WHERE isPublished = 1
      ORDER BY datetime(updatedAt) DESC
    `,
    )
    .all() as Array<{ slug: string; updatedAt: string }>;

  const categoryRows = db
    .prepare(
      `
      SELECT slug
      FROM categories
      ORDER BY name ASC
    `,
    )
    .all() as Array<{ slug: string }>;

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
