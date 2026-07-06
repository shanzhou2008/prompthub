import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Heart,
  Share2,
  Star,
  Eye,
  Play,
  Sliders,
  Send,
  ExternalLink,
  CheckCircle2,
  Download,
} from "lucide-react";
import { api, getToken } from "@/lib/api";
import type { Comment, Prompt } from "@/lib/types";
import { PromptArt } from "@/components/PromptArt";
import { PromptCard } from "@/components/PromptCard";
import { RatingStars } from "@/components/RatingStars";
import { PageLoader } from "@/components/Spinner";
import { Reveal } from "@/components/Reveal";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/store/useToast";
import {
  cn,
  formatCount,
  sourceMeta,
  timeAgo,
  typeMeta,
} from "@/lib/utils";

type Lang = "zh" | "en";

export default function PromptDetail() {
  const { id } = useParams();
  const { user, favoriteIds, setFavorite } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [related, setRelated] = useState<Prompt[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [yourScore, setYourScore] = useState(0);
  const [lang, setLang] = useState<Lang>("zh");

  // 快捷键引用：C 复制 / F 收藏 / Esc 关闭弹窗
  const actionsRef = useRef<{ copy: () => void; fav: () => void } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([api.prompt(id), api.related(id), api.comments(id)])
      .then(([p, r, c]) => {
        if (p.status === "fulfilled") setPrompt(p.value);
        else setPrompt(null);
        if (r.status === "fulfilled") setRelated(r.value);
        if (c.status === "fulfilled") setComments(c.value);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDebugOpen(false);
        setExportOpen(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inField || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "c") {
        e.preventDefault();
        actionsRef.current?.copy();
      } else if (k === "f") {
        e.preventDefault();
        actionsRef.current?.fav();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return <PageLoader />;
  if (!prompt) {
    return (
      <div className="container-app grid place-items-center py-24 text-center">
        <p className="font-display text-2xl font-bold">提示词不存在</p>
        <Link to="/explore" className="btn-neon mt-5">
          返回探索
        </Link>
      </div>
    );
  }

  const favorited = favoriteIds.has(prompt.id);
  const meta = typeMeta(prompt.type);
  const src = sourceMeta(prompt.source);
  const isVideo = prompt.type === "video" && !!prompt.videoUrl;
  const displayedContent =
    lang === "zh" ? prompt.contentZh || prompt.content : prompt.contentEn || prompt.content;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      setCopied(true);
      api.recordCopy(prompt.id).catch(() => {});
      setPrompt({ ...prompt, copyCount: prompt.copyCount + 1 });
      toast.success(`已复制${lang === "zh" ? "中文" : "英文"}版本到剪贴板`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const onFav = async () => {
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

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  const onRate = async (score: number) => {
    if (!user) {
      toast.info("请先登录后再评分");
      return;
    }
    try {
      const res: any = await api.rate(prompt.id, score);
      setYourScore(score);
      setPrompt({
        ...prompt,
        ratingAvg: res.ratingAvg,
        ratingCount: res.ratingCount,
      });
      toast.success(res.updated ? "评分已更新" : "评分成功");
    } catch (e: any) {
      toast.error(e.message || "评分失败");
    }
  };

  const onComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("请先登录后再评论");
      return;
    }
    if (!commentText.trim()) return;
    try {
      const c = await api.postComment(prompt.id, commentText.trim());
      setComments([c, ...comments]);
      setCommentText("");
      toast.success("评论已发布");
    } catch (e: any) {
      toast.error(e.message || "评论失败");
    }
  };

  const onExport = async (format: "json" | "markdown") => {
    try {
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(
        `/api/user/export?ids=${encodeURIComponent(prompt.id)}&format=${format}`,
        { headers },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "导出失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prompt.id}.${format === "json" ? "json" : "md"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`已导出为 ${format === "json" ? "JSON" : "Markdown"}`);
    } catch (e: any) {
      toast.error(e.message || "导出失败");
    }
  };

  // 让快捷键监听器始终拿到最新的处理函数
  actionsRef.current = { copy: onCopy, fav: onFav };

  return (
    <div className="container-app py-6">
      <Link
        to="/explore"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-mist-400 transition hover:text-neon-cyan"
      >
        <ArrowLeft className="h-4 w-4" /> 返回探索
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* 左侧 */}
        <div>
          {/* 预览：视频类型用原生 video，其它用 PromptArt */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            {isVideo ? (
              <video
                src={prompt.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-[16/10] w-full bg-ink-950"
              />
            ) : (
              <PromptArt prompt={prompt} className="aspect-[16/10] w-full" imageSize="detail" />
            )}
            <span
              className={cn(
                "pointer-events-none absolute left-4 top-4 rounded-md bg-gradient-to-r px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white",
                meta.color,
              )}
            >
              {meta.label}
            </span>
          </div>

          {/* 提示词内容 */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-mist-300">提示词内容</h2>
              <div className="flex items-center gap-2">
                {/* 双语切换 */}
                <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                  <button
                    onClick={() => setLang("zh")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      lang === "zh"
                        ? "bg-neon-gradient text-white shadow-glow"
                        : "text-mist-400 hover:text-mist-100",
                    )}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      lang === "en"
                        ? "bg-neon-gradient text-white shadow-glow"
                        : "text-mist-400 hover:text-mist-100",
                    )}
                  >
                    English
                  </button>
                </div>

                {/* 导出 */}
                <div className="relative">
                  <button
                    onClick={() => setExportOpen((v) => !v)}
                    className="btn-ghost-sm"
                    aria-haspopup="menu"
                    aria-expanded={exportOpen}
                  >
                    <Download className="h-3.5 w-3.5" /> 导出
                  </button>
                  {exportOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setExportOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-ink-800 shadow-card">
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            onExport("json");
                          }}
                          className="block w-full px-3 py-2 text-left text-xs text-mist-200 transition hover:bg-white/5 hover:text-neon-cyan"
                        >
                          JSON 格式
                        </button>
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            onExport("markdown");
                          }}
                          className="block w-full px-3 py-2 text-left text-xs text-mist-200 transition hover:bg-white/5 hover:text-neon-cyan"
                        >
                          Markdown 格式
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 复制 */}
                <button
                  onClick={onCopy}
                  className={cn(
                    "btn-ghost-sm",
                    copied && "border-neon-lime/40 text-neon-lime",
                  )}
                  title="快捷键 C"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> 已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> 复制
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-ink-950/60 p-5 font-mono text-sm leading-relaxed text-mist-100">
              {displayedContent}
            </pre>
          </div>

          {/* 参数 */}
          {Object.keys(prompt.params).length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-mist-300">模型参数</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(prompt.params).map(([k, v]) => (
                  <span key={k} className="chip font-mono">
                    <span className="text-mist-500">{k}</span>
                    <span className="ml-1 text-neon-cyan">{String(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 评论 */}
          <div className="mt-8">
            <h2 className="mb-4 text-sm font-semibold text-mist-300">
              评论 ({comments.length})
            </h2>
            <form onSubmit={onComment} className="mb-5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "写下你的使用心得…" : "登录后即可评论"}
                rows={3}
                className="input resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button type="submit" className="btn-neon" disabled={!commentText.trim()}>
                  <Send className="h-4 w-4" /> 发表
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-mist-500">
                  还没有评论，来抢沙发吧
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/5 bg-ink-800/50 p-4"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-neon-gradient text-xs font-bold text-white">
                        {c.user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-mist-100">
                        {c.user.username}
                      </span>
                      <span className="text-xs text-mist-500">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-mist-300">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧信息栏 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
            <h1 className="font-display text-xl font-extrabold leading-tight text-mist-50 sm:text-2xl">
              {prompt.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-mist-400">
              <span className="chip">{prompt.model}</span>
              <span className="chip">{prompt.vendor}</span>
              <span className={cn("chip", src.color)}>{src.label}</span>
              {prompt.sourceUrl && (
                <a
                  href={prompt.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neon-cyan hover:underline"
                >
                  来源 <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* 统计 */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Stat icon={<Eye className="h-4 w-4" />} value={formatCount(prompt.viewCount)} label="浏览" />
              <Stat icon={<Copy className="h-4 w-4" />} value={formatCount(prompt.copyCount)} label="复制" />
              <Stat
                icon={<Star className="h-4 w-4" />}
                value={prompt.ratingAvg.toFixed(1)}
                label={`${prompt.ratingCount} 评分`}
              />
            </div>

            {/* 操作 */}
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={onCopy} className="btn-neon w-full py-3" title="快捷键 C">
                <Copy className="h-4 w-4" /> 一键复制提示词
              </button>
              <div className="flex gap-2">
                <button onClick={() => setDebugOpen(true)} className="btn-ghost flex-1 py-2.5">
                  <Sliders className="h-4 w-4" /> 在线调试
                </button>
                <button
                  onClick={onFav}
                  title="快捷键 F"
                  className={cn(
                    "btn-ghost px-4 py-2.5",
                    favorited && "border-neon-rose/40 text-neon-rose",
                  )}
                >
                  <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
                </button>
                <button onClick={onShare} className="btn-ghost px-4 py-2.5">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-center text-[11px] text-mist-500">
                快捷键：<kbd className="font-mono text-neon-cyan">C</kbd> 复制 ·{" "}
                <kbd className="font-mono text-neon-rose">F</kbd> 收藏 ·{" "}
                <kbd className="font-mono text-neon-purple">Esc</kbd> 关闭弹窗
              </p>
            </div>

            {/* 评分 */}
            <div className="mt-6 border-t border-white/5 pt-5">
              <h3 className="mb-2 text-sm font-semibold text-mist-300">为这个提示词评分</h3>
              <RatingStars value={yourScore} onChange={onRate} size={26} />
              <p className="mt-2 text-xs text-mist-500">
                {user ? "点击星星打分，可随时修改" : "登录后可评分"}
              </p>
            </div>

            {/* 标签 */}
            <div className="mt-5 border-t border-white/5 pt-5">
              <h3 className="mb-2 text-sm font-semibold text-mist-300">标签</h3>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/explore?tag=${encodeURIComponent(t)}`}
                    className="chip transition hover:border-neon-cyan/40 hover:text-neon-cyan"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            {/* 作者 */}
            {prompt.authorName && (
              <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-neon-gradient text-sm font-bold text-white">
                  {prompt.authorName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-mist-100">
                    {prompt.authorName}
                  </div>
                  <div className="text-xs text-mist-500">
                    发布于 {timeAgo(prompt.createdAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="mt-14">
          <Reveal>
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
              <span className="h-4 w-1 rounded-full bg-neon-gradient" />
              相关推荐
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <PromptCard prompt={p} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {debugOpen && (
        <DebugModal prompt={prompt} onClose={() => setDebugOpen(false)} />
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-850/60 p-3">
      <div className="mb-1 flex justify-center text-mist-400">{icon}</div>
      <div className="font-display text-lg font-bold text-mist-50">{value}</div>
      <div className="text-[11px] text-mist-500">{label}</div>
    </div>
  );
}

function DebugModal({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem("ph_debug_key") ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");

  const onRun = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ph_debug_key", apiKey);
    setRunning(true);
    setResult("");
    // 模拟调用（真实环境应代理到对应 AI 模型 API）
    await new Promise((r) => setTimeout(r, 1400));
    setResult(
      `已向 ${prompt.vendor} ${prompt.model} 提交请求。\n\n参数：\n${JSON.stringify(
        prompt.params,
        null,
        2,
      )}\n\n（演示环境不真实调用外部 API，接入密钥后将返回真实生成结果。）`,
    );
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-card">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <Play className="h-4 w-4 text-neon-cyan" /> 在线调试
          </h3>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-100">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <p className="mb-4 text-sm text-mist-400">
            使用你的 API Key 调用{" "}
            <span className="text-neon-cyan">{prompt.model}</span> 实时预览效果。Key 仅保存在你本地浏览器。
          </p>
          <form onSubmit={onRun} className="space-y-3">
            <input
              type="password"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="粘贴 API Key（sk-…）"
              className="input"
            />
            <button type="submit" disabled={running} className="btn-neon w-full">
              {running ? "调用中…" : "运行调试"}
            </button>
          </form>
          {result && (
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-ink-950/60 p-4 font-mono text-xs text-mist-300">
              {result}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
