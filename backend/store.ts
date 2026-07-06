/**
 * 内存数据存储 + 种子数据
 * 生产环境应替换为 PostgreSQL + Prisma，此处为保证开箱即运行采用内存实现。
 */
import type {
  Collection,
  Comment,
  CopyHistory,
  DataSource,
  Favorite,
  JobLog,
  Project,
  Prompt,
  PromptListQuery,
  Submission,
  User,
} from "./types";
import { imageSeeds } from "./seeds/imageSeeds";
import { videoSeeds } from "./seeds/videoSeeds";
import { taskSeeds } from "./seeds/taskSeeds";
import { extraSeeds } from "./seeds/extraSeeds";

// ---- 工具 ----
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

// ---- 用户 ----
export const users: User[] = [
  {
    id: "u_admin",
    email: "admin@prompthub.ai",
    phone: "13800000001",
    username: "curator",
    passwordHash: "admin123",
    role: "admin",
    avatar: "",
    createdAt: daysAgo(120),
  },
  {
    id: "u_aria",
    email: "aria@prompthub.ai",
    phone: "13800000002",
    username: "aria",
    passwordHash: "aria123",
    role: "user",
    avatar: "",
    createdAt: daysAgo(60),
  },
  {
    id: "u_kenji",
    email: "kenji@prompthub.ai",
    phone: "13800000003",
    username: "kenji",
    passwordHash: "kenji123",
    role: "user",
    avatar: "",
    createdAt: daysAgo(30),
  },
  {
    id: "u_luna",
    email: "luna@prompthub.ai",
    phone: "13800000004",
    username: "luna",
    passwordHash: "luna123",
    role: "user",
    avatar: "",
    createdAt: daysAgo(20),
  },
];

// 简单密码表（演示用，明文存储；生产环境必须用 bcrypt）
// 支持 email 或 phone 作为 key
export const passwords: Record<string, string> = {
  "admin@prompthub.ai": "admin123",
  "aria@prompthub.ai": "aria123",
  "kenji@prompthub.ai": "kenji123",
  "luna@prompthub.ai": "luna123",
  "13800000001": "admin123",
  "13800000002": "aria123",
  "13800000003": "kenji123",
  "13800000004": "luna123",
};

// 手机验证码（演示用，固定 1234；生产环境应通过短信网关发送）
export const smsCodes: Record<string, string> = {};

export interface Session {
  userId: string;
  createdAt: string;
}

export const sessions: Record<string, Session> = {};

// ---- 提示词种子数据 ----
type Seed = Omit<Prompt, "createdAt" | "updatedAt"> & {
  createdDaysAgo: number;
};

const allSeeds: Seed[] = [
  ...imageSeeds,
  ...videoSeeds,
  ...taskSeeds,
  ...extraSeeds,
] as Seed[];

export const prompts: Prompt[] = allSeeds.map(({ createdDaysAgo, ...p }) => ({
  ...p,
  createdAt: daysAgo(createdDaysAgo),
  updatedAt: daysAgo(Math.max(0, createdDaysAgo - 1)),
}));

// ---- 评论 ----
export const comments: Comment[] = [
  {
    id: uid("c"),
    promptId: "img_001",
    user: { id: "u_aria", username: "aria", role: "user" },
    content: "配色绝了，--style raw 真的更写实，已收藏！",
    createdAt: hoursAgo(20),
  },
  {
    id: uid("c"),
    promptId: "img_001",
    user: { id: "u_kenji", username: "kenji", role: "user" },
    content: "把 85mm 改成 50mm 视角更广一点也很棒。",
    createdAt: hoursAgo(8),
  },
  {
    id: uid("c"),
    promptId: "vid_001",
    user: { id: "u_aria", username: "aria", role: "user" },
    content: "运镜描述非常专业，生成出来的运动感很强。",
    createdAt: hoursAgo(12),
  },
  {
    id: uid("c"),
    promptId: "tsk_001",
    user: { id: "u_kenji", username: "kenji", role: "user" },
    content: "结构化评分表格直接能用在团队流程里，强。",
    createdAt: hoursAgo(30),
  },
  {
    id: uid("c"),
    promptId: "drama_001",
    user: { id: "u_luna", username: "luna", role: "user" },
    content: "短剧分镜模板太实用了，省了大量策划时间！",
    createdAt: hoursAgo(5),
  },
  {
    id: uid("c"),
    promptId: "eco_001",
    user: { id: "u_aria", username: "aria", role: "user" },
    content: "电商主图直接出图，白底干净利落。",
    createdAt: hoursAgo(3),
  },
];

// ---- 评分（userId+promptId -> score）----
export const ratings: Record<string, number> = {};

// ---- 收藏夹分组 ----
export const collections: Collection[] = [
  { id: "col_1", userId: "u_aria", name: "灵感库", icon: "sparkles", createdAt: daysAgo(30) },
  { id: "col_2", userId: "u_aria", name: "常用工具", icon: "wrench", createdAt: daysAgo(20) },
  { id: "col_3", userId: "u_kenji", name: "待尝试", icon: "flask", createdAt: daysAgo(15) },
];

