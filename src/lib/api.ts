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

const BASE = "/api";

let token: string | null = localStorage.getItem("ph_token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("ph_token", t);
  else localStorage.removeItem("ph_token");
}

export function getToken() {
  return token;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `请求失败 (${res.status})`);
  }
  return json.data as T;
}

// ---- Auth ----
export const api = {
  login: (account: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ account, password }),
    }),
  loginSms: (phone: string, code: string) =>
    request<{ token: string; user: User }>("/auth/login-sms", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),
  sendCode: (phone: string) =>
    request<{ phone: string; hint: string }>("/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  register: (body: { email?: string; phone?: string; username: string; password: string; code?: string }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  // ---- Prompts ----
  listPrompts: (params: Record<string, string | number | boolean | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
    });
    return request<Paginated<Prompt>>(`/prompts?${q.toString()}`);
  },
  prompt: (id: string) => request<Prompt>(`/prompts/${id}`),
  related: (id: string) => request<Prompt[]>(`/prompts/${id}/related`),
  comments: (id: string) => request<Comment[]>(`/prompts/${id}/comments`),
  daily: () => request<Prompt[]>("/prompts/daily"),
  trending: () => request<Prompt[]>("/prompts/trending"),
  latest: () => request<Prompt[]>("/prompts/latest"),
  stats: () => request<Stats>("/prompts/stats"),
  filters: () => request<{ models: ModelInfo[]; tags: TagInfo[] }>("/prompts/filters"),
  recordCopy: (id: string) =>
    request<{ copyCount: number }>(`/prompts/${id}/copy`, { method: "POST" }),
  rate: (id: string, score: number) =>
    request(`/prompts/${id}/rate`, { method: "POST", body: JSON.stringify({ score }) }),
  postComment: (id: string, content: string) =>
    request<Comment>(`/prompts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // ---- Favorites (with collections) ----
  favorites: (collectionId?: string) =>
    request<Prompt[]>(`/favorites${collectionId ? `?collectionId=${collectionId}` : ""}`),
  favoriteIds: () => request<string[]>("/favorites/ids"),
  toggleFavorite: (promptId: string, collectionId?: string) =>
    request<{ favorited: boolean }>("/favorites", {
      method: "POST",
      body: JSON.stringify({ promptId, collectionId }),
    }),
  moveFavorite: (promptId: string, collectionId?: string) =>
    request(`/favorites/${promptId}`, {
      method: "PUT",
      body: JSON.stringify({ collectionId }),
    }),
  collections: () => request<(Collection & { count: number })[]>("/favorites/collections"),
  createCollection: (name: string, icon?: string) =>
    request<Collection>("/favorites/collections", {
      method: "POST",
      body: JSON.stringify({ name, icon }),
    }),
  deleteCollection: (id: string) =>
    request(`/favorites/collections/${id}`, { method: "DELETE" }),

  // ---- Projects ----
  projects: () => request<(Project & { promptCount: number })[]>("/projects"),
  createProject: (body: { name: string; description?: string; color?: string; visibility?: string }) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject: (id: string, body: Partial<Project>) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: "DELETE" }),
  projectPrompts: (id: string) => request<Prompt[]>(`/projects/${id}/prompts`),

  // ---- User data ----
  myHistory: () => request<CopyHistory[]>("/user/history"),
  clearHistory: () => request("/user/history", { method: "DELETE" }),
  myPrompts: (projectId?: string) =>
    request<Prompt[]>(`/user/prompts${projectId ? `?projectId=${projectId}` : ""}`),
  createMyPrompt: (body: Record<string, unknown>) =>
    request<Prompt>("/user/prompts", { method: "POST", body: JSON.stringify(body) }),
  updateMyPrompt: (id: string, body: Record<string, unknown>) =>
    request(`/user/prompts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMyPrompt: (id: string) =>
    request(`/user/prompts/${id}`, { method: "DELETE" }),
  compare: (ids: string[]) => request<Prompt[]>(`/user/compare?ids=${ids.join(",")}`),

  // ---- Submissions & subscriptions ----
  submit: (body: Record<string, unknown>) =>
    request<Submission>("/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  mySubmissions: () => request<Submission[]>("/submissions/me"),
  subscribe: (email: string) =>
    request("/subscriptions", { method: "POST", body: JSON.stringify({ email }) }),

  // ---- Admin ----
  adminStats: () =>
    request<{
      total: number;
      pendingSubmissions: number;
      totalViews: number;
      totalCopies: number;
      byType: Record<string, number>;
      recent: { id: string; title: string; createdAt: string; type: string }[];
    }>("/admin/stats"),
  reviewQueue: () => request<Submission[]>("/admin/review"),
  review: (id: string, action: "approve" | "reject", note?: string) =>
    request("/admin/review", {
      method: "POST",
      body: JSON.stringify({ id, action, note }),
    }),
  adminPrompts: () => request<Prompt[]>("/admin/prompts"),
  adminSources: () => request<DataSource[]>("/admin/sources"),
  adminJobs: () => request<JobLog[]>("/admin/jobs"),
  toggleSource: (id: string, enabled: boolean) =>
    request(`/admin/sources/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  toggleFeatured: (id: string, isFeatured: boolean) =>
    request(`/admin/prompts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isFeatured }),
    }),
  deletePrompt: (id: string) =>
    request(`/admin/prompts/${id}`, { method: "DELETE" }),
  triggerJob: (id: string) =>
    request(`/admin/jobs/${id}/trigger`, { method: "POST" }),
};
