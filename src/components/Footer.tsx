import { Link } from "react-router-dom";
import { Sparkles, Github, Twitter, Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-ink-950/60">
      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-neon-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-extrabold">
              Prompt<span className="text-gradient">Hub</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist-400">
            每日自动更新的 AI 提示词聚合平台，汇聚生图、生视频与任务执行的优质提示词。
          </p>
          <div className="mt-4 flex gap-2">
            {[Github, Twitter, Rss].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-mist-300 transition hover:border-neon-purple/40 hover:text-mist-50"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="探索"
          links={[
            { label: "生图提示词", to: "/explore?type=image" },
            { label: "生视频提示词", to: "/explore?type=video" },
            { label: "任务执行提示词", to: "/explore?type=task" },
            { label: "每日精选", to: "/" },
          ]}
        />
        <FooterCol
          title="社区"
          links={[
            { label: "投稿提示词", to: "/submit" },
            { label: "个人中心", to: "/profile" },
            { label: "登录", to: "/login" },
            { label: "注册", to: "/register" },
          ]}
        />
        <FooterCol
          title="关于"
          links={[
            { label: "数据源", to: "/admin/sources" },
            { label: "管理后台", to: "/admin" },
            { label: "使用指南", to: "/" },
            { label: "隐私政策", to: "/" },
          ]}
        />
      </div>
      <div className="border-t border-white/5 py-5">
        <div className="container-app flex flex-col items-center justify-between gap-2 text-xs text-mist-500 sm:flex-row">
          <span>© {new Date().getFullYear()} PromptHub. 由社区驱动，每日更新。</span>
          <span className="font-mono">每日 03:00 自动更新 · v2.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-mist-100">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-mist-400 transition hover:text-neon-cyan"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
