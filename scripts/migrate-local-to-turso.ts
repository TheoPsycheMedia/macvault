import { createClient } from "@libsql/client";

const localDb = createClient({ url: "file:./src/data/macvault.db" });
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // Migrate discovery_queue
  const queueResult = await localDb.execute("SELECT * FROM discovery_queue");
  console.log(`Migrating ${queueResult.rows.length} discovery_queue items...`);
  
  let inserted = 0;
  for (const row of queueResult.rows) {
    try {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO discovery_queue (githubUrl, repoFullName, name, description, starCount, forkCount, language, lastCommitDate, license, topics, readmeExcerpt, status, aiSummary, aiScores, aiCategory, aiSubcategory, aiBrewCommand, aiInstallInstructions, evaluatedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [row.githubUrl as string, row.repoFullName as string, row.name as string, row.description as string | null, row.starCount as number, row.forkCount as number, row.language as string | null, row.lastCommitDate as string | null, row.license as string | null, row.topics as string, row.readmeExcerpt as string | null, row.status as string, row.aiSummary as string | null, row.aiScores as string | null, row.aiCategory as string | null, row.aiSubcategory as string | null, row.aiBrewCommand as string | null, row.aiInstallInstructions as string | null, row.evaluatedAt as string | null, row.createdAt as string, row.updatedAt as string]
      });
      inserted++;
    } catch (e: any) {
      if (!e.message?.includes("UNIQUE")) console.error(`Failed: ${row.name}:`, e.message);
    }
  }
  console.log(`Inserted ${inserted} queue items into Turso`);

  // Migrate screenshot URLs
  const toolResult = await localDb.execute("SELECT slug, screenshotUrls FROM tools WHERE screenshotUrls != '[]'");
  console.log(`\nUpdating ${toolResult.rows.length} tools with screenshots...`);
  for (const row of toolResult.rows) {
    await turso.execute({
      sql: "UPDATE tools SET screenshotUrls = ? WHERE slug = ?",
      args: [row.screenshotUrls as string, row.slug as string]
    });
    console.log(`  Updated: ${row.slug}`);
  }

  // Verify
  const qCount = await turso.execute("SELECT COUNT(*) as c FROM discovery_queue");
  const sCount = await turso.execute("SELECT COUNT(*) as c FROM tools WHERE screenshotUrls != '[]'");
  console.log(`\nTurso now has: ${qCount.rows[0].c} queue items, ${sCount.rows[0].c} tools with screenshots`);
}

main().catch(console.error);
