/**
 * 提示词相关路由
 */
import { Router, type Request, type Response } from "express";
import {
  comments,
  copyHistory,
  getModels,
  getPromptById,
  getRelated,
  getStats,
  getAllTags,
  prompts,
  queryPrompts,
  ratings,
} from "";
import { resolveUser } from "";

const router = Router();

/** GET /api/prompts — 列表（分页、筛选、搜索） */
router.get("/", (req: Request, res: Response) => {
  const q = {
    q: req.query.q as string | undefined,
    type: req.query.type as any,
    model: req.query.model as string | undefined,
    tag: req.query.tag as string | undefined,
    language: req.query.language as string | undefined,
    sort: req.query.sort as any,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 12,
    featured: req.query.featured === "true",
  };
  res.json({ success: true, data: queryPrompts(q) });
});

/** GET /api/prompts/daily — 每日精选 */
router.get("/daily", (_req, res) => {
  const featured = prompts.filter((p) => p.isFeatured && p.status === "published");
  res.json({ success: true, data: featured });
});

/** GET /api/prompts/trending — 热门 */
router.get("/trending", (_req, res) => {
  const list = [...prompts]
    .filter((p) => p.status === "published")
    .sort((a, b) => b.viewCount + b.copyCount * 3 - (a.viewCount + a.copyCount * 3))
    .slice(0, 8);
  res.json({ success: true, data: list });
});

/** GET /api/prompts/latest — 最新 */
router.get("/latest", (_req, res) => {
  const list = [...prompts]
    .filter((p) => p.status === "published")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 8);
  res.json({ success: true, data: list });
});

/** GET /api/prompts/filters — 筛选项（模型、标签） */
router.get("/filters", (_req, res) => {
  res.json({ success: true, data: { models: getModels(), tags: getAllTags() } });
});

/** GET /api/prompts/stats — 首页统计 */
router.get("/stats", (_req, res) => {
  res.json({ success: true, data: getStats() });
});

/** GET /api/prompts/:id — 详情 */
router.get("/:id", (req, res) => {
  const prompt = getPromptById(req.params.id);
  if (!prompt || prompt.status !== "published") {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  // 私有提示词只有作者本人可见
  if (prompt.visibility === "private") {
    const user = resolveUser(req);
    if (!user || (user.id !== prompt.userId && user.role !== "admin")) {
      res.status(403).json({ success: false, error: "该提示词为私有" });
      return;
    }
  }
  prompt.viewCount += 1;
  res.json({ success: true, data: prompt });
});

/** GET /api/prompts/:id/related — 相关推荐 */
router.get("/:id/related", (req, res) => {
  const prompt = getPromptById(req.params.id);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  res.json({ success: true, data: getRelated(prompt) });
});

/** GET /api/prompts/:id/comments — 评论列表 */
router.get("/:id/comments", (req, res) => {
  const list = comments
    .filter((c) => c.promptId === req.params.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  res.json({ success: true, data: list });
});

/** POST /api/prompts/:id/copy — 记录复制（登录用户记录历史） */
router.post("/:id/copy", (req, res) => {
  const prompt = getPromptById(req.params.id);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  prompt.copyCount += 1;
  const user = resolveUser(req);
  if (user) {
    copyHistory.push({
      id: `h_${Math.random().toString(36).slice(2, 10)}`,
      userId: user.id,
      promptId: prompt.id,
      copiedAt: new Date().toISOString(),
    });
  }
  res.json({ success: true, data: { copyCount: prompt.copyCount } });
});

/** POST /api/prompts/:id/rate — 评分 */
router.post("/:id/rate", (req, res) => {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "请先登录" });
    return;
  }
  const prompt = getPromptById(req.params.id);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  const score = Number(req.body.score);
  if (!score || score < 1 || score > 5) {
    res.status(400).json({ success: false, error: "评分需在 1-5 之间" });
    return;
  }
  const key = `${user.id}:${prompt.id}`;
  const prev = ratings[key];
  ratings[key] = score;
  // 重新计算均分
  const all = Object.entries(ratings)
    .filter(([k]) => k.endsWith(`:${prompt.id}`))
    .map(([, v]) => v);
  prompt.ratingCount = all.length;
  prompt.ratingAvg = Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10;
  res.json({
    success: true,
    data: { ratingAvg: prompt.ratingAvg, ratingCount: prompt.ratingCount, yourScore: score, updated: prev !== undefined },
  });
});

/** POST /api/prompts/:id/comments — 发表评论 */
router.post("/:id/comments", (req, res) => {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "请先登录" });
    return;
  }
  const prompt = getPromptById(req.params.id);
  if (!prompt) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  const content = String(req.body.content ?? "").trim();
  if (!content) {
    res.status(400).json({ success: false, error: "评论内容不能为空" });
    return;
  }
  const comment = {
    id: `c_${Math.random().toString(36).slice(2, 10)}`,
    promptId: prompt.id,
    user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role },
    content,
    createdAt: new Date().toISOString(),
  };
  comments.unshift(comment);
  res.json({ success: true, data: comment });
});

export default router;
