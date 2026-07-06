/**
 * 用户认证路由
 * 支持：邮箱+密码、手机号+密码、手机号+验证码
 */
import { Router, type Request, type Response } from "express";
import { passwords, sessions, smsCodes, users } from "../store";
import { createSession, resolveUser, toPublic } from "../lib/auth";

const router = Router();

/** POST /api/auth/register — 注册（邮箱或手机号） */
router.post("/register", (req: Request, res: Response) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const phone = String(req.body.phone ?? "").trim();
  const username = String(req.body.username ?? "").trim();
  const password = String(req.body.password ?? "");
  const code = String(req.body.code ?? ""); // 手机号+验证码注册时需验证

  if (!username || !password) {
    res.status(400).json({ success: false, error: "请填写用户名和密码" });
    return;
  }
  if (!email && !phone) {
    res.status(400).json({ success: false, error: "请提供邮箱或手机号" });
    return;
  }

  // 手机号注册需验证验证码
  if (phone && !email) {
    const saved = smsCodes[phone];
    if (!saved || saved !== code) {
      res.status(400).json({ success: false, error: "验证码错误或已过期" });
      return;
    }
    delete smsCodes[phone];
  }

  if (email && users.some((u) => u.email === email)) {
    res.status(409).json({ success: false, error: "该邮箱已注册" });
    return;
  }
  if (phone && users.some((u) => u.phone === phone)) {
    res.status(409).json({ success: false, error: "该手机号已注册" });
    return;
  }
  if (users.some((u) => u.username === username)) {
    res.status(409).json({ success: false, error: "用户名已被占用" });
    return;
  }

  const user = {
    id: `u_${Math.random().toString(36).slice(2, 10)}`,
    email: email || undefined,
    phone: phone || undefined,
    username,
    passwordHash: password,
    role: "user" as const,
    avatar: "",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  if (email) passwords[email] = password;
  if (phone) passwords[phone] = password;
  const token = createSession(user.id);
  res.json({ success: true, data: { token, user: { ...toPublic(user) } } });
});

/** POST /api/auth/login — 登录（邮箱/手机号 + 密码） */
router.post("/login", (req: Request, res: Response) => {
  const account = String(req.body.account ?? req.body.email ?? req.body.phone ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  if (!account || !password) {
    res.status(400).json({ success: false, error: "请填写账号和密码" });
    return;
  }
  const user = users.find((u) => u.email === account || u.phone === account);
  if (!user || passwords[account] !== password) {
    res.status(401).json({ success: false, error: "账号或密码错误" });
    return;
  }
  const token = createSession(user.id);
  res.json({ success: true, data: { token, user: { ...toPublic(user) } } });
});

/** POST /api/auth/login-sms — 手机号+验证码登录 */
router.post("/login-sms", (req: Request, res: Response) => {
  const phone = String(req.body.phone ?? "").trim();
  const code = String(req.body.code ?? "").trim();
  if (!phone || !code) {
    res.status(400).json({ success: false, error: "请填写手机号和验证码" });
    return;
  }
  const saved = smsCodes[phone];
  if (!saved || saved !== code) {
    res.status(401).json({ success: false, error: "验证码错误或已过期" });
    return;
  }
  const user = users.find((u) => u.phone === phone);
  if (!user) {
    res.status(404).json({ success: false, error: "该手机号未注册" });
    return;
  }
  delete smsCodes[phone];
  const token = createSession(user.id);
  res.json({ success: true, data: { token, user: { ...toPublic(user) } } });
});

/** POST /api/auth/send-code — 发送手机验证码（演示环境返回固定 1234） */
router.post("/send-code", (req: Request, res: Response) => {
  const phone = String(req.body.phone ?? "").trim();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, error: "请输入有效的手机号" });
    return;
  }
  // 演示环境：固定验证码 1234
  const code = "1234";
  smsCodes[phone] = code;
  res.json({ success: true, data: { phone, hint: `演示验证码：${code}` } });
});

/** POST /api/auth/logout */
router.post("/logout", (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    delete sessions[header.slice(7)];
  }
  res.json({ success: true });
});

/** GET /api/auth/me */
router.get("/me", (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: "未登录" });
    return;
  }
  res.json({ success: true, data: { ...toPublic(user) } });
});

/** GET /api/auth/demo — 返回演示账号信息 */
router.get("/demo", (_req, res) => {
  res.json({
    success: true,
    data: [
      { role: "管理员", account: "admin@prompthub.ai", password: "admin123", phone: "13800000001" },
      { role: "用户", account: "aria@prompthub.ai", password: "aria123", phone: "13800000002" },
    ],
  });
});

export default router;
