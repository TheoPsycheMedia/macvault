import { fetchCandidateContext } from "../src/lib/discovery/evaluator";

function parseTopics(rawTopics: string) {
  try {
    const parsed = JSON.parse(rawTopics) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatText(value: string | null | undefined, fallback = "N/A") {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

async function main() {
  const idArg = process.argv[2];
  const queueId = Number(idArg);

  if (!Number.isInteger(queueId) || queueId <= 0) {
    console.error("Usage: npx tsx scripts/eval-candidate.ts <id>");
    process.exitCode = 1;
    return;
  }

  const { candidate, readme, recentCommits, openIssuesCount } = await fetchCandidateContext(queueId);
  const readmeExcerpt = readme.slice(0, 3000);
  const topics = parseTopics(candidate.topics);

  console.log("=== MacVault Candidate Context ===");
  console.log(`Queue ID: ${candidate.id}`);
  console.log(`Repository: ${candidate.repoFullName}`);
  console.log(`Name: ${candidate.name}`);
  console.log(`Description: ${formatText(candidate.description)}`);
  console.log(`GitHub URL: ${candidate.githubUrl}`);
  console.log(`Stars: ${candidate.starCount}`);
  console.log(`Forks: ${candidate.forkCount}`);
  console.log(`Language: ${formatText(candidate.language)}`);
  console.log(`Last Commit Date: ${formatText(candidate.lastCommitDate)}`);
  console.log(`License: ${formatText(candidate.license)}`);
  console.log(`Topics: ${topics.length ? topics.join(", ") : "None"}`);
  console.log(`Open Issues Count: ${openIssuesCount}`);
  console.log("");

  console.log("README Excerpt (first 3000 chars):");
  console.log(readmeExcerpt || "No README found.");
  console.log("");

  console.log("Recent Commits (last 10):");
  if (recentCommits.length === 0) {
    console.log("- No commits found.");
  } else {
    for (const commit of recentCommits) {
      const date = commit.date ?? "unknown";
      const sha = commit.sha ? commit.sha.slice(0, 7) : "unknown";
      const message = commit.message || "(no commit message)";
      console.log(`- ${date} | ${sha} | ${message}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[eval-candidate] Failed: ${message}`);
  process.exitCode = 1;
});
