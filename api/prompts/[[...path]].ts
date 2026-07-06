import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

type Prompt = {
  id: string;
  type: string;
  model: string;
  vendor?: string;
  tags: string[];
  language: string;
  title: string;
  content: string;
  contentEn: string;
  contentZh: string;
  status: string;
  visibility: string;
  isFeatured?: boolean;
  viewCount: number;
  copyCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

const dataDir = path.join(process.cwd(), "api", "data");

let _promptsCache: Prompt[] | null = null;
function loadPrompts(): Prompt[] {
  if (_promptsCache) return _promptsCache;
  try {
    const raw = fs.readFileSync(path.join(dataDir, "prompts.json"), "utf8");
    _promptsCache = JSON.parse(raw);
    return _promptsCache;
  } catch (e) {
    console.error("Failed to load prompts.json:", e);
    return [];
  }
}

function loadStats() {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, "stats.json"), "utf8"));
  } catch {
    return null;
  }
}

function loadFilters() {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, "filters.json"), "utf8"));
  } catch {
    return { models: [], tags: [] };
  }
}

function ok(res: VercelResponse, data: unknown) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).json({ success: true, data });
}

function fail(res: VercelResponse, status: number, error: string) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json({ success: false, error });
}

/**
 * Parse URL path segments after /api/prompts/
 */
function parseSegments(req: VercelRequest): string[] {
  // Method 1: Use req.query.path (Vercel's [[...path]] catch-all)
  const rawPath = req.query.path;
  if (rawPath) {
    const parts = Array.isArray(rawPath) ? rawPath : [String(rawPath)];
    const filtered = parts.filter((s: string) => s && s.length > 0);
    if (filtered.length > 0) return filtered;
  }

  // Method 2: Parse from req.url
  const url = req.url || "";
  const pathOnly = url.split("?")[0];
  const m = pathOnly.match(/^\/api\/prompts\/(.+)$/);
  if (m && m[1]) {
    return m[1].split("/").filter((s) => s.length > 0);
  }

  return [];
}

/**
 * Known route keywords that should NOT be treated as prompt IDs
 */
const ROUTE_KEYWORDS = new Set(["stats", "filters", "daily", "trending", "latest", "list"]);

/**
 * 列表查询逻辑（支持筛选/搜索/分页）— 被 /list 和 fallback 共用
 */
