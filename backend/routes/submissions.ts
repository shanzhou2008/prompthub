/**
 * 投稿与订阅路由
 */
import { Router, type Request, type Response } from "express";
import { prompts, submissions } from "";
import { requireAuth, AuthedRequest } from "";

const router = Router();

/** POST /api/submissions — 提交投稿 */
router.post("/", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const b = req.body ?? {};
  const required = ["title", "content", "type", "model"];
  for (const f of required) {
    if (!b[f]) {
      res.status(400).json({ success: false, error: `缺少字段：${f}` });
      return;
    }
  }
  const sub = {
    id: `s_${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
    payload: {
      title: b.title,
      content: b.content,
      contentEn: b.contentEn ?? b.content,
      contentZh: b.contentZh ?? b.content,
      type: b.type,
      model: b.model,
      vendor: b.vendor ?? "未知",
      params: b.params ?? {},
      tags: b.tags ?? [],
      language: b.language ?? "zh",
      source: "submitted" as const,
      hue: b.hue ?? Math.floor(Math.random() * 360),
      pattern: b.pattern ?? "mesh",
      authorName: user.username,
      visibility: (b.visibility ?? "public") as "public" | "private" | "link",
    },
  };
  submissions.unshift(sub);
  res.json({ success: true, data: sub });
});

/** GET /api/submissions/me — 我的投稿 */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const list = submissions.filter((s) => s.userId === user.id);
  res.json({ success: true, data: list });
});

/** POST /api/subscriptions — 订阅每日精选 */
router.post("/", (req: Request, res: Response) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ success: false, error: "邮箱格式不正确" });
    return;
  }
  res.json({ success: true, data: { email, frequency: "daily", subscribed: true } });
});

export default router;
