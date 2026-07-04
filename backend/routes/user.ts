/**
 * 用户数据路由：复制历史、我的提示词、对比、导出
 */
import { Router, type Request, type Response } from "express";
import {
  copyHistory,
  prompts,
  queryUserPrompts,
} from "../store.js";
import { requireAuth, AuthedRequest } from "../lib/auth.js";
import type { Prompt } from "../types.js";

const router = Router();

/** GET /api/user/history — 复制历史 */
router.get("/history", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const list = copyHistory
    .filter((h) => h.userId === user.id)
    .sort((a, b) => +new Date(b.copiedAt) - +new Date(a.copiedAt))
    .slice(0, 50)
    .map((h) => {
      const p = prompts.find((pr) => pr.id === h.promptId);
      return p
        ? { ...h, promptTitle: p.title, promptType: p.type }
        : null;
    })
    .filter(Boolean);
  res.json({ success: true, data: list });
});

/** DELETE /api/user/history — 清空复制历史 */
router.delete("/history", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  for (let i = copyHistory.length - 1; i >= 0; i--) {
    if (copyHistory[i].userId === user.id) copyHistory.splice(i, 1);
  }
  res.json({ success: true });
});

/** GET /api/user/prompts — 我的提示词（含私有） */
router.get("/prompts", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const projectId = req.query.projectId as string | undefined;
  res.json({ success: true, data: queryUserPrompts(user.id, projectId) });
});

/** POST /api/user/prompts — 创建提示词（直接发布，无需审核） */
router.post("/prompts", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const {
    title, contentEn, contentZh, type, model, vendor, params,
    tags, language, hue, pattern, visibility, projectId,
  } = req.body;
  if (!title || !contentEn) {
    res.status(400).json({ success: false, error: "标题和英文内容不能为空" });
    return;
  }
  const prompt: Prompt = {
    id: `u_${Math.random().toString(36).slice(2, 10)}`,
    title: String(title),
    content: String(contentEn),
    contentEn: String(contentEn),
    contentZh: String(contentZh ?? contentEn),
    type: type ?? "task",
    model: model ?? "gpt-4",
    vendor: vendor ?? "OpenAI",
    params: params ?? {},
    tags: tags ?? [],
    language: language ?? "zh",
    source: "submitted",
    hue: hue ?? 270,
    pattern: pattern ?? "grid",
    viewCount: 0,
    copyCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: false,
    status: "published",
    authorName: user.username,
    userId: user.id,
    visibility: visibility ?? "private",
    projectId: projectId || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  prompts.push(prompt);
  res.json({ success: true, data: prompt });
});

/** PUT /api/user/prompts/:id — 编辑自己的提示词 */
router.put("/prompts/:id", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const prompt = prompts.find((p) => p.id === req.params.id && p.userId === user.id);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  const { title, contentEn, contentZh, tags, visibility, projectId, params } = req.body;
  if (title) prompt.title = String(title);
  if (contentEn) { prompt.content = String(contentEn); prompt.contentEn = String(contentEn); }
  if (contentZh) prompt.contentZh = String(contentZh);
  if (tags) prompt.tags = tags;
  if (visibility) prompt.visibility = visibility;
  if (projectId !== undefined) prompt.projectId = projectId || undefined;
  if (params) prompt.params = params;
  prompt.updatedAt = new Date().toISOString();
  res.json({ success: true, data: prompt });
});

/** DELETE /api/user/prompts/:id — 删除自己的提示词 */
router.delete("/prompts/:id", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const idx = prompts.findIndex((p) => p.id === req.params.id && p.userId === user.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  prompts.splice(idx, 1);
  res.json({ success: true });
});

/** POST /api/user/copy — 记录复制（带用户历史） */
router.post("/copy", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const promptId = String(req.body.promptId ?? "");
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  prompt.copyCount += 1;
  copyHistory.push({
    id: `h_${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    promptId,
    copiedAt: new Date().toISOString(),
  });
  res.json({ success: true, data: { copyCount: prompt.copyCount } });
});

/** GET /api/user/compare?ids=a,b — 对比多个提示词 */
router.get("/compare", requireAuth, (req: Request, res: Response) => {
  const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
  if (ids.length < 2) {
    res.status(400).json({ success: false, error: "请至少选择 2 个提示词" });
    return;
  }
  const list = ids
    .map((id) => prompts.find((p) => p.id === id))
    .filter(Boolean) as Prompt[];
  res.json({ success: true, data: list });
});

/** GET /api/user/export?ids=a,b&format=json|markdown — 导出提示词 */
router.get("/export", (req: Request, res: Response) => {
  const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
  const format = String(req.query.format ?? "json");
  const list = ids
    .map((id) => prompts.find((p) => p.id === id))
    .filter(Boolean) as Prompt[];
  if (list.length === 0) {
    res.status(400).json({ success: false, error: "未找到可导出的提示词" });
    return;
  }
  if (format === "markdown") {
    const md = list
      .map(
        (p) =>
          `## ${p.title}\n\n**类型**: ${p.type} | **模型**: ${p.model} | **标签**: ${p.tags.join(", ")}\n\n### 英文版本\n\`\`\`\n${p.contentEn}\n\`\`\`\n\n### 中文版本\n\`\`\`\n${p.contentZh}\n\`\`\`\n`,
      )
      .join("\n---\n\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=prompts.md");
    res.send(md);
  } else {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=prompts.json");
    res.send(JSON.stringify(list, null, 2));
  }
});

export default router;
