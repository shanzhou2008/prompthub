import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

type User = { id: string; username: string; role: string; avatar?: string };
type Prompt = { id: string; [k: string]: unknown };
type Collection = { id: string; userId: string; name: string; icon?: string; createdAt: string };
type Favorite = { id: string; userId: string; promptId: string; collectionId?: string; createdAt: string };

const dataDir = path.join(process.cwd(), "api", "data");

// 单实例内的内存态
let usersCache: User[] | null = null;
let promptsCache: Prompt[] | null = null;
const sessions: Record<string, { userId: string }> = {};
const favorites: Favorite[] = [];
const collections: Collection[] = [];

function loadUsers(): User[] {
  if (!usersCache) {
    try {
      usersCache = JSON.parse(fs.readFileSync(path.join(dataDir, "users.json"), "utf8"));
    } catch {
      usersCache = [];
    }
  }
  return usersCache;
}
function loadPrompts(): Prompt[] {
  if (!promptsCache) {
    try {
      promptsCache = JSON.parse(fs.readFileSync(path.join(dataDir, "prompts.json"), "utf8"));
    } catch {
      promptsCache = [];
    }
  }
  return promptsCache;
}

function getUserFromRequest(req: VercelRequest): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const session = sessions[token];
  if (!session) return null;
  return loadUsers().find((u) => u.id === session.userId) || null;
}

function getFirst(req: VercelRequest): string {
  const raw = req.query.path;
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  if (parts[0]) return parts[0];
  const url = req.url || "";
  const m = url.match(/\/api\/favorites\/([^/?]+)/);
  return m ? m[1] : "";
}

function getSecond(req: VercelRequest): string {
  const raw = req.query.path;
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  if (parts[1]) return parts[1];
  const url = req.url || "";
  const m = url.match(/\/api\/favorites\/[^/?]+\/([^/?]+)/);
  return m ? m[1] : "";
}

function ok(res: VercelResponse, data: unknown) {
  return res.status(200).json({ success: true, data });
}
function fail(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const first = getFirst(req);
    const user = getUserFromRequest(req);

    if (method === "GET") {
      if (!user) return fail(res, 401, "未登录");

      if (first === "ids") {
        const ids = favorites.filter((f) => f.userId === user.id).map((f) => f.promptId);
        return ok(res, ids);
      }

      if (first === "collections") {
        const list = collections
          .filter((c) => c.userId === user.id)
          .map((c) => ({
            ...c,
            count: favorites.filter((f) => f.userId === user.id && f.collectionId === c.id).length,
          }));
        return ok(res, list);
      }

      const collectionId = req.query.collectionId as string;
      const favs = favorites.filter(
        (f) => f.userId === user.id && (!collectionId || f.collectionId === collectionId),
      );
      const favPrompts = favs
        .map((f) => loadPrompts().find((p) => p.id === f.promptId))
        .filter(Boolean);
      return ok(res, favPrompts);
    }

    if (!user) return fail(res, 401, "未登录");

    if (method === "POST") {
      if (first === "collections") {
        const { name, icon } = req.body || {};
        const collection: Collection = {
          id: `col_${Math.random().toString(36).slice(2, 10)}`,
          userId: user.id,
          name,
          icon: icon || "star",
          createdAt: new Date().toISOString(),
        };
        collections.push(collection);
        return ok(res, collection);
      }

      const { promptId, collectionId } = req.body || {};
      const existing = favorites.find((f) => f.userId === user.id && f.promptId === promptId);
      if (existing) {
        if (collectionId !== undefined) {
          existing.collectionId = collectionId;
        } else {
          const idx = favorites.indexOf(existing);
          if (idx > -1) favorites.splice(idx, 1);
        }
        return ok(res, { favorited: collectionId === undefined ? false : true });
      }
      const fav: Favorite = {
        id: `fav_${Math.random().toString(36).slice(2, 10)}`,
        userId: user.id,
        promptId,
        collectionId,
        createdAt: new Date().toISOString(),
      };
      favorites.push(fav);
      return ok(res, { favorited: true });
    }

    if (method === "PUT") {
      const promptId = first;
      const { collectionId } = req.body || {};
      const fav = favorites.find((f) => f.userId === user.id && f.promptId === promptId);
      if (fav) fav.collectionId = collectionId;
      return ok(res, null);
    }

    if (method === "DELETE") {
      if (first === "collections" && getSecond(req)) {
        const collectionId = getSecond(req);
        const idx = collections.findIndex((c) => c.id === collectionId && c.userId === user.id);
        if (idx > -1) collections.splice(idx, 1);
        return ok(res, null);
      }
      return ok(res, null);
    }

    return fail(res, 405, "Method not allowed");
  } catch (error) {
    console.error("favorites API error:", error);
    return fail(res, 500, "Internal server error");
  }
}
