export type PromptType = "image" | "video" | "task";

export type PromptSource = "crawled" | "submitted" | "official";

export type PromptStatus = "pending" | "published" | "rejected";

export type Visibility = "public" | "private" | "link";

export interface Prompt {
  id: string;
  title: string;
  content: string;
  contentEn: string;
  contentZh: string;
  type: PromptType;
  model: string;
  vendor: string;
  params: Record<string, string | number>;
  tags: string[];
  language: string;
  source: string;
  sourceUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  imageLgUrl?: string;
  hue: number;
  pattern: "mesh" | "orbs" | "rings" | "waves" | "grid" | "aurora";
  viewCount: number;
  copyCount: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  status: string;
  authorName?: string;
  userId?: string;
  visibility: Visibility;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  visibility: Visibility;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  promptId: string;
  collectionId?: string;
  createdAt: string;
}

export interface CopyHistory {
  id: string;
  userId: string;
  promptId: string;
  promptTitle: string;
  promptType: PromptType;
  copiedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  avatar?: string;
  role: "user" | "admin";
}

export interface User extends PublicUser {
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  promptId: string;
  user: PublicUser;
  content: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  image: number;
  video: number;
  task: number;
  last7Days: number;
  users: number;
  pendingSubmissions: number;
  sources: number;
  activeSources: number;
}

export interface ModelInfo {
  name: string;
  vendor: string;
  type: string;
  count: number;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Submission {
  id: string;
  userId: string;
  status: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  payload: Partial<Prompt>;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  url: string;
  parser: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: string;
  itemsAdded: number;
}

export interface JobLog {
  id: string;
  sourceId: string;
  sourceName: string;
  status: string;
  itemsFetched: number;
  itemsAdded: number;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}
