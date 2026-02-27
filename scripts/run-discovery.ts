import { scanGitHub } from "../src/lib/discovery/scanner";

async function main() {
  const startedAt = new Date();
  console.log(`[discovery] Starting scanner at ${startedAt.toISOString()}`);

  const newCandidates = await scanGitHub();

  console.log(`[discovery] Complete. newCandidates=${newCandidates}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[discovery] Failed: ${message}`);
  process.exitCode = 1;
});
