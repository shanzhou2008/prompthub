import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Image as ImageIcon, Clapperboard, Terminal, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import type { ModelInfo, Paginated, Prompt, TagInfo } from "@/lib/types";
import { PromptCard } from "@/components/PromptCard";
import { GridSkeleton } from "@/components/Spinner";
import { cn, typeMeta } from "@/lib/utils";

const TYPES = [
  { key: "", label: "全部", icon: LayoutGrid },
  { key: "image", label: "生图", icon: ImageIcon },
  { key: "video", label: "生视频", icon: Clapperboard },
  { key: "task", label: "任务", icon: Terminal },
];

const SORTS = [
  { key: "latest", label: "最新" },
  { key: "trending", label: "最热" },
  { key: "rating", label: "评分" },
  { key: "random", label: "随机" },
];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const model = params.get("model") ?? "";
  const tag = params.get("tag") ?? "";
  const sort = params.get("sort") ?? "latest";
  const page = Number(params.get("page") ?? "1");

  const [data, setData] = useState<Paginated<Prompt> | null>(null);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    api.filters()
      .then(({ models, tags }) => {
        setModels(models);
        setTags(tags);
      })
      .catch((err) => console.error("加载筛选项失败:", err));
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    api
      .listPrompts({ q, type, model, tag, sort, page, pageSize: 12 })
      .then(setData)
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [q, type, model, tag, sort, page]);

  const update = (next: Record<string, string | number>) => {
    setParams((prev) => {
      const merged = new URLSearchParams(prev);
      Object.entries(next).forEach(([k, v]) => {
        if (v === "" || v === null || v === undefined) merged.delete(k);
        else merged.set(k, String(v));
      });
      if (!("page" in next)) merged.delete("page");
      return merged;
    });
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: searchInput });
  };

  const activeCount = useMemo(
    () => [type, model, tag].filter(Boolean).length,
    [type, model, tag],
  );

  return (
    <div className="container-app py-8">
      {/* 顶部标题 + 搜索 */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          探索提示词
        </h1>
        <p className="mt-1 text-sm text-mist-400">
          {data ? `共 ${data.total} 条结果` : "搜索与筛选你需要的提示词"}
        </p>
      </div>

      <form onSubmit={onSubmitSearch} className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索提示词、模型、标签…"
            className="input py-3 pl-12 pr-4"
          />
        </div>
      </form>

      {/* 类型 Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <button
                key={t.key || "all"}
                onClick={() => update({ type: t.key })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50"
                    : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-50",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* 排序 */}
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-mist-100 outline-none focus:border-neon-purple/50"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} className="bg-ink-850">
                {s.label}
              </option>
            ))}
          </select>

          {/* 移动端筛选按钮 */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-mist-300 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            筛选
            {activeCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-neon-purple px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 桌面侧栏 */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <FilterPanel
            models={models}
            tags={tags}
            type={type}
            model={model}
            tag={tag}
            onChange={update}
          />
        </aside>

        {/* 结果区 */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <GridSkeleton count={9} />
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.data.map((p, i) => (
                  <PromptCard key={p.id} prompt={p} index={i} />
                ))}
              </div>
              <Pagination
                page={data.page}
                hasMore={data.hasMore}
                total={data.total}
                pageSize={data.pageSize}
                onChange={(p) => update({ page: p })}
              />
            </>
          ) : (
            <EmptyState onReset={() => setParams(new URLSearchParams())} />
          )}
        </div>
      </div>

      {/* 移动端筛选抽屉 */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto border-l border-white/10 bg-ink-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">筛选</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              models={models}
              tags={tags}
              type={type}
              model={model}
              tag={tag}
              onChange={update}
              onAfterChange={() => setFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  models,
  tags,
  type,
  model,
  tag,
  onChange,
  onAfterChange,
}: {
  models: ModelInfo[];
  tags: TagInfo[];
  type: string;
  model: string;
  tag: string;
  onChange: (n: Record<string, string>) => void;
  onAfterChange?: () => void;
}) {
  const apply = (n: Record<string, string>) => {
    onChange(n);
    onAfterChange?.();
  };
  return (
    <div className="space-y-6">
      <FilterGroup title="模型">
        <FilterChip active={model === ""} onClick={() => apply({ model: "" })}>
          全部模型
        </FilterChip>
        {models.map((m) => (
          <FilterChip
            key={m.name}
            active={model === m.name}
            onClick={() => apply({ model: m.name })}
          >
            {m.name}
            <span className="ml-1 text-mist-500">{m.count}</span>
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="热门标签">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 18).map((t) => (
            <button
              key={t.name}
              onClick={() => apply({ tag: tag === t.name ? "" : t.name })}
              className={cn(
                "chip transition",
                tag === t.name
                  ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan"
                  : "hover:border-neon-purple/40 hover:text-mist-100",
              )}
            >
              {t.name}
              <span className="text-mist-600">{t.count}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {(type || model || tag) && (
        <button
          onClick={() => apply({ type: "", model: "", tag: "" })}
          className="btn-ghost-sm w-full"
        >
          <X className="h-3.5 w-3.5" /> 清除筛选
        </button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-mist-400">
        {title}
      </h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
        active
          ? "bg-neon-purple/15 text-mist-50"
          : "text-mist-300 hover:bg-white/[0.04] hover:text-mist-50",
      )}
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  hasMore,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  hasMore: boolean;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn-ghost-sm disabled:opacity-40"
      >
        上一页
      </button>
      <span className="px-3 text-sm text-mist-400">
        {page} / {totalPages}
      </span>
      <button
        disabled={!hasMore}
        onClick={() => onChange(page + 1)}
        className="btn-ghost-sm disabled:opacity-40"
      >
        下一页
      </button>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-ink-800/40 py-20 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-mist-400">
        <Search className="h-6 w-6" />
      </div>
      <p className="font-display text-lg font-semibold text-mist-100">未找到匹配的提示词</p>
      <p className="mt-1 text-sm text-mist-400">试试更换关键词或清除筛选条件</p>
      <button onClick={onReset} className="btn-neon mt-5">
        重置筛选
      </button>
    </div>
  );
}
