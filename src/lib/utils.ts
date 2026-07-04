import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 数字格式化：1.2k / 23.5k / 1.2M */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1) + "M";
}

/** 相对时间 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "刚刚";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}

/** 日期 YYYY-MM-DD */
export function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  image: { label: "生图", icon: "Image", color: "from-neon-purple to-neon-blue" },
  video: { label: "生视频", icon: "Clapperboard", color: "from-neon-cyan to-neon-blue" },
  task: { label: "任务", icon: "Terminal", color: "from-neon-amber to-neon-rose" },
};

export function typeMeta(t: string) {
  return TYPE_META[t] ?? TYPE_META.task;
}

const SOURCE_META: Record<string, { label: string; color: string }> = {
  crawled: { label: "精选收录", color: "text-neon-cyan" },
  submitted: { label: "社区分享", color: "text-neon-amber" },
  official: { label: "官方示例", color: "text-neon-lime" },
};

export function sourceMeta(s: string) {
  return SOURCE_META[s] ?? { label: s, color: "text-mist-300" };
}
