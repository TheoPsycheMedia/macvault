import { getClient, ensureInitialized } from "../src/lib/db-core";
async function main() {
  await ensureInitialized();
  const db = getClient();
  const tools = await db.execute("SELECT name, category FROM tools WHERE isPublished = 1 ORDER BY name");
  console.log('Total published:', tools.rows.length);
  tools.rows.forEach(r => console.log(`  ${r.name} [${r.category}]`));
}
main().catch(console.error);
