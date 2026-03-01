import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN!.trim(),
  });

  const now = new Date().toISOString();
  const slug = "miaoyan";

  const existing = await db.execute({ sql: "SELECT id FROM tools WHERE slug = ?", args: [slug] });
  if (existing.rows.length > 0) {
    console.log("MiaoYan already exists, id:", existing.rows[0].id);
    return;
  }

  await db.execute({
    sql: `INSERT INTO tools (
      name, slug, description, summary, githubUrl, websiteUrl,
      category, subcategory, iconUrl, screenshotUrls, brewCommand,
      installInstructions, score, starCount, forkCount, lastCommitDate,
      license, createdAt, updatedAt, isPublished, isFeatured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "MiaoYan",
      slug,
      "Lightweight native macOS Markdown editor built in Swift 6. Local-first with no data collection, split editor and live preview with 60fps scroll sync, LaTeX and Mermaid support, PPT presentation mode, and iCloud Drive storage.",
      "A fast, beautiful Markdown writing app for macOS. Built natively in Swift 6, MiaoYan delivers better performance than Electron alternatives while keeping your notes local and private. Features split editing with real-time preview, LaTeX math rendering, Mermaid diagrams, syntax highlighting, and even a presentation mode.",
      "https://github.com/tw93/MiaoYan",
      "https://miaoyan.app",
      "productivity",
      "writing",
      "",
      JSON.stringify([]),
      "brew install --cask miaoyan",
      "Download DMG from GitHub Releases, drag to Applications.",
      82, 6200, 320, "2025-12-01", "MIT",
      now, now, 1, 0,
    ],
  });

  const result = await db.execute({ sql: "SELECT id FROM tools WHERE slug = ?", args: [slug] });
  const toolId = Number(result.rows[0].id);
  console.log("Inserted MiaoYan, id:", toolId);

  await db.execute({
    sql: `INSERT OR REPLACE INTO scores (
      toolId, functionality, usefulness, visualQuality, installEase,
      maintenanceHealth, documentationQuality, appleSiliconSupport,
      privacySecurity, overallScore
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [toolId, 8, 8, 9, 9, 7, 7, 9, 9, 82],
  });
  console.log("Scores added. MiaoYan is live on MacVault.");
}

main().catch(console.error);
