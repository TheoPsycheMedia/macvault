import { runDiscoveryPipeline } from "../src/lib/discovery/pipeline";

async function main() {
  const startedAt = new Date();
  console.log(`[discovery] Starting pipeline at ${startedAt.toISOString()}`);

  const summary = await runDiscoveryPipeline();

  console.log(
    `[discovery] Complete. scanned=${summary.scanned} evaluated=${summary.evaluated} approved=${summary.approved} rejected=${summary.rejected}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[discovery] Failed: ${message}`);
  process.exitCode = 1;
});
