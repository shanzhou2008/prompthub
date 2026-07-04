import { Link, useNavigate } from "react-router-dom";
import { Copy, Heart, Star, Eye } from "lucide-react";
import type { Prompt } from "@/lib/types";
import { PromptArt } from "./PromptArt";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/store/useToast";
import { cn, formatCount, sourceMeta, typeMeta } from "@/lib/utils";

interface Props {
  prompt: Prompt;
  index?: number;
}

export function PromptCard({ prompt, index = 0 }: Props) {
  const { user, favoriteIds, setFavorite } = useAuth();
  const navigate = useNavigate();
  const favorited = favoriteIds.has(prompt.id);
  const meta = typeMeta(prompt.type);
  const src = sourceMeta(prompt.source);

  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      api.recordCopy(prompt.id).catch(() => {});
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  const onFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("请先登录后再收藏");
      return;
    }
    try {
      const { favorited: f } = await api.toggleFavorite(prompt.id);
      setFavorite(prompt.id, f);
      toast.success(f ? "已收藏" : "已取消收藏");
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <div
      onClick={() => navigate(`/prompt/${prompt.id}`)}
      className="card-glow group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {/* 预览艺术 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <PromptArt prompt={prompt} className="h-full w-full" videoPreview />
        {/* 类型徽章 */}
        <div className="absolute left-3 top-3 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-gradient-to-r px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white",
              meta.color,
            )}
          >
            {meta.label}
          </span>
        </div>
        {/* 悬浮操作 */}
        <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onCopy}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-ink-900/70 text-mist-100 backdrop-blur transition hover:bg-neon-purple/30"
            title="复制提示词"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onFav}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-ink-900/70 backdrop-blur transition",
              favorited
                ? "text-neon-rose"
                : "text-mist-100 hover:text-neon-rose",
            )}
            title={favorited ? "取消收藏" : "收藏"}
          >
            <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-mist-400">
          <span className="font-medium text-mist-300">{prompt.model}</span>
          <span className="text-mist-600">·</span>
          <span className={src.color}>{src.label}</span>
        </div>
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-mist-50 transition-colors group-hover:text-neon-cyan">
          {prompt.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 font-mono text-xs leading-relaxed text-mist-400">
          {prompt.content}
        </p>

        {/* 标签 */}
        <div className="mt-3 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 3).map((t) => (
            <Link
              key={t}
              to={`/explore?tag=${encodeURIComponent(t)}`}
              onClick={(e) => e.stopPropagation()}
              className="chip transition hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:text-neon-cyan"
            >
              {t}
            </Link>
          ))}
        </div>

        {/* 统计 */}
        <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3 text-[11px] text-mist-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(prompt.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            {formatCount(prompt.copyCount)}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-neon-amber" />
            {prompt.ratingAvg.toFixed(1)}
            <span className="text-mist-600">({prompt.ratingCount})</span>
          </span>
        </div>
      </div>
    </div>
  );
}
