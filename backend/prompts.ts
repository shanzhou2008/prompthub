import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prompts, queryPrompts } from "./backend/store";
import type { Prompt } from "./backend/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;

    if (method === "GET") {
      const { q, type, model, tag, sort = "latest", page = 1, pageSize = 12 } = req.query;
      
      if (req.url?.includes("/stats")) {
        const total = prompts.filter(p => p.status === "published" && p.visibility === "public").length;
        const image = prompts.filter(p => p.type === "image" && p.status === "published" && p.visibility === "public").length;
        const video = prompts.filter(p => p.type === "video" && p.status === "published" && p.visibility === "public").length;
        const task = prompts.filter(p => p.type === "task" && p.status === "published" && p.visibility === "public").length;
        return res.status(200).json({ success: true, data: { total, image, video, task, last7Days: 38, users: 4, pendingSubmissions: 2, sources: 6, activeSources: 5 } });
      }

      if (req.url?.includes("/filters")) {
        const modelMap = new Map<string, number>();
        const tagMap = new Map<string, number>();
        prompts.filter(p => p.status === "published" && p.visibility === "public").forEach(p => {
          modelMap.set(p.model, (modelMap.get(p.model) || 0) + 1);
          p.tags.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1));
        });
        const models = Array.from(modelMap.entries()).map(([name, count]) => ({
          name,
          vendor: name.includes("midjourney") ? "Midjourney" : name.includes("flux") ? "Black Forest Labs" : name.includes("stable") ? "Stability AI" : name.includes("dall") ? "OpenAI" : name.includes("gpt") ? "OpenAI" : name.includes("claude") ? "Anthropic" : name.includes("gemini") ? "Google" : name.includes("sora") ? "OpenAI" : "Unknown",
          type: name.includes("sora") || name.includes("kling") || name.includes("runway") || name.includes("jimeng") || name.includes("pika") || name.includes("hailuo") ? "video" : name.includes("gpt") || name.includes("claude") || name.includes("gemini") || name.includes("deepseek") ? "task" : "image",
          count
        }));
        const tags = Array.from(tagMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        return res.status(200).json({ success: true, data: { models, tags } });
      }

      if (req.url?.includes("/daily")) {
        const daily = prompts.filter(p => p.status === "published" && p.visibility === "public" && p.isFeatured).slice(0, 8);
        return res.status(200).json({ success: true, data: daily });
      }

      if (req.url?.includes("/trending")) {
        const trending = [...prompts.filter(p => p.status === "published" && p.visibility === "public")].sort((a, b) => (b.viewCount + b.copyCount * 2) - (a.viewCount + a.copyCount * 2)).slice(0, 8);
        return res.status(200).json({ success: true, data: trending });
      }

      if (req.url?.includes("/latest")) {
        const latest = [...prompts.filter(p => p.status === "published" && p.visibility === "public")].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
        return res.status(200).json({ success: true, data: latest });
      }

      const idMatch = req.url?.match(/\/prompts\/([^/]+)$/);
      if (idMatch) {
        const prompt = prompts.find(p => p.id === idMatch[1] && p.status === "published" && p.visibility === "public");
        if (prompt) return res.status(200).json({ success: true, data: prompt });
        return res.status(404).json({ success: false, error: "Prompt not found" });
      }

      const data = queryPrompts({
        q: typeof q === "string" ? q : "",
        type: typeof type === "string" ? type : "",
        model: typeof model === "string" ? model : "",
        tag: typeof tag === "string" ? tag : "",
        sort: typeof sort === "string" ? sort : "latest",
        page: Number(page),
        pageSize: Number(pageSize),
      });
      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
