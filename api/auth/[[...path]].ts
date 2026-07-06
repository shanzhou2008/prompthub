import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

type User = {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: string;
  avatar?: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "api", "data");

// 内存态（仅单实例内有效）
const sessions: Record<string, { userId: string; createdAt: string }> = {};
const smsCodes: Record<string, string> = {};

function loadUsers(): User[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, "users.json"), "utf8"));
  } catch {
    return [];
  }
}

// 单实例内可变的用户表
let usersCache: User[] | null = null;
function getUsers(): User[] {
  if (!usersCache) usersCache = loadUsers();
  return usersCache;
}

function ok(res: VercelResponse, data: unknown) {
  return res.status(200).json({ success: true, data });
}
function fail(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}
function publicUser(u: User) {
  return { id: u.id, username: u.username, email: u.email, phone: u.phone, avatar: u.avatar ?? "", role: u.role, createdAt: u.createdAt };
}

function getAction(req: VercelRequest): string {
  const raw = req.query.path;
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  if (parts[0]) return parts[0];
  // 后备：从 url 解析
  const url = req.url || "";
  const m = url.match(/\/api\/auth\/([^/?]+)/);
  return m ? m[1] : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const action = getAction(req);

    if (method === "POST") {
      if (action === "login") {
        const { account, password } = req.body || {};
        const user = getUsers().find(
          (u) => (u.email === account || u.phone === account) && u.passwordHash === password,
        );
        if (!user) return fail(res, 401, "账号或密码错误");
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        return ok(res, { token, user: publicUser(user) });
      }

      if (action === "login-sms") {
        const { phone, code } = req.body || {};
        if (smsCodes[phone] !== code) return fail(res, 401, "验证码错误");
        let user = getUsers().find((u) => u.phone === phone);
        if (!user) {
          user = {
            id: `u_${Math.random().toString(36).slice(2, 10)}`,
            username: `用户${(phone || "").slice(-4)}`,
            phone,
            role: "user",
            passwordHash: "",
            avatar: "",
            createdAt: new Date().toISOString(),
          };
          getUsers().push(user);
        }
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        return ok(res, { token, user: publicUser(user) });
      }

      if (action === "send-code") {
        const { phone } = req.body || {};
        smsCodes[phone] = "1234";
        return ok(res, { phone, hint: "验证码已发送，演示验证码为 1234" });
      }

      if (action === "register") {
        const { email, phone, username, password } = req.body || {};
        const exists = getUsers().find((u) => u.email === email || u.phone === phone);
        if (exists) return fail(res, 400, "账号已存在");
        const user: User = {
          id: `u_${Math.random().toString(36).slice(2, 10)}`,
          username,
          email: email || undefined,
          phone: phone || undefined,
          role: "user",
          passwordHash: password,
          avatar: "",
          createdAt: new Date().toISOString(),
        };
        getUsers().push(user);
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        return ok(res, { token, user: publicUser(user) });
      }

      if (action === "logout") {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          delete sessions[token];
        }
        return ok(res, null);
      }
    }

    if (method === "GET" && action === "me") {
      const authHeader = req.headers.authorization;
      if (!authHeader) return fail(res, 401, "未登录");
      const token = authHeader.replace("Bearer ", "");
      const session = sessions[token];
      if (!session) return fail(res, 401, "登录已过期");
      const user = getUsers().find((u) => u.id === session.userId);
      if (!user) return fail(res, 404, "用户不存在");
      return ok(res, publicUser(user));
    }

    return fail(res, 405, "Method not allowed");
  } catch (error) {
    console.error("auth API error:", error);
    return fail(res, 500, "Internal server error");
  }
}
