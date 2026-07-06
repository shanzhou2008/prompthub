import type { VercelRequest, VercelResponse } from "@vercel/node";
import { users, sessions, prompts, favorites, collections } from "../../backend/store";

function getUserFromRequest(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const session = sessions[token];
  if (!session) return null;
  return users.find(u => u.id === session.userId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method, url } = req;
    const user = getUserFromRequest(req);
    
    if (!user && method !== "GET") {
      return res.status(401).json({ success: false, error: "未登录" });
    }

    if (method === "GET") {
      if (url?.endsWith("/ids")) {
        if (!user) return res.status(401).json({ success: false, error: "未登录" });
        const favIds = favorites.filter(f => f.userId === user.id).map(f => f.promptId);
        return res.status(200).json({ success: true, data: favIds });
      }

      if (url?.endsWith("/collections")) {
        if (!user) return res.status(401).json({ success: false, error: "未登录" });
        const userCollections = collections.filter(c => c.userId === user.id).map(c => ({
          ...c,
          count: favorites.filter(f => f.userId === user.id && f.collectionId === c.id).length
        }));
        return res.status(200).json({ success: true, data: userCollections });
      }

      const collectionId = req.query.collectionId as string;
      if (!user) return res.status(401).json({ success: false, error: "未登录" });
      const favs = favorites.filter(f => f.userId === user.id && (!collectionId || f.collectionId === collectionId));
      const favPrompts = favs.map(f => prompts.find(p => p.id === f.promptId)).filter(Boolean);
      return res.status(200).json({ success: true, data: favPrompts });
    }

    if (method === "POST") {
      if (url?.endsWith("/collections")) {
        if (!user) return res.status(401).json({ success: false, error: "未登录" });
        const { name, icon } = req.body;
        const collection = {
          id: `col_${Math.random().toString(36).slice(2, 10)}`,
          userId: user.id,
          name,
          icon: icon || "star",
          createdAt: new Date().toISOString(),
        };
        collections.push(collection);
        return res.status(200).json({ success: true, data: collection });
      }

      const { promptId, collectionId } = req.body;
      const existing = favorites.find(f => f.userId === user!.id && f.promptId === promptId);
      
      if (existing) {
        if (collectionId !== undefined) {
          existing.collectionId = collectionId;
        } else {
          const idx = favorites.indexOf(existing);
          if (idx > -1) favorites.splice(idx, 1);
        }
        return res.status(200).json({ success: true, data: { favorited: !collectionId === undefined && !existing.collectionId } });
      }

      const fav = {
        id: `fav_${Math.random().toString(36).slice(2, 10)}`,
        userId: user!.id,
        promptId,
        collectionId,
        createdAt: new Date().toISOString(),
      };
      favorites.push(fav);
      return res.status(200).json({ success: true, data: { favorited: true } });
    }

    if (method === "PUT") {
      const pathParts = req.query.path as string[] || [];
      const promptId = pathParts[pathParts.length - 1];
      const { collectionId } = req.body;
      
      const fav = favorites.find(f => f.userId === user!.id && f.promptId === promptId);
      if (fav) {
        fav.collectionId = collectionId;
      }
      return res.status(200).json({ success: true });
    }

    if (method === "DELETE") {
      if (url?.includes("/collections/")) {
        if (!user) return res.status(401).json({ success: false, error: "未登录" });
        const pathParts = req.query.path as string[] || [];
        const collectionId = pathParts.filter(p => p !== "collections")[0];
        const idx = collections.findIndex(c => c.id === collectionId && c.userId === user.id);
        if (idx > -1) collections.splice(idx, 1);
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
