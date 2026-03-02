import { getClient } from "../src/lib/db-core";

async function main() {
  const db = getClient();
  // Get ALL pending items to find good macOS apps
  const pending = await db.execute(`
    SELECT id, name, repoFullName, starCount, language, lastCommitDate, description, topics
    FROM discovery_queue 
    WHERE status = 'pending' 
    ORDER BY starCount DESC 
    LIMIT 100
  `);
  console.log('Total pending:', pending.rows.length);
  pending.rows.forEach(r => {
    const topics = JSON.parse((r.topics as string) || '[]');
    console.log(`${r.id} | ${r.name} | ${r.repoFullName} | stars:${r.starCount} | lang:${r.language} | ${r.lastCommitDate?.toString().slice(0,10)} | topics:[${topics.slice(0,3).join(',')}] | ${(r.description as string)?.slice(0,80)}`);
  });
}

main().catch(console.error);
