/**
 * 鉴权工具（基于内存会话 token 的简化实现）
 */
import type { NextFunction, Request, Response } from "express";
import { sessions, users } from "";
import type { PublicUser, User } from "";

export interface AuthedRequest extends Request {
  user?: User;
}

function toPublic(u: User): PublicUser {
  return { id: u.id, username: u.username, avatar: u.avatar, role: u.role };
}

/** 从请求头解析当前用户 */
export function resolveUser(req: Request): User | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice(7);
  const userId = sessions[token];
  if (!userId) return undefined;
  return users.find((u) => u.id === userId);
}

/** 任意已登录用户 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "未登录" });
    return;
  }
  (req as AuthedRequest).user = user;
  next();
}

/** 仅管理员 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "未登录" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ success: false, error: "需要管理员权限" });
    return;
  }
  (req as AuthedRequest).user = user;
  next();
}

/** 生成会话 token 并登记 */
export function createSession(userId: string): string {
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  sessions[token] = userId;
  return token;
}

export { toPublic };
