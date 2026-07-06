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

function loadPrompts(): Prompt[] {
  try {
    const raw = fs.readFileSync(path.join(dataDir, "prompts.json"), "utf8");
    return JSON.parse(raw);
  } catch {
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

function getFirst(req: VercelRequest): string {
  const raw = req.query.path;
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  if (parts[0]) return parts[0];
  const url = req.url || "";
  const m = url.match(/\/api\/prompts\/([^/?]+)/);
  return m ? m[1] : "";
}

function getSecond(req: VercelRequest): string {
  const raw = req.query.path;
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  if (parts[1]) return parts[1];
  const url = req.url || "";
  const m = url.match(/\/api\/prompts\/[^/?]+\/([^/?]+)/);
  return m ? m[1] : "";
}

function hasSecond(req: VercelRequest): boolean {
  return !!getSecond(req);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const first = getFirst(req);
    console.log(`[prompts] ${method} ${req.url} first="${first}" query=`, JSON.stringify(req.query));

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

      // /prompts/:id/related
      if (first && getSecond(req) === "related") {
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
      if (first && getSecond(req) === "comments") {
        // 静态数据无评论，返回空数组
        return ok(res, []);
      }

      // /prompts/:id
      if (first && !hasSecond(req)) {
        const prompts = loadPrompts();
        const prompt = prompts.find(
          (p) => p.id === first && p.status === "published" && p.visibility === "public",
        );
        if (prompt) return ok(res, prompt);
        return fail(res, 404, "Prompt not found");
      }

      // /prompts (列表)
      const prompts = loadPrompts();
      console.log(`[prompts list] loaded ${prompts.length} prompts from JSON`);
      const { q, type, model, tag, sort = "latest", page = "1", pageSize = "12", featured, language, authorId, projectId } = req.query;
      console.log(`[prompts list] filters: q="${q}" type="${type}" model="${model}" tag="${tag}" sort="${sort}" page="${page}"`);

      let list = prompts.filter((p) => p.status === "published" && p.visibility === "public");

      if (featured === "true") list = list.filter((p) => p.isFeatured);
      if (typeof type === "string" && type) list = list.filter((p) => p.type === type);
      if (typeof model === "string" && model) list = list.filter((p) => p.model === model);
      if (typeof tag === "string" && tag) list = list.filter((p) => p.tags.includes(tag));
      if (typeof language === "string" && language) list = list.filter((p) => p.language === language);
      if (typeof authorId === "string" && authorId) list = list.filter((p) => (p as any).userId === authorId);
      if (typeof projectId === "string" && projectId) list = list.filter((p) => (p as any).projectId === projectId);
      if (typeof q === "string" && q) {
        const kw = q.toLowerCase();
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

      return ok(res, {
        data,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: start + pageSizeNum < total,
      });
    }

    if (method === "POST") {
      // /prompts/:id/copy
      if (first && getSecond(req) === "copy") {
        return ok(res, { copyCount: 1 });
      }
      // /prompts/:id/rate
      if (first && getSecond(req) === "rate") {
        return ok(res, { ok: true });
      }
      // /prompts/:id/comments
      if (first && getSecond(req) === "comments") {
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
