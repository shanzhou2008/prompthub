/**
 * 收藏路由（支持收藏夹分组）
 */
import { Router, type Request, type Response } from "express";
import {
  collections,
  favorites,
  prompts,
} from "../store";
import { requireAuth, AuthedRequest } from "../lib/auth";

const router = Router();

/** GET /api/favorites — 当前用户收藏列表（可按收藏夹筛选） */
router.get("/", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const collectionId = req.query.collectionId as string | undefined;
  let userFavs = favorites.filter((f) => f.userId === user.id);
  if (collectionId) {
    userFavs = userFavs.filter((f) => f.collectionId === collectionId);
  }
  const list = userFavs
    .map((f) => {
      const p = prompts.find((pr) => pr.id === f.promptId);
      return p ? { ...p, collectionId: f.collectionId, favoritedAt: f.createdAt } : null;
    })
    .filter(Boolean);
  res.json({ success: true, data: list });
});

/** GET /api/favorites/ids — 当前用户收藏的 id 集 */
router.get("/ids", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const ids = favorites.filter((f) => f.userId === user.id).map((f) => f.promptId);
  res.json({ success: true, data: ids });
});

/** POST /api/favorites — 收藏 / 取消收藏（可指定收藏夹） */
router.post("/", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const promptId = String(req.body.promptId ?? "");
  const collectionId = String(req.body.collectionId ?? "") || undefined;
  const existing = favorites.find(
    (f) => f.userId === user.id && f.promptId === promptId,
  );
  if (existing) {
    const idx = favorites.indexOf(existing);
    favorites.splice(idx, 1);
    res.json({ success: true, data: { favorited: false } });
  } else {
    favorites.push({
      id: `f_${Math.random().toString(36).slice(2, 10)}`,
      userId: user.id,
      promptId,
      collectionId,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { favorited: true } });
  }
});

/** PUT /api/favorites/:promptId — 移动到其他收藏夹 */
router.put("/:promptId", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const promptId = req.params.promptId;
  const collectionId = String(req.body.collectionId ?? "") || undefined;
  const fav = favorites.find(
    (f) => f.userId === user.id && f.promptId === promptId,
  );
  if (!fav) {
    res.status(404).json({ success: false, error: "未收藏该提示词" });
    return;
  }
  fav.collectionId = collectionId;
  res.json({ success: true });
});

// ---- 收藏夹分组 CRUD ----

/** GET /api/favorites/collections — 当前用户的收藏夹列表 */
router.get("/collections", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const userCols = collections.filter((c) => c.userId === user.id);
  const withCount = userCols.map((c) => ({
    ...c,
    count: favorites.filter((f) => f.userId === user.id && f.collectionId === c.id).length,
  }));
  res.json({ success: true, data: withCount });
});

/** POST /api/favorites/collections — 创建收藏夹 */
router.post("/collections", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const name = String(req.body.name ?? "").trim();
  const icon = String(req.body.icon ?? "bookmark");
  if (!name) {
    res.status(400).json({ success: false, error: "收藏夹名称不能为空" });
    return;
  }
  const col = {
    id: `col_${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    name,
    icon,
    createdAt: new Date().toISOString(),
  };
  collections.push(col);
  res.json({ success: true, data: col });
});

/** DELETE /api/favorites/collections/:id — 删除收藏夹 */
router.delete("/collections/:id", requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const id = req.params.id;
  const idx = collections.findIndex((c) => c.id === id && c.userId === user.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: "收藏夹不存在" });
    return;
  }
  collections.splice(idx, 1);
  // 解除该收藏夹下所有收藏的关联
  favorites
    .filter((f) => f.userId === user.id && f.collectionId === id)
    .forEach((f) => (f.collectionId = undefined));
  res.json({ success: true });
});

export default router;
