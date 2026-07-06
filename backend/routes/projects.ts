/**
 * 用户项目路由（提示词按项目分类）
 */
import { Router, type Request, type Response } from "express";
import {
  projects,
  prompts,
  getProjectPromptCount,
  queryUserPrompts,
} from "../store";
import { requireAuth, AuthedRequest } from "../lib/auth";
import type { Visibility } from "../types";

const router = Router();

/** GET /api/projects — 当前用户的项目列表 */
router.get("/", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const list = projects
    .filter((p) => p.userId === user.id)
    .map((p) => ({
      ...p,
      promptCount: getProjectPromptCount(p.id),
    }));
  res.json({ success: true, data: list });
});

/** POST /api/projects — 创建项目 */
router.post("/", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();
  const color = String(req.body.color ?? "#7c3aed");
  const visibility = (String(req.body.visibility ?? "private") as Visibility);
  if (!name) {
    res.status(400).json({ success: false, error: "项目名称不能为空" });
    return;
  }
  const proj = {
    id: `pj_${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    name,
    description: description || undefined,
    color,
    visibility,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(proj);
  res.json({ success: true, data: { ...proj, promptCount: 0 } });
});

/** PUT /api/projects/:id — 更新项目 */
router.put("/:id", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const proj = projects.find((p) => p.id === req.params.id && p.userId === user.id);
  if (!proj) {
    res.status(404).json({ success: false, error: "项目不存在" });
    return;
  }
  if (req.body.name) proj.name = String(req.body.name);
  if (req.body.description !== undefined) proj.description = String(req.body.description);
  if (req.body.color) proj.color = String(req.body.color);
  if (req.body.visibility) proj.visibility = req.body.visibility as Visibility;
  proj.updatedAt = new Date().toISOString();
  res.json({ success: true, data: { ...proj, promptCount: getProjectPromptCount(proj.id) } });
});

/** DELETE /api/projects/:id — 删除项目（提示词解除关联但不删除） */
router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const idx = projects.findIndex((p) => p.id === req.params.id && p.userId === user.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: "项目不存在" });
    return;
  }
  projects.splice(idx, 1);
  // 解除该项目下所有提示词的关联
  prompts
    .filter((p) => p.projectId === req.params.id)
    .forEach((p) => (p.projectId = undefined));
  res.json({ success: true });
});

/** GET /api/projects/:id/prompts — 项目下的提示词 */
router.get("/:id/prompts", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const proj = projects.find((p) => p.id === req.params.id && p.userId === user.id);
  if (!proj) {
    res.status(404).json({ success: false, error: "项目不存在" });
    return;
  }
  res.json({ success: true, data: queryUserPrompts(user.id, req.params.id) });
});

export default router;
