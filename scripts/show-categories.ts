import { getClient } from "../src/lib/db-core";
async function main() {
  const db = getClient();
  const cats = await db.execute("SELECT slug, name FROM categories ORDER BY name");
  cats.rows.forEach(r => console.log(r.slug, '|', r.name));
}
main().catch(console.error);