// ---- 收藏记录 ----
export const favorites: Favorite[] = [
  { id: uid("f"), userId: "u_aria", promptId: "img_001", collectionId: "col_1", createdAt: hoursAgo(40) },
  { id: uid("f"), userId: "u_aria", promptId: "tsk_001", collectionId: "col_2", createdAt: hoursAgo(30) },
  { id: uid("f"), userId: "u_aria", promptId: "vid_001", createdAt: hoursAgo(10) },
  { id: uid("f"), userId: "u_kenji", promptId: "vid_001", collectionId: "col_3", createdAt: hoursAgo(20) },
  { id: uid("f"), userId: "u_kenji", promptId: "tsk_031", createdAt: hoursAgo(15) },
  { id: uid("f"), userId: "u_kenji", promptId: "drama_001", createdAt: hoursAgo(5) },
  { id: uid("f"), userId: "u_luna", promptId: "eco_001", createdAt: hoursAgo(8) },
  { id: uid("f"), userId: "u_luna", promptId: "tri_001", createdAt: hoursAgo(3) },
];

// ---- 复制历史 ----
export const copyHistory: CopyHistory[] = [
  { id: uid("h"), userId: "u_aria", promptId: "img_001", copiedAt: hoursAgo(2) },
  { id: uid("h"), userId: "u_aria", promptId: "tsk_001", copiedAt: hoursAgo(18) },
  { id: uid("h"), userId: "u_kenji", promptId: "vid_001", copiedAt: hoursAgo(5) },
  { id: uid("h"), userId: "u_luna", promptId: "eco_001", copiedAt: hoursAgo(1) },
];

// ---- 用户项目（提示词分类文件夹）----
export const projects: Project[] = [
  {
    id: "pj_1",
    userId: "u_aria",
    name: "小红书配图项目",
    description: "日常运营用图提示词集合",
    color: "#e11d48",
    visibility: "private",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: "pj_2",
    userId: "u_aria",
    name: "小说创作辅助",
    description: "角色设定与场景描写",
    color: "#7c3aed",
    visibility: "public",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
  {
    id: "pj_3",
    userId: "u_kenji",
    name: "电商素材库",
    description: "产品主图与详情页提示词",
    color: "#0ea5e9",
    visibility: "public",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
];

// ---- 投稿 ----
export const submissions: Submission[] = [
  {
    id: uid("s"),
    userId: "u_kenji",
    status: "pending",
    createdAt: hoursAgo(6),
    payload: {
      title: "Midjourney 水墨武侠人物",
      content: "chinese ink wash painting of a swordsman on a cliff, dynamic brush strokes, monochrome with red accent, misty mountains, wuxia aesthetic --ar 9:16 --v 6 --stylize 300",
      contentEn: "chinese ink wash painting of a swordsman on a cliff, dynamic brush strokes, monochrome with red accent, misty mountains, wuxia aesthetic --ar 9:16 --v 6 --stylize 300",
      contentZh: "中国水墨画，悬崖上的剑客，动态笔触，黑白配色点缀红色，烟雨群山，武侠美学 --ar 9:16 --v 6 --stylize 300",
      type: "image",
      model: "midjourney",
      vendor: "Midjourney",
      params: { aspect: "9:16", version: "v6", stylize: 300 },
      tags: ["水墨", "武侠", "国风"],
      language: "en",
      source: "submitted",
      hue: 0,
      pattern: "waves",
      visibility: "public",
    },
  },
  {
    id: uid("s"),
    userId: "u_luna",
    status: "pending",
    createdAt: hoursAgo(3),
    payload: {
      title: "Claude 周报自动生成",
      content: "You are a weekly report assistant...",
      contentEn: "You are a weekly report assistant...",
      contentZh: "你是一位周报助手...",
      type: "task",
      model: "claude-3.5",
      vendor: "Anthropic",
      params: { temperature: 0.5, max_tokens: 4096 },
      tags: ["周报", "工作", "自动化"],
      language: "zh",
      source: "submitted",
      hue: 270,
      pattern: "grid",
      visibility: "public",
    },
  },
];

// ---- 数据源 ----
export const dataSources: DataSource[] = [
  {
    id: "ds_1",
    name: "Midjourney 社区精选",
    type: "social",
    url: "https://www.midjourney.com",
    parser: "mj-gallery",
    schedule: "0 8 * * *",
    enabled: true,
    lastRunAt: hoursAgo(10),
    lastStatus: "success",
    itemsAdded: 12,
  },
  {
    id: "ds_2",
    name: "Civitai 热门作品",
    type: "community",
    url: "https://civitai.com",
    parser: "civitai-api",
    schedule: "0 9 * * *",
    enabled: true,
    lastRunAt: hoursAgo(8),
    lastStatus: "success",
    itemsAdded: 25,
  },
  {
    id: "ds_3",
    name: "Lexica 搜索趋势",
    type: "community",
    url: "https://lexica.art",
    parser: "lexica-api",
    schedule: "30 9 * * *",
    enabled: true,
    lastRunAt: hoursAgo(7),
    lastStatus: "success",
    itemsAdded: 18,
  },
  {
    id: "ds_4",
    name: "PromptHero 最新",
    type: "community",
    url: "https://prompthero.com",
    parser: "ph-scraper",
    schedule: "0 10 * * *",
    enabled: true,
    lastRunAt: hoursAgo(6),
    lastStatus: "success",
    itemsAdded: 15,
  },
  {
    id: "ds_5",
    name: "OpenAI Sora 官方",
    type: "official",
    url: "https://openai.com/sora",
    parser: "official-feed",
    schedule: "0 11 * * *",
    enabled: true,
    lastRunAt: hoursAgo(5),
    lastStatus: "success",
    itemsAdded: 6,
  },
  {
    id: "ds_6",
    name: "Reddit r/midjourney",
    type: "social",
    url: "https://reddit.com/r/midjourney",
    parser: "reddit-hot",
    schedule: "0 12 * * *",
    enabled: false,
    lastRunAt: daysAgo(2),
    lastStatus: "failed",
    itemsAdded: 0,
  },
];

// ---- 任务日志 ----
export const jobLogs: JobLog[] = dataSources.slice(0, 6).map((s, i) => ({
  id: uid("j"),
  sourceId: s.id,
  sourceName: s.name,
  status: s.lastStatus === "failed" ? "failed" : "success",
  itemsFetched: s.lastStatus === "failed" ? 0 : s.itemsAdded + 30,
  itemsAdded: s.itemsAdded,
  error: s.lastStatus === "failed" ? "HTTP 429 Too Many Requests" : undefined,
  startedAt: hoursAgo(20 - i),
  finishedAt: hoursAgo(20 - i - 1),
}));

// ---- 查询函数 ----
export function queryPrompts(q: PromptListQuery) {
  let list = prompts.filter(
    (p) => p.status === "published" && p.visibility === "public",
  );

  if (q.featured) list = list.filter((p) => p.isFeatured);
  if (q.type) list = list.filter((p) => p.type === q.type);
  if (q.model) list = list.filter((p) => p.model === q.model);
  if (q.tag) list = list.filter((p) => p.tags.includes(q.tag!));
  if (q.language) list = list.filter((p) => p.language === q.language);
  if (q.authorId) list = list.filter((p) => p.userId === q.authorId);
  if (q.projectId) list = list.filter((p) => p.projectId === q.projectId);
  if (q.q) {
    const kw = q.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.contentEn.toLowerCase().includes(kw) ||
        p.contentZh.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw)) ||
        p.model.toLowerCase().includes(kw),
    );
  }

  const sort = q.sort ?? "latest";
  if (sort === "latest") {
    list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } else if (sort === "trending") {
    list = [...list].sort((a, b) => b.viewCount + b.copyCount * 3 - (a.viewCount + a.copyCount * 3));
  } else if (sort === "rating") {
    list = [...list].sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (sort === "random") {
    list = [...list].sort(() => Math.random() - 0.5);
  }

  const total = list.length;
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const start = (page - 1) * pageSize;
  const data = list.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  };
}

