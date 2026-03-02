import { listRecentTools } from "@/lib/repository";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const tools = await listRecentTools(20);
  const baseUrl = "https://macvault.vercel.app";

  const items = tools
    .map(
      (tool) => `
    <item>
      <title>${escapeXml(tool.name)}</title>
      <link>${baseUrl}/tools/${tool.slug}</link>
      <guid>${baseUrl}/tools/${tool.slug}</guid>
      <description>${escapeXml(tool.summary || tool.description || "")}</description>
      <pubDate>${new Date(tool.createdAt || Date.now()).toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MacVault — New Tools</title>
    <link>${baseUrl}</link>
    <description>Curated open-source Mac tools, editorially reviewed.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
