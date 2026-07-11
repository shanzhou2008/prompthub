import type {
  Collection,
  Comment,
  CopyHistory,
  DataSource,
  JobLog,
  ModelInfo,
  Paginated,
  Project,
  Prompt,
  Stats,
  Submission,
  TagInfo,
  User,
} from "./types";

let token: string | null = localStorage.getItem("ph_token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("ph_token", t);
  else localStorage.removeItem("ph_token");
}

export function getToken() {
  return token;
}

function asArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  return [];
}

// 缓存全部提示词
let _allPrompts: Prompt[] | null = null;

async function loadAllPrompts(): Promise<Prompt[]> {
  if (_allPrompts) return _allPrompts;
  try {
    const res = await fetch("/data/prompts.json");
    const data = await res.json();
    _allPrompts = asArray<Prompt>(data);
    return _allPrompts;
  } catch {
    return [];
  }
}

async function loadJSON<T>(path: string): Promise<T> {
  try {
    const res = await fetch(path);
    return await res.json();
  } catch {
    return null as T;
  }
}

// ---- Auth ----
export const api = {
  login: (account: string, password: string) =>
    Promise.resolve({ token: "demo-token", user: { id: "demo", username: account } as User }),
  loginSms: (phone: string, code: string) =>
    Promise.resolve({ token: "demo-token", user: { id: "demo", username: phone } as User }),
  sendCode: (phone: string) =>
    Promise.resolve({ phone, hint: "验证码已发送" }),
  register: (body: { email?: string; phone?: string; username: string; password: string; code?: string }) =>
    Promise.resolve({ token: "demo-token", user: { id: "demo", username: body.username } as User }),
  logout: () => Promise.resolve(),
  me: () => Promise.resolve(null as User),

  // ---- Prompts ----
  listPrompts: async (params: Record<string, string | number | boolean | undefined>): Promise<Paginated<Prompt>> => {
    const all = await loadAllPrompts();
    const { q, type, model, tag, sort = "latest", page = 1, pageSize = 12 } = params;

    let result = [...all];

    if (type) result = result.filter((p) => p.type === type);
    if (model) result = result.filter((p) => p.model === model);
    if (tag) result = result.filter((p) => p.tags && p.tags.includes(tag as string));
    if (q) {
      const lower = String(q).toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.content.toLowerCase().includes(lower) ||
          (p.contentZh && p.contentZh.includes(q as string)),
      );
    }

    if (sort === "trending") result.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
    else if (sort === "rating") result.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    else if (sort === "random") result.sort(() => Math.random() - 0.5);
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = result.length;
    const p = Number(page);
    const ps = Number(pageSize);
    const start = (p - 1) * ps;
    const data = result.slice(start, start + ps);

    return { data, total, page: p, pageSize: ps, hasMore: start + data.length < total };
  },

  prompt: async (id: string): Promise<Prompt> => {
    const all = await loadAllPrompts();
    const p = all.find((x) => x.id === id);
    if (!p) throw new Error("提示词不存在");
    return p;
  },

  related: async (id: string): Promise<Prompt[]> => {
    const all = await loadAllPrompts();
    const prompt = all.find((x) => x.id === id);
    if (!prompt) return [];
    return all
      .filter((p) => p.id !== id && p.type === prompt.type)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  },

  comments: (_id: string) => Promise.resolve([] as Comment[]),

  daily: () => loadJSON<Prompt[]>("/data/daily.json").then((v) => asArray<Prompt>(v)),
  trending: () => loadJSON<Prompt[]>("/data/trending.json").then((v) => asArray<Prompt>(v)),
  latest: () => loadJSON<Prompt[]>("/data/latest.json").then((v) => asArray<Prompt>(v)),
  stats: () => loadJSON<Stats>("/data/stats.json"),

  filters: async () => {
    const r = await loadJSON<{ models: ModelInfo[]; tags: TagInfo[] }>("/data/filters.json");
    return {
      models: asArray<ModelInfo>(r?.models),
      tags: asArray<TagInfo>(r?.tags),
    };
  },

  recordCopy: (_id: string) => Promise.resolve({ copyCount: 0 }),
  rate: (_id: string, _score: number) => Promise.resolve(),
  postComment: (_id: string, _content: string) => Promise.resolve({} as Comment),

  // ---- Favorites (mock, localStorage) ----
  favorites: (_collectionId?: string) => {
    const ids = JSON.parse(localStorage.getItem("ph_favorites") || "[]");
    return loadAllPrompts().then((all) => all.filter((p) => ids.includes(p.id)));
  },
  favoriteIds: () => Promise.resolve(JSON.parse(localStorage.getItem("ph_favorites") || "[]")),
  toggleFavorite: (promptId: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem("ph_favorites") || "[]");
    const idx = ids.indexOf(promptId);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(promptId);
    localStorage.setItem("ph_favorites", JSON.stringify(ids));
    return Promise.resolve({ favorited: idx < 0 });
  },
  moveFavorite: (_promptId: string, _collectionId?: string) => Promise.resolve(),
  collections: () => Promise.resolve([] as (Collection & { count: number })[]),
  createCollection: (_name: string, _icon?: string) => Promise.resolve({} as Collection),
  deleteCollection: (_id: string) => Promise.resolve(),

  // ---- Projects (mock) ----
  projects: () => Promise.resolve([] as (Project & { promptCount: number })[]),
  createProject: (_body: { name: string; description?: string; color?: string; visibility?: string }) => Promise.resolve({} as Project),
  updateProject: (_id: string, _body: Partial<Project>) => Promise.resolve(),
  deleteProject: (_id: string) => Promise.resolve(),
  projectPrompts: (_id: string) => Promise.resolve([] as Prompt[]),

  // ---- User data (mock) ----
  myHistory: () => Promise.resolve([] as CopyHistory[]),
  clearHistory: () => Promise.resolve(),
  myPrompts: (_projectId?: string) => Promise.resolve([] as Prompt[]),
  createMyPrompt: (_body: Record<string, unknown>) => Promise.resolve({} as Prompt),
  updateMyPrompt: (_id: string, _body: Record<string, unknown>) => Promise.resolve(),
  deleteMyPrompt: (_id: string) => Promise.resolve(),
  compare: (ids: string[]) => loadAllPrompts().then((all) => all.filter((p) => ids.includes(p.id))),

  // ---- Submissions & subscriptions (mock) ----
  submit: (_body: Record<string, unknown>) => Promise.resolve({} as Submission),
  mySubmissions: () => Promise.resolve([] as Submission[]),
  subscribe: (_email: string) => Promise.resolve(),

  // ---- Admin (mock) ----
  adminStats: async () => {
    const all = await loadAllPrompts();
    const stats = await loadJSON<Stats>("/data/stats.json");
    return {
      total: all.length,
      pendingSubmissions: 0,
      totalViews: all.reduce((s, p) => s + (p.viewCount || 0), 0),
      totalCopies: all.reduce((s, p) => s + (p.copyCount || 0), 0),
      byType: {
        image: all.filter((p) => p.type === "image").length,
        video: all.filter((p) => p.type === "video").length,
        task: all.filter((p) => p.type === "task").length,
      },
      recent: all.slice(0, 10).map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt, type: p.type })),
      ...(stats || {}),
    };
  },
  reviewQueue: () => Promise.resolve([] as Submission[]),
  review: (_id: string, _action: "approve" | "reject", _note?: string) => Promise.resolve(),
  adminPrompts: () => loadAllPrompts(),
  adminSources: () => Promise.resolve([] as DataSource[]),
  adminJobs: () => Promise.resolve([] as JobLog[]),
  toggleSource: (_id: string, _enabled: boolean) => Promise.resolve(),
  toggleFeatured: (_id: string, _isFeatured: boolean) => Promise.resolve(),
  deletePrompt: (_id: string) => Promise.resolve(),
  triggerJob: (_id: string) => Promise.resolve(),
};
