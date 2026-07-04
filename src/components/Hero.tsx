import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Sparkles, ArrowRight, Zap } from "lucide-react";
import type { Stats } from "@/lib/types";
import { formatCount } from "@/lib/utils";

const SUGGESTIONS = ["赛博朋克", "Midjourney", "Sora", "代码审查", "水墨武侠", "PRD"];

export function Hero({ stats }: { stats: Stats | null }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* 背景层 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-neon-purple/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-neon-cyan/15 blur-[100px]" />
        {/* 浮动粒子 */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-neon-cyan"
            style={{ left: p.x, top: p.y }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: p.d, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      <div className="container-app flex flex-col items-center pb-10 pt-14 text-center sm:pt-20 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-mist-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-lime opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-lime" />
          </span>
          每日 03:00 自动更新 · 今日新增{" "}
          <span className="font-semibold text-neon-cyan">
            {stats ? stats.last7Days : "—"}
          </span>{" "}
          条
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl"
        >
          发现最棒的
          <br className="hidden sm:block" />
          <span className="text-gradient"> AI 提示词</span>
          <span className="inline-block animate-float"> ✦</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-5 max-w-2xl text-balance text-base text-mist-300 sm:text-lg"
        >
          聚合生图、生视频与任务执行的优质提示词，精选收录自公开社区与官方渠道，
          <span className="text-mist-100">每日更新，开箱即用。</span>
        </motion.p>

        {/* 搜索框 */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-ink-800/80 p-2 shadow-glow backdrop-blur-xl"
        >
          <Search className="ml-2 h-5 w-5 shrink-0 text-mist-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索提示词、模型、标签…"
            className="w-full bg-transparent px-2 py-2.5 text-sm text-mist-50 placeholder:text-mist-500 outline-none"
          />
          <button type="submit" className="btn-neon shrink-0">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">搜索</span>
          </button>
        </motion.form>

        {/* 热门建议 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-mist-500">大家在搜：</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => navigate(`/explore?q=${encodeURIComponent(s)}`)}
              className="chip transition hover:border-neon-cyan/40 hover:text-neon-cyan"
            >
              {s}
            </button>
          ))}
        </motion.div>

        {/* 统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34 }}
          className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard label="提示词总数" value={stats?.total} suffix="+" icon={<Zap className="h-4 w-4" />} />
          <StatCard label="生图" value={stats?.image} accent="text-neon-purple" />
          <StatCard label="生视频" value={stats?.video} accent="text-neon-cyan" />
          <StatCard label="数据源" value={stats?.activeSources} suffix={`/ ${stats?.sources ?? 0}`} accent="text-neon-amber" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-10"
        >
          <a
            href="#daily"
            className="group inline-flex items-center gap-2 text-sm text-mist-400 transition hover:text-neon-cyan"
          >
            浏览每日精选
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent = "text-neon-cyan",
  icon,
}: {
  label: string;
  value?: number;
  suffix?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-4 text-left">
      <div className="flex items-center gap-1.5 text-xs text-mist-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className={`font-display text-2xl font-extrabold ${accent}`}>
          {value !== undefined ? formatCount(value) : "—"}
        </span>
        {suffix && <span className="text-xs text-mist-500">{suffix}</span>}
      </div>
    </div>
  );
}

const PARTICLES = [
  { x: "12%", y: "30%", d: 6, delay: 0 },
  { x: "88%", y: "22%", d: 7, delay: 1 },
  { x: "20%", y: "70%", d: 5, delay: 0.5 },
  { x: "75%", y: "65%", d: 8, delay: 1.5 },
  { x: "50%", y: "15%", d: 6, delay: 2 },
  { x: "35%", y: "45%", d: 7, delay: 0.8 },
  { x: "65%", y: "80%", d: 5.5, delay: 2.2 },
  { x: "92%", y: "55%", d: 6.5, delay: 1.2 },
];
