import { getClient } from "../src/lib/db-core";

async function main() {
  const db = getClient();
  
  const published = await db.execute("SELECT COUNT(*) as cnt FROM tools WHERE isPublished = 1");
  console.log('Published tools count:', JSON.stringify(published.rows[0]));
  
  const tools = await db.execute("SELECT name FROM tools WHERE isPublished = 1 ORDER BY name");
  tools.rows.forEach(r => console.log(' -', r.name));
  
  // Get all pending queue items that are actual macOS apps
  const pending = await db.execute("SELECT id, name, repoFullName, starCount, language, lastCommitDate, description FROM discovery_queue WHERE status = 'pending' ORDER BY starCount DESC LIMIT 20");
  console.log('\nTop pending candidates:');
  pending.rows.forEach(r => console.log(JSON.stringify(r)));
}

main().catch(console.error);
