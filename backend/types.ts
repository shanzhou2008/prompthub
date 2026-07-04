/**
 * 共享类型定义（前后端通用）
 */

export type PromptType = "image" | "video" | "task";

export type PromptSource = "crawled" | "submitted" | "official";

export type PromptStatus = "pending" | "published" | "rejected";

/** 可见性：公开 / 私有（仅自己） / 仅链接 */
export type Visibility = "public" | "private" | "link";

export type SortKey = "latest" | "trending" | "rating" | "random";

export interface Prompt {
  id: string;
  title: string;
  /** 英文版本提示词内容（主版本，用于搜索/默认复制） */
  content: string;
  /** 英文版本（与 content 相同，显式字段） */
  contentEn: string;
  /** 中文版本提示词内容 */
  contentZh: string;
  type: PromptType;
  model: string;
  vendor: string;
  params: Record<string, string | number>;
  tags: string[];
  language: "zh" | "en" | "ja" | "other";
  source: PromptSource;
  sourceUrl?: string;
  /** 视频类型的预览视频 URL（公开 sample 视频） */
  videoUrl?: string;
  /** 用于生成 CSS 抽象预览的色相与图案种子 */
  hue: number;
  pattern: "mesh" | "orbs" | "rings" | "waves" | "grid" | "aurora";
  viewCount: number;
  copyCount: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  status: PromptStatus;
  authorName?: string;
  /** 上传者 userId（投稿/私有提示词用） */
  userId?: string;
  /** 可见性，默认 public */
  visibility: Visibility;
  /** 归属项目 ID（用户自建项目分类） */
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptListQuery {
  q?: string;
  type?: PromptType;
  model?: string;
  tag?: string;
  language?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  /** 仅返回某用户的公开提示词 */
  authorId?: string;
  /** 仅返回某项目下的提示词 */
  projectId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  avatar?: string;
  role: "user" | "admin";
}

export interface Comment {
  id: string;
  promptId: string;
  user: PublicUser;
  content: string;
  createdAt: string;
}

/** 投稿记录（待审核） */
export interface Submission {
  id: string;
  userId: string;
  payload: Omit<Prompt, "id" | "viewCount" | "copyCount" | "ratingAvg" | "ratingCount" | "isFeatured" | "status" | "createdAt" | "updatedAt">;
  status: PromptStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

/** 用户项目（提示词分类文件夹） */
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

/** 收藏夹分组 */
export interface Collection {
  id: string;
  userId: string;
  name: string;
  icon: string;
  createdAt: string;
}

/** 收藏记录（可归属到某个收藏夹） */
export interface Favorite {
  id: string;
  userId: string;
  promptId: string;
  collectionId?: string;
  createdAt: string;
}

/** 复制历史记录 */
export interface CopyHistory {
  id: string;
  userId: string;
  promptId: string;
  copiedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: "community" | "social" | "official";
  url: string;
  parser: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: "success" | "failed";
  itemsAdded: number;
}

export interface JobLog {
  id: string;
  sourceId: string;
  sourceName: string;
  status: "success" | "failed" | "running";
  itemsFetched: number;
  itemsAdded: number;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}
