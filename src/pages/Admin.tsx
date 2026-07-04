import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Database,
  ListChecks,
  Activity,
  Check,
  X,
  Star,
  Trash2,
  RefreshCw,
  Eye,
  Copy,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/store/useToast";
import { PageLoader, Spinner } from "@/components/Spinner";
import { cn, formatCount, timeAgo, typeMeta } from "@/lib/utils";
import type { DataSource, JobLog, Prompt, Submission } from "@/lib/types";

type Tab = "dashboard" | "review" | "prompts" | "sources" | "jobs";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "dashboard", label: "数据看板", icon: LayoutDashboard },
  { key: "review", label: "投稿审核", icon: ClipboardCheck },
  { key: "prompts", label: "提示词管理", icon: ListChecks },
  { key: "sources", label: "数据源", icon: Database },
  { key: "jobs", label: "任务日志", icon: Activity },
];

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">管理后台</h1>
        <p className="mt-1 text-sm text-mist-400">管理提示词、审核投稿与监控每日抓取任务</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
              tab === t.key
                ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50"
                : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-50",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "review" && <Review />}
      {tab === "prompts" && <PromptsManage />}
      {tab === "sources" && <Sources />}
      {tab === "jobs" && <Jobs />}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api.adminStats().then(setData);
  }, []);
  if (!data) return <PageLoader />;
  const cards = [
    { label: "提示词总数", value: data.total, icon: ListChecks, color: "text-neon-purple" },
    { label: "待审核投稿", value: data.pendingSubmissions, icon: ClipboardCheck, color: "text-neon-amber" },
    { label: "总浏览量", value: data.totalViews, icon: Eye, color: "text-neon-cyan" },
    { label: "总复制量", value: data.totalCopies, icon: Copy, color: "text-neon-lime" },
  ];
  const maxType = Math.max(1, ...Object.values(data.byType) as number[]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-ink-800/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-mist-400">{c.label}</span>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <div className="font-display text-2xl font-extrabold text-mist-50">
              {formatCount(c.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp className="h-4 w-4 text-neon-cyan" /> 分类分布
          </h3>
          <div className="space-y-3">
            {(["image", "video", "task"] as const).map((t) => {
              const v = data.byType[t] ?? 0;
              const meta = typeMeta(t);
              return (
                <div key={t}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-mist-300">{meta.label}</span>
                    <span className="text-mist-400">{v}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", meta.color)}
                      style={{ width: `${(v / maxType) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <ListChecks className="h-4 w-4 text-neon-purple" /> 最近入库
          </h3>
          <div className="space-y-2">
            {data.recent.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-mist-200">{r.title}</span>
                <span className="ml-2 shrink-0 text-xs text-mist-500">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Review() {
  const [list, setList] = useState<Submission[] | null>(null);
  const load = () => api.reviewQueue().then(setList);
  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    try {
      await api.review(id, action);
      toast.success(action === "approve" ? "已通过并发布" : "已拒绝");
      load();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  };

  if (!list) return <PageLoader />;
  const pending = list.filter((s) => s.status === "pending");
  return (
    <div className="space-y-3">
      <p className="text-sm text-mist-400">待审核：{pending.length} 条</p>
      {pending.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <Check className="mb-2 h-8 w-8 text-neon-lime" />
          <p className="text-mist-300">审核队列已清空</p>
        </div>
      ) : (
        pending.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-ink-800/60 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-mist-400">
              <span className="chip">{typeMeta(s.payload.type).label}</span>
              <span className="chip">{s.payload.model}</span>
              <span>提交于 {timeAgo(s.createdAt)}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-mist-50">
              {s.payload.title}
            </h3>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-ink-950/60 p-3 font-mono text-xs text-mist-300">
              {s.payload.content}
            </pre>
            {s.payload.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.payload.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => act(s.id, "reject")} className="btn-ghost-sm text-neon-rose">
                <X className="h-3.5 w-3.5" /> 拒绝
              </button>
              <button onClick={() => act(s.id, "approve")} className="btn-neon py-2">
                <Check className="h-4 w-4" /> 通过并发布
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PromptsManage() {
  const [list, setList] = useState<Prompt[] | null>(null);
  const load = () => api.adminPrompts().then(setList);
  useEffect(() => {
    load();
  }, []);

  const toggleFeatured = async (p: Prompt) => {
    try {
      await api.toggleFeatured(p.id, !p.isFeatured);
      toast.success(p.isFeatured ? "已取消精选" : "已设为精选");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const remove = async (p: Prompt) => {
    if (!confirm(`确认删除「${p.title}」？`)) return;
    try {
      await api.deletePrompt(p.id);
      toast.success("已删除");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!list) return <PageLoader />;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-850/60 text-left text-xs uppercase text-mist-400">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">浏览</th>
              <th className="px-4 py-3">复制</th>
              <th className="px-4 py-3">评分</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="max-w-[200px] truncate text-mist-100">{p.title}</span>
                    {p.isFeatured && <Star className="h-3.5 w-3.5 fill-neon-amber text-neon-amber" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-mist-400">{typeMeta(p.type).label}</td>
                <td className="px-4 py-3 text-mist-400">{formatCount(p.viewCount)}</td>
                <td className="px-4 py-3 text-mist-400">{formatCount(p.copyCount)}</td>
                <td className="px-4 py-3 text-mist-400">{p.ratingAvg.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => toggleFeatured(p)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg border border-white/10",
                        p.isFeatured ? "text-neon-amber" : "text-mist-400 hover:text-neon-amber",
                      )}
                      title="切换精选"
                    >
                      <Star className={cn("h-3.5 w-3.5", p.isFeatured && "fill-current")} />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 hover:text-neon-rose"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sources() {
  const [list, setList] = useState<DataSource[] | null>(null);
  const load = () => api.adminSources().then(setList);
  useEffect(() => {
    load();
  }, []);

  const toggle = async (s: DataSource) => {
    try {
      await api.toggleSource(s.id, !s.enabled);
      toast.success(s.enabled ? "已停用" : "已启用");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!list) return <PageLoader />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((s) => (
        <div key={s.id} className="rounded-2xl border border-white/10 bg-ink-800/60 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-mist-100">{s.name}</h3>
              <p className="mt-0.5 text-xs text-mist-400">{s.url}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                s.type === "official"
                  ? "bg-neon-lime/15 text-neon-lime"
                  : s.type === "community"
                    ? "bg-neon-cyan/15 text-neon-cyan"
                    : "bg-neon-amber/15 text-neon-amber",
              )}
            >
              {s.type}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-mist-500">调度</div>
              <div className="font-mono text-mist-300">{s.schedule}</div>
            </div>
            <div>
              <div className="text-mist-500">已入库</div>
              <div className="font-mono text-mist-300">{s.itemsAdded}</div>
            </div>
            <div>
              <div className="text-mist-500">状态</div>
              <div
                className={cn(
                  "font-mono",
                  s.lastStatus === "success" ? "text-neon-lime" : "text-neon-rose",
                )}
              >
                {s.lastStatus ?? "—"}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-mist-500">
              {s.lastRunAt ? `上次运行 ${timeAgo(s.lastRunAt)}` : "未运行"}
            </span>
            <button
              onClick={() => toggle(s)}
              className={cn(
                "relative h-6 w-11 rounded-full transition",
                s.enabled ? "bg-neon-purple" : "bg-ink-600",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                  s.enabled ? "left-5" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Jobs() {
  const [list, setList] = useState<JobLog[] | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const load = () => api.adminJobs().then(setList);
  useEffect(() => {
    load();
  }, []);

  const trigger = async (s: DataSource | { id: string; name?: string }) => {
    setTriggering(s.id);
    try {
      await api.triggerJob(s.id);
      toast.success("已手动触发抓取");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTriggering(null);
    }
  };

  if (!list) return <PageLoader />;
  return (
    <div className="space-y-3">
      {list.map((j) => (
        <div
          key={j.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-ink-800/50 p-4"
        >
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg",
              j.status === "success"
                ? "bg-neon-lime/15 text-neon-lime"
                : j.status === "failed"
                  ? "bg-neon-rose/15 text-neon-rose"
                  : "bg-neon-cyan/15 text-neon-cyan",
            )}
          >
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-mist-100">{j.sourceName}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  j.status === "success"
                    ? "bg-neon-lime/15 text-neon-lime"
                    : "bg-neon-rose/15 text-neon-rose",
                )}
              >
                {j.status}
              </span>
            </div>
            <div className="text-xs text-mist-500">
              抓取 {j.itemsFetched} 条 · 入库 {j.itemsAdded} 条 · {timeAgo(j.startedAt)}
              {j.error && ` · ${j.error}`}
            </div>
          </div>
          <button
            onClick={() => trigger({ id: j.sourceId, name: j.sourceName })}
            disabled={triggering === j.sourceId}
            className="btn-ghost-sm"
          >
            {triggering === j.sourceId ? (
              <Spinner className="text-xs" />
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" /> 重跑
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
