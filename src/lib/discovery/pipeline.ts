import "server-only";

import { scanGitHub } from "./scanner";

interface PipelineSummary {
  scanned: number;
  evaluated: number;
  approved: number;
  rejected: number;
}

export async function runDiscoveryPipeline(): Promise<PipelineSummary> {
  const scanned = await scanGitHub();

  return {
    scanned,
    evaluated: 0,
    approved: 0,
    rejected: 0,
  };
}
