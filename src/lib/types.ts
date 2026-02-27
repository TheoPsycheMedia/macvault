export type VoteType = "up" | "down";

export type ToolSort = "score" | "stars" | "recent" | "votes";

export interface ToolScoreBreakdown {
  functionality: number;
  usefulness: number;
  visualQuality: number;
  installEase: number;
  maintenanceHealth: number;
  documentationQuality: number;
  appleSiliconSupport: number;
  privacySecurity: number;
  overallScore: number;
}

export interface ToolSeed {
  name: string;
  slug: string;
  description: string;
  summary: string;
  githubUrl: string;
  websiteUrl: string;
  category: string;
  subcategory: string;
  iconUrl: string;
  screenshotUrls: string[];
  brewCommand: string;
  installInstructions: string;
  score: number;
  starCount: number;
  forkCount: number;
  lastCommitDate: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  scores: ToolScoreBreakdown;
}

export interface CategorySeed {
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  toolCount: number;
}

export interface Tool {
  id: number;
  name: string;
  slug: string;
  description: string;
  summary: string;
  githubUrl: string;
  websiteUrl: string;
  category: string;
  subcategory: string;
  iconUrl: string;
  screenshotUrls: string[];
  brewCommand: string;
  installInstructions: string;
  score: number;
  starCount: number;
  forkCount: number;
  lastCommitDate: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  functionality: number;
  usefulness: number;
  visualQuality: number;
  installEase: number;
  maintenanceHealth: number;
  documentationQuality: number;
  appleSiliconSupport: number;
  privacySecurity: number;
  overallScore: number;
  categoryName: string;
  categoryIcon: string;
  upvotes: number;
  downvotes: number;
  voteCount: number;
}

export interface ToolFilters {
  category?: string;
  search?: string;
  minScore?: number;
  sort?: ToolSort;
  limit?: number;
}