function handleListQuery(query: VercelRequest["query"]) {
  const prompts = loadPrompts();
  const { q, type, model, tag, sort = "latest", page = "1", pageSize = "12", featured, language, authorId, projectId } = query;

  let list = prompts.filter((p) => p.status === "published" && p.visibility === "public");

  if (featured === "true") list = list.filter((p) => p.isFeatured);
  if (typeof type === "string" && type) list = list.filter((p) => p.type === type);
  if (typeof model === "string" && model) list = list.filter((p) => p.model === model);
  if (typeof tag === "string" && tag) list = list.filter((p) => p.tags.includes(tag));
  if (typeof language === "string" && language) list = list.filter((p) => p.language === language);
  if (typeof authorId === "string" && authorId) list = list.filter((p) => (p as any).userId === authorId);
  if (typeof projectId === "string" && projectId) list = list.filter((p) => (p as any).projectId === projectId);
  if (typeof q === "string" && q) {
    const kw = (q as string).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.contentEn.toLowerCase().includes(kw) ||
        p.contentZh.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw)) ||
        p.model.toLowerCase().includes(kw),
    );
  }

  const s = typeof sort === "string" ? sort : "latest";
  if (s === "latest") {
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (s === "trending") {
    list = [...list].sort((a, b) => b.viewCount + b.copyCount * 3 - (a.viewCount + a.copyCount * 3));
  } else if (s === "rating") {
    list = [...list].sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (s === "random") {
    list = [...list].sort(() => Math.random() - 0.5);
  }

  const total = list.length;
  const pageNum = Number(page) || 1;
  const pageSizeNum = Number(pageSize) || 12;
  const start = (pageNum - 1) * pageSizeNum;
  const data = list.slice(start, start + pageSizeNum);

  return { data, total, page: pageNum, pageSize: pageSizeNum, hasMore: start + pageSizeNum < total };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const segments = parseSegments(req);
    const first = segments[0] || "";
    const second = segments[1] || "";

    if (method === "GET") {
      // /prompts/stats
      if (first === "stats") {
        const stats = loadStats();
        if (stats) return ok(res, stats);
        const prompts = loadPrompts();
        const pub = prompts.filter((p) => p.status === "published" && p.visibility === "public");
        return ok(res, {
          total: pub.length,
          image: pub.filter((p) => p.type === "image").length,
          video: pub.filter((p) => p.type === "video").length,
          task: pub.filter((p) => p.type === "task").length,
          last7Days: 38,
          users: 4,
          pendingSubmissions: 2,
          sources: 6,
          activeSources: 5,
        });
      }

      // /prompts/filters
      if (first === "filters") {
        return ok(res, loadFilters());
      }

      // /prompts/daily
      if (first === "daily") {
        const prompts = loadPrompts();
        const daily = prompts
          .filter((p) => p.status === "published" && p.visibility === "public" && p.isFeatured)
          .slice(0, 8);
        return ok(res, daily);
      }

      // /prompts/trending
      if (first === "trending") {
        const prompts = loadPrompts();
        const trending = [...prompts.filter((p) => p.status === "published" && p.visibility === "public")]
          .sort((a, b) => b.viewCount + b.copyCount * 2 - (a.viewCount + a.copyCount * 2))
          .slice(0, 8);
        return ok(res, trending);
      }

      // /prompts/latest
      if (first === "latest") {
        const prompts = loadPrompts();
        const latest = [...prompts.filter((p) => p.status === "published" && p.visibility === "public")]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);
        return ok(res, latest);
      }

      // /prompts/list — 列表查询（主要入口，有路径段确保 Vercel 路由可靠匹配）
      if (first === "list") {
        return ok(res, handleListQuery(req.query));
      }

      // /prompts/:id/related
      if (first && second === "related") {
        const prompts = loadPrompts();
        const target = prompts.find((p) => p.id === first);
        if (!target) return fail(res, 404, "Not found");
        const related = prompts
          .filter(
            (p) =>
              p.id !== target.id &&
              p.status === "published" &&
              p.visibility === "public",
          )
          .map((p) => ({
            p,
            score:
              (p.type === target.type ? 2 : 0) +
              (p.model === target.model ? 3 : 0) +
              p.tags.filter((t) => target.tags.includes(t)).length * 2,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map((x) => x.p);
        return ok(res, related);
      }

      // /prompts/:id/comments
      if (first && second === "comments") {
        return ok(res, []);
      }

      // /prompts/:id  (only if first is NOT a known route keyword and no second segment)
      if (first && !second && !ROUTE_KEYWORDS.has(first)) {
        const prompts = loadPrompts();
        const prompt = prompts.find(
          (p) => p.id === first && p.status === "published" && p.visibility === "public",
        );
        if (prompt) return ok(res, prompt);
        return fail(res, 404, "Prompt not found");
      }

      // Fallback: /prompts (no path segments) — 兼容旧调用方式
      return ok(res, handleListQuery(req.query));
    }

    if (method === "POST") {
      // /prompts/:id/copy
      if (first && second === "copy") {
        return ok(res, { copyCount: 1 });
      }
      // /prompts/:id/rate
      if (first && second === "rate") {
        return ok(res, { ok: true });
      }
      // /prompts/:id/comments
      if (first && second === "comments") {
        return ok(res, {
          id: `c_${Date.now()}`,
          promptId: first,
          user: { id: "guest", username: "游客", role: "user" },
          content: typeof req.body === "object" ? req.body.content : "",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return fail(res, 405, "Method not allowed");
  } catch (error) {
    console.error("prompts API error:", error);
    return fail(res, 500, "Internal server error");
  }
}
