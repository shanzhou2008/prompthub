/**
 * 管理后台路由
 */
import { Router, type Request, type Response } from "express";
import {
  dataSources,
  jobLogs,
  prompts,
  submissions,
} from "";
import { requireAdmin, AuthedRequest } from "";

const router = Router();

/** GET /api/admin/stats — 数据看板 */
router.get("/stats", requireAdmin, (_req, res) => {
  const published = prompts.filter((p) => p.status === "published");
  const pending = submissions.filter((s) => s.status === "pending").length;
  res.json({
    success: true,
    data: {
      total: published.length,
      pendingSubmissions: pending,
      totalViews: published.reduce((a, b) => a + b.viewCount, 0),
      totalCopies: published.reduce((a, b) => a + b.copyCount, 0),
      byType: {
        image: published.filter((p) => p.type === "image").length,
        video: published.filter((p) => p.type === "video").length,
        task: published.filter((p) => p.type === "task").length,
      },
      recent: published
        .slice()
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6)
        .map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt, type: p.type })),
    },
  });
});

/** GET /api/admin/review — 投稿审核队列 */
router.get("/review", requireAdmin, (_req, res) => {
  res.json({ success: true, data: submissions });
});

/** POST /api/admin/review — 审核投稿（通过/拒绝） */
router.post("/review", requireAdmin, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const { id, action, note } = req.body ?? {};
  const sub = submissions.find((s) => s.id === id);
  if (!sub) {
    res.status(404).json({ success: false, error: "投稿不存在" });
    return;
  }
  if (action === "approve") {
    sub.status = "published";
    sub.reviewNote = note;
    sub.reviewedAt = new Date().toISOString();
    const newPrompt = {
      ...sub.payload,
      id: `p_${Math.random().toString(36).slice(2, 10)}`,
      viewCount: 0,
      copyCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: false,
      status: "published" as const,
      authorName: sub.payload.authorName ?? user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    prompts.unshift(newPrompt);
  } else if (action === "reject") {
    sub.status = "rejected";
    sub.reviewNote = note;
    sub.reviewedAt = new Date().toISOString();
  }
  res.json({ success: true, data: sub });
});

/** GET /api/admin/prompts — 提示词管理 */
router.get("/prompts", requireAdmin, (_req, res) => {
  res.json({ success: true, data: prompts });
});

/** DELETE /api/admin/prompts/:id — 删除提示词 */
router.delete("/prompts/:id", requireAdmin, (req, res) => {
  const idx = prompts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  const [removed] = prompts.splice(idx, 1);
  res.json({ success: true, data: removed });
});

/** PATCH /api/admin/prompts/:id — 切换精选 */
router.patch("/prompts/:id", requireAdmin, (req, res) => {
  const p = prompts.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ success: false, error: "提示词不存在" });
    return;
  }
  if (typeof req.body.isFeatured === "boolean") p.isFeatured = req.body.isFeatured;
  if (typeof req.body.status === "string") p.status = req.body.status;
  res.json({ success: true, data: p });
});

/** GET /api/admin/sources — 数据源 */
router.get("/sources", requireAdmin, (_req, res) => {
  res.json({ success: true, data: dataSources });
});

/** PATCH /api/admin/sources/:id — 切换数据源启用 */
router.patch("/sources/:id", requireAdmin, (req, res) => {
  const s = dataSources.find((x) => x.id === req.params.id);
  if (!s) {
    res.status(404).json({ success: false, error: "数据源不存在" });
    return;
  }
  if (typeof req.body.enabled === "boolean") s.enabled = req.body.enabled;
  res.json({ success: true, data: s });
});

/** GET /api/admin/jobs — 任务日志 */
router.get("/jobs", requireAdmin, (_req, res) => {
  res.json({ success: true, data: jobLogs });
});

/** POST /api/admin/jobs/:id/trigger — 手动触发抓取 */
router.post("/jobs/:id/trigger", requireAdmin, (req, res) => {
  const s = dataSources.find((x) => x.id === req.params.id);
  if (!s) {
    res.status(404).json({ success: false, error: "数据源不存在" });
    return;
  }
  const log = {
    id: `j_${Math.random().toString(36).slice(2, 10)}`,
    sourceId: s.id,
    sourceName: s.name,
    status: "success" as const,
    itemsFetched: 24,
    itemsAdded: Math.floor(Math.random() * 12) + 1,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };
  s.lastRunAt = log.startedAt;
  s.lastStatus = "success";
  s.itemsAdded += log.itemsAdded;
  res.json({ success: true, data: log });
});

export default router;
