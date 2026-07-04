import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  KeyRound,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/store/useToast";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

type Tab = "password" | "sms";

const TABS: { key: Tab; label: string }[] = [
  { key: "password", label: "密码登录" },
  { key: "sms", label: "验证码登录" },
];

export default function Login() {
  const { login, loginSms } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("password");

  // 密码登录
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  // 验证码登录
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  const [loading, setLoading] = useState(false);

  // 倒计时自驱动：countdown > 0 时每秒递减，自动清理
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSendCode = async () => {
    if (!phone.trim()) {
      toast.error("请输入手机号");
      return;
    }
    setSendingCode(true);
    try {
      const res = await api.sendCode(phone.trim());
      toast.info(res.hint || "验证码已发送");
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.message || "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(account.trim(), password);
      toast.success("登录成功");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginSms(phone.trim(), code.trim());
      toast.success("登录成功");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (acc: string, pw: string) => {
    setTab("password");
    setAccount(acc);
    setPassword(pw);
  };

  return (
    <div className="container-app grid min-h-[calc(100vh-68px)] place-items-center py-12">
      <Reveal className="w-full max-w-md">
        <div className="card-glow rounded-3xl border border-white/10 bg-ink-800/60 p-8 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-neon-gradient shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold">欢迎回来</h1>
            <p className="mt-1 text-sm text-mist-400">登录以收藏、评分与投稿</p>
          </div>

          {/* Tab 切换 */}
          <div className="relative mb-5 flex gap-6 border-b border-white/10">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative pb-2.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "text-mist-50" : "text-mist-500 hover:text-mist-300"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <motion.span
                    layoutId="login-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-neon-gradient"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "password" ? (
              <motion.form
                key="password"
                onSubmit={onSubmitPassword}
                className="space-y-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                  <input
                    required
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="邮箱 / 手机号"
                    className="input py-3 pl-10"
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码"
                    className="input py-3 pl-10"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-neon w-full py-3">
                  {loading ? "登录中…" : "登录"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="sms"
                onSubmit={onSubmitSms}
                className="space-y-3"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="手机号"
                    className="input py-3 pl-10"
                  />
                </div>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="验证码"
                    inputMode="numeric"
                    className="input py-3 pl-10 pr-32"
                  />
                  <button
                    type="button"
                    onClick={onSendCode}
                    disabled={countdown > 0 || sendingCode}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-neon-cyan transition hover:border-neon-cyan/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : sendingCode ? "发送中…" : "发送验证码"}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-neon w-full py-3">
                  {loading ? "登录中…" : "登录"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* 演示账号 */}
          <div className="mt-5 rounded-xl border border-white/5 bg-ink-850/60 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-mist-300">
              <KeyRound className="h-3.5 w-3.5 text-neon-amber" /> 演示账号（点击填充）
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => useDemo("admin@prompthub.ai", "admin123")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-mist-400 transition hover:bg-white/[0.04]"
              >
                <span>管理员 · admin@prompthub.ai</span>
                <span className="font-mono text-neon-cyan">admin123</span>
              </button>
              <button
                type="button"
                onClick={() => useDemo("aria@prompthub.ai", "aria123")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-mist-400 transition hover:bg-white/[0.04]"
              >
                <span>普通用户 · aria@prompthub.ai</span>
                <span className="font-mono text-neon-cyan">aria123</span>
              </button>
              <button
                type="button"
                onClick={() => useDemo("13800000001", "admin123")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-mist-400 transition hover:bg-white/[0.04]"
              >
                <span>手机号 · 13800000001</span>
                <span className="font-mono text-neon-cyan">admin123</span>
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-mist-400">
            还没有账号？{" "}
            <Link to="/register" className="font-medium text-neon-cyan hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
