import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  Clapperboard,
  Terminal,
  ArrowUpRight,
  Mail,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Prompt, Stats } from "@/lib/types";
import { Hero } from "@/components/Hero";
import { PromptCard } from "@/components/PromptCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Reveal } from "@/components/Reveal";
import { GridSkeleton } from "@/components/Spinner";
import { toast } from "@/store/useToast";
import { cn, formatCount, typeMeta } from "@/lib/utils";

const CATEGORIES = [
  {
    type: "image" as const,
    title: "生图提示词",
    desc: "Midjourney · Flux · DALL·E · SD",
    icon: ImageIcon,
    gradient: "from-neon-purple/30 to-neon-blue/10",
    accent: "text-neon-purple",
  },
  {
    type: "video" as const,
    title: "生视频提示词",
    desc: "Sora · Runway · 可灵 · 即梦",
    icon: Clapperboard,
    gradient: "from-neon-cyan/30 to-neon-blue/10",
    accent: "text-neon-cyan",
  },
  {
    type: "task" as const,
    title: "任务执行提示词",
    desc: "GPT · Claude · Gemini",
    icon: Terminal,
    gradient: "from-neon-amber/30 to-neon-rose/10",
    accent: "text-neon-amber",
  },
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<Prompt[]>([]);
  const [latest, setLatest] = useState<Prompt[]>([]);
  const [trending, setTrending] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    Promise.allSettled([api.stats(), api.daily(), api.latest(), api.trending()])
      .then(([s, d, l, t]) => {
        if (s.status === "fulfilled") setStats(s.value);
        if (d.status === "fulfilled") setDaily(d.value);
        if (l.status === "fulfilled") setLatest(l.value);
        if (t.status === "fulfilled") setTrending(t.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.subscribe(email);
      toast.success("订阅成功！每日精选将送达你的邮箱");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "订阅失败");
    }
  };

  return (
    <>
      <Hero stats={stats} />

      {/* 每日精选 */}
      <section id="daily" className="container-app scroll-mt-24 py-12">
        <Reveal>
          <SectionHeader
            title="每日精选"
            subtitle="编辑团队与算法共同挑选的当日最佳提示词"
            moreTo="/explore?sort=rating"
          />
        </Reveal>

        {loading ? (
          <GridSkeleton count={4} />
        ) : (
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar lg:mx-0 lg:px-0">
            {daily.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05} className="shrink-0">
                <FeaturedCard prompt={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 分类导航 */}
      <section className="container-app py-12">
        <Reveal>
          <SectionHeader title="按类型探索" subtitle="找到适合你工作流的那一类提示词" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.type} delay={i * 0.08}>
              <Link
                to={`/explore?type=${c.type}`}
                className={cn(
                  "card-glow group relative block overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br p-6 transition-all hover:-translate-y-1",
                  c.gradient,
                )}
              >
                <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
                <div className="relative">
                  <div
                    className={cn(
                      "mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-ink-900/50",
                      c.accent,
                    )}
                  >
                    <c.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-mist-50">{c.title}</h3>
                  <p className="mt-1 text-sm text-mist-300">{c.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-mist-400 transition group-hover:text-neon-cyan">
                    立即探索
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 最新更新 */}
      <section className="container-app py-12">
        <Reveal>
          <SectionHeader
            title="最新更新"
            subtitle="精选收录与社区分享的最新提示词"
            moreTo="/explore?sort=latest"
          />
        </Reveal>
        {loading ? (
          <GridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latest.slice(0, 8).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.05}>
                <PromptCard prompt={p} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 热门趋势 */}
      <section className="container-app py-12">
        <Reveal>
          <SectionHeader
            title="热门趋势"
            subtitle="按浏览量与复制量综合排序"
            moreTo="/explore?sort=trending"
          />
        </Reveal>
        {loading ? (
          <GridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <TrendingCard prompt={p} rank={i + 1} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 订阅 */}
      <section className="container-app py-16">
        <Reveal>
          <div className="card-glow relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800/60 p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-neon-purple/20 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-neon-cyan/15 blur-[100px]" />
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neon-cyan">
                  <Mail className="h-3.5 w-3.5" /> 每日精选邮件
                </div>
                <h2 className="text-balance font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  让最好的提示词，<span className="text-gradient">每天主动找上门</span>
                </h2>
                <p className="mt-3 max-w-md text-sm text-mist-300">
                  订阅后每日清晨收到当日精选合集，按你的偏好筛选，绝不打扰。
                </p>
              </div>
              <form onSubmit={onSubscribe} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input flex-1"
                />
                <button type="submit" className="btn-neon shrink-0">
                  <Mail className="h-4 w-4" />
                  订阅
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** 每日精选横向卡片 */
function FeaturedCard({ prompt }: { prompt: Prompt }) {
  const meta = typeMeta(prompt.type);
  return (
    <Link
      to={`/prompt/${prompt.id}`}
      className="card-glow flex w-[300px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60 transition-all hover:-translate-y-1 sm:w-[340px]"
    >
      <div className="relative aspect-[16/9] w-full bg-ink-900">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(40% 50% at 20% 25%, hsl(${prompt.hue} 90% 62%), transparent 60%),
              radial-gradient(45% 55% at 80% 30%, hsl(${(prompt.hue + 40) % 360} 88% 58%), transparent 65%),
              radial-gradient(50% 60% at 60% 85%, hsl(${(prompt.hue + 180) % 360} 85% 55%), transparent 60%)`,
          }}
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
            meta.color,
          )}
        >
          {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[11px] text-mist-400">{prompt.model}</div>
        <h3 className="line-clamp-1 font-display text-base font-semibold text-mist-50">
          {prompt.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 font-mono text-xs text-mist-400">
          {prompt.content}
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-mist-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {formatCount(prompt.viewCount)}
          </span>
          <span>★ {prompt.ratingAvg.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}

/** 热门卡片（带排名） */
function TrendingCard({ prompt, rank }: { prompt: Prompt; rank: number }) {
  return (
    <div className="relative">
      <span className="absolute -left-2 -top-3 z-10 font-display text-5xl font-extrabold text-white/5">
        {rank}
      </span>
      <PromptCard prompt={prompt} />
    </div>
  );
}