/** 查询某用户的全部提示词（含私有） */
export function queryUserPrompts(userId: string, projectId?: string) {
  let list = prompts.filter((p) => p.userId === userId);
  if (projectId) list = list.filter((p) => p.projectId === projectId);
  return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getPromptById(id: string) {
  return prompts.find((p) => p.id === id);
}

export function getRelated(prompt: Prompt, limit = 4) {
  return prompts
    .filter(
      (p) =>
        p.id !== prompt.id &&
        p.status === "published" &&
        p.visibility === "public",
    )
    .map((p) => ({
      p,
      score:
        (p.type === prompt.type ? 2 : 0) +
        (p.model === prompt.model ? 3 : 0) +
        p.tags.filter((t) => prompt.tags.includes(t)).length * 2,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function getAllTags() {
  const map = new Map<string, number>();
  prompts.forEach((p) => {
    if (p.status !== "published" || p.visibility !== "public") return;
    p.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1));
  });
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getModels() {
  const map = new Map<string, { name: string; vendor: string; type: string; count: number }>();
  prompts.forEach((p) => {
    if (p.status !== "published" || p.visibility !== "public") return;
    const k = p.model;
    const e = map.get(k);
    if (e) e.count++;
    else map.set(k, { name: p.model, vendor: p.vendor, type: p.type, count: 1 });
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getStats() {
  const published = prompts.filter(
    (p) => p.status === "published" && p.visibility === "public",
  );
  const byType = (t: string) => published.filter((p) => p.type === t).length;
  const last7 = published.filter(
    (p) => +new Date(p.createdAt) > now - 7 * 86400_000,
  ).length;
  return {
    total: published.length,
    image: byType("image"),
    video: byType("video"),
    task: byType("task"),
    last7Days: last7,
    users: users.length,
    pendingSubmissions: submissions.filter((s) => s.status === "pending").length,
    sources: dataSources.length,
    activeSources: dataSources.filter((s) => s.enabled).length,
  };
}

/** 用户提示词数量统计 */
export function getProjectPromptCount(projectId: string) {
  return prompts.filter((p) => p.projectId === projectId).length;
}
