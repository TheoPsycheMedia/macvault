import { ensureInitialized, getClient } from "../src/lib/db-core";

async function main() {
  console.log("Initializing Turso database (creating tables + seeding)...");
  await ensureInitialized();
  
  const client = getClient();
  
  // Check what we have
  const tools = await client.execute("SELECT COUNT(*) as count FROM tools");
  const categories = await client.execute("SELECT COUNT(*) as count FROM categories");
  const queue = await client.execute("SELECT COUNT(*) as count FROM discovery_queue");
  
  console.log(`Tools: ${tools.rows[0].count}`);
  console.log(`Categories: ${categories.rows[0].count}`);
  console.log(`Discovery queue: ${queue.rows[0].count}`);
  console.log("Done!");
}

main().catch(console.error);
