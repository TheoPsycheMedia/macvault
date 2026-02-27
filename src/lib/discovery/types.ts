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
  queueId: number;
  status: "approved" | "rejected";
  isMacTool: boolean;
  summary: string;
  category: string;
  subcategory: string;
  brewCommand: string;
  installInstructions: string;
  scores: DiscoveryAiScores;
}
