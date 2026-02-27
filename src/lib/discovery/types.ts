export type DiscoveryStatus =
  | "pending"
  | "evaluating"
  | "approved"
  | "rejected"
  | "published";

export interface DiscoveryAiScores {
  design: number;
  performance: number;
  documentation: number;
  maintenance: number;
  integration: number;
  uniqueness: number;
  value: number;
  community: number;
}

export interface DiscoveryCommitContext {
  sha: string;
  message: string;
  date: string | null;
}

export interface DiscoveryQueueItem {
  id: number;
  githubUrl: string;
  repoFullName: string;
  name: string;
  description: string | null;
  starCount: number;
  forkCount: number;
  language: string | null;
  lastCommitDate: string | null;
  license: string | null;
  topics: string;
  readmeExcerpt: string | null;
  status: DiscoveryStatus;
  aiSummary: string | null;
  aiScores: string | null;
  aiCategory: string | null;
  aiSubcategory: string | null;
  aiBrewCommand: string | null;
  aiInstallInstructions: string | null;
  evaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResult {
  summary: string;
  scores: DiscoveryAiScores;
  category: string;
  subcategory?: string;
  brewCommand?: string;
  installInstructions?: string;
  isApproved: boolean;
}

export interface CandidateContext {
  candidate: DiscoveryQueueItem;
  readme: string;
  recentCommits: DiscoveryCommitContext[];
  openIssuesCount: number;
}
