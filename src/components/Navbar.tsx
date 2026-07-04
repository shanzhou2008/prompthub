import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Search,
  Menu,
  X,
  Upload,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Compass,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/store/useToast";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "首页", icon: Sparkles, end: true },
  { to: "/explore", label: "探索", icon: Compass },
  { to: "/submit", label: "投稿", icon: Upload },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 移动端菜单打开时锁定滚动
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const onLogout = async () => {
    await logout();
    toast.success("已退出登录");
    navigate("/");
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/5 bg-ink-900/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container-app flex h-16 items-center gap-3 lg:h-[68px]">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-neon-gradient shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Prompt<span className="text-gradient">Hub</span>
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.06] text-mist-50"
                    : "text-mist-300 hover:text-mist-50",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* 搜索（桌面） */}
        <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 lg:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索提示词、模型、标签…"
              className="input py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </form>

        {/* 右侧操作 */}
        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="btn-ghost-sm"
                  title="管理后台"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  后台
                </Link>
              )}
              <Link to="/profile" className="btn-ghost-sm" title="个人中心">
                <UserIcon className="h-3.5 w-3.5" />
                {user.username}
              </Link>
              <button onClick={onLogout} className="btn-ghost-sm" title="退出">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-ghost-sm">
                登录
              </Link>
              <Link to="/register" className="btn-neon py-2 text-xs">
                注册
              </Link>
            </div>
          )}

          {/* 移动端汉堡 */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-mist-100 md:hidden"
            aria-label="菜单"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端抽屉 */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 transform bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-y-auto p-5">
          <form onSubmit={onSearch}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索提示词、模型、标签…"
                className="input py-3 pl-10"
                autoFocus={open}
              />
            </div>
          </form>

          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.06] text-mist-50"
                      : "text-mist-300",
                  )
                }
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="my-2 h-px bg-white/5" />

          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-mist-300"
                >
                  <LayoutDashboard className="h-5 w-5" /> 管理后台
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-mist-300"
              >
                <UserIcon className="h-5 w-5" /> 个人中心（{user.username}）
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium text-neon-rose"
              >
                <LogOut className="h-5 w-5" /> 退出登录
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full py-3"
              >
                登录
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="btn-neon w-full py-3"
              >
                注册新账号
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
