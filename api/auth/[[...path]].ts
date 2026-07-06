import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { User } from "../../backend/types";
import { users, smsCodes, sessions } from "../../backend/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method, url } = req;

    if (method === "POST") {
      if (url?.endsWith("/login")) {
        const { account, password } = req.body;
        const user = users.find(u => (u.email === account || u.phone === account) && u.passwordHash === password);
        if (!user) return res.status(401).json({ success: false, error: "账号或密码错误" });
        
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        
        return res.status(200).json({ success: true, data: { token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } } });
      }

      if (url?.endsWith("/login-sms")) {
        const { phone, code } = req.body;
        if (smsCodes[phone] !== code) return res.status(401).json({ success: false, error: "验证码错误" });
        
        let user = users.find(u => u.phone === phone);
        if (!user) {
          user = {
            id: `u_${Math.random().toString(36).slice(2, 10)}`,
            username: `用户${phone.slice(-4)}`,
            phone,
            role: "user",
            passwordHash: "",
            createdAt: new Date().toISOString(),
          };
          users.push(user);
        }
        
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        
        return res.status(200).json({ success: true, data: { token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } } });
      }

      if (url?.endsWith("/send-code")) {
        const { phone } = req.body;
        smsCodes[phone] = "1234";
        return res.status(200).json({ success: true, data: { phone, hint: "验证码已发送，演示验证码为 1234" } });
      }

      if (url?.endsWith("/register")) {
        const { email, phone, username, password } = req.body;
        const exists = users.find(u => u.email === email || u.phone === phone);
        if (exists) return res.status(400).json({ success: false, error: "账号已存在" });
        
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
        users.push(user);
        
        const token = `token_${Math.random().toString(36).slice(2, 20)}`;
        sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
        
        return res.status(200).json({ success: true, data: { token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } } });
      }

      if (url?.endsWith("/logout")) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          delete sessions[token];
        }
        return res.status(200).json({ success: true });
      }
    }

    if (method === "GET") {
      if (url?.endsWith("/me")) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: "未登录" });
        
        const token = authHeader.replace("Bearer ", "");
        const session = sessions[token];
        if (!session) return res.status(401).json({ success: false, error: "登录已过期" });
        
        const user = users.find(u => u.id === session.userId);
        if (!user) return res.status(404).json({ success: false, error: "用户不存在" });
        
        return res.status(200).json({ success: true, data: { id: user.id, username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, role: user.role, createdAt: user.createdAt } });
      }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
