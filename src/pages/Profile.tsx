import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BookMarked,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  FolderKanban,
  GitCompare,
  History,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/store/useToast";
import { PageLoader, Spinner } from "@/components/Spinner";
import { PromptCard } from "@/components/PromptCard";
import type { Collection, CopyHistory, Project, Prompt, Visibility } from "@/lib/types";
import { cn, timeAgo, typeMeta } from "@/lib/utils";

type Tab = "prompts" | "projects" | "collections" | "history" | "compare";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "prompts", label: "我的提示词", icon: FileText },
  { key: "projects", label: "项目管理", icon: FolderKanban },
  { key: "collections", label: "收藏夹", icon: BookMarked },
  { key: "history", label: "复制历史", icon: History },
  { key: "compare", label: "提示词对比", icon: GitCompare },
];

const VISIBILITY_META: Record<Visibility, { label: string; cls: string }> = {
  public: { label: "公开", cls: "bg-neon-lime/15 text-neon-lime border-neon-lime/30" },
  private: { label: "私有", cls: "bg-neon-rose/15 text-neon-rose border-neon-rose/30" },
  link: { label: "仅链接", cls: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30" },
};

const PROJECT_COLORS = [
  "#7C5CFF", "#00E5FF", "#FFB547", "#FF3D71", "#7DFFA8",
  "#3B82F6", "#9D7BFF", "#FF8A65", "#34D399", "#F472B6",
];

const VIS_OPTIONS: Visibility[] = ["public", "private", "link"];

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("prompts");

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const onLogout = async () => {
    await logout();
    toast.success("已退出登录");
    navigate("/");
  };

  return (
    <div className="container-app py-8">
      {/* 用户卡片 */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-800/60 p-5">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-gradient text-xl font-bold text-white shadow-glow">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-xl font-bold">{user.username}</h1>
            {user.role === "admin" && (
              <span className="rounded-md bg-neon-purple/20 px-2 py-0.5 text-[10px] font-bold uppercase text-neon-purple">
                管理员
              </span>
            )}
          </div>
          <p className="truncate text-sm text-mist-400">{user.email}</p>
        </div>
        <button onClick={onLogout} className="btn-ghost-sm text-neon-rose">
          <LogOut className="h-3.5 w-3.5" /> 退出
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* 侧栏：移动端横向滚动，桌面端纵向 */}
        <aside className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition lg:shrink",
                tab === t.key
                  ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50"
                  : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-50",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </aside>

        <div className="min-w-0">
          {tab === "prompts" && <MyPromptsTab />}
          {tab === "projects" && <ProjectsTab />}
          {tab === "collections" && <CollectionsTab />}
          {tab === "history" && <HistoryTab />}
          {tab === "compare" && <CompareTab />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 我的提示词                                                          */
/* ------------------------------------------------------------------ */

function MyPromptsTab() {
  const [projects, setProjects] = useState<(Project & { promptCount: number })[] | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [list, setList] = useState<Prompt[] | null>(null);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [creating, setCreating] = useState(false);

  const reloadPrompts = () => {
    setList(null);
    api
      .myPrompts(filter)
      .then(setList)
      .catch(() => setList([]));
  };

  useEffect(() => {
    api.projects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    reloadPrompts();
  }, [filter]);

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    projects?.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const onDelete = async (p: Prompt) => {
    if (!confirm(`确认删除「${p.title}」？此操作不可恢复。`)) return;
    try {
      await api.deleteMyPrompt(p.id);
      toast.success("已删除");
      setList((l) => (l ? l.filter((x) => x.id !== p.id) : l));
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">我的提示词</h2>
        <button onClick={() => setCreating(true)} className="btn-neon py-2">
          <Plus className="h-4 w-4" /> 新建提示词
        </button>
      </div>

      {/* 项目筛选 */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!filter} onClick={() => setFilter(undefined)} label="全部" />
        {projects?.map((p) => (
          <FilterChip
            key={p.id}
            active={filter === p.id}
            onClick={() => setFilter(p.id)}
            label={p.name}
            dot={p.color}
            count={p.promptCount}
          />
        ))}
      </div>

      {!list ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <EmptyHint
          icon={<FileText className="h-6 w-6" />}
          title="还没有提示词"
          desc="新建你的第一个提示词，或按项目筛选查看"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <MyPromptItem
              key={p.id}
              prompt={p}
              projectName={p.projectId ? projectMap.get(p.projectId)?.name : undefined}
              onEdit={() => setEditing(p)}
              onDelete={() => onDelete(p)}
            />
          ))}
        </div>
      )}

      {(editing || creating) && (
        <PromptEditModal
          prompt={editing}
          projects={projects ?? []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            reloadPrompts();
          }}
        />
      )}
    </div>
  );
}

function MyPromptItem({
  prompt,
  projectName,
  onEdit,
  onDelete,
}: {
  prompt: Prompt;
  projectName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const vis = VISIBILITY_META[prompt.visibility];
  return (
    <div className="card-glow group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase", vis.cls)}>
          {vis.label}
        </span>
        {projectName && <span className="chip truncate">{projectName}</span>}
      </div>
      <Link to={`/prompt/${prompt.id}`} className="block">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-mist-50 transition-colors group-hover:text-neon-cyan">
          {prompt.title}
        </h3>
      </Link>
      <p className="mt-1.5 line-clamp-3 flex-1 font-mono text-xs leading-relaxed text-mist-400">
        {prompt.content}
      </p>
      {prompt.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-mist-400">
          <span className="font-medium text-mist-300">{prompt.model || "—"}</span>
          <span className="text-mist-600">·</span>
          <span>{timeAgo(prompt.createdAt)}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-neon-cyan"
            title="编辑"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-neon-rose"
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptEditModal({
  prompt,
  projects,
  onClose,
  onSaved,
}: {
  prompt: Prompt | null;
  projects: (Project & { promptCount: number })[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!prompt;
  const [form, setForm] = useState({
    title: prompt?.title ?? "",
    model: prompt?.model ?? "",
    type: prompt?.type ?? "task",
    visibility: (prompt?.visibility ?? "private") as Visibility,
    projectId: prompt?.projectId ?? "",
    tags: (prompt?.tags ?? []).join(", "),
    content: prompt?.content ?? "",
    contentEn: prompt?.contentEn ?? "",
    contentZh: prompt?.contentZh ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("请输入标题");
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      model: form.model.trim(),
      type: form.type,
      visibility: form.visibility,
      projectId: form.projectId || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      content: form.content,
      contentEn: form.contentEn,
      contentZh: form.contentZh,
    };
    try {
      if (isEdit && prompt) await api.updateMyPrompt(prompt.id, body);
      else await api.createMyPrompt(body);
      toast.success(isEdit ? "已更新" : "已创建");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "编辑提示词" : "新建提示词"}>
      <div className="space-y-3">
        <Field label="标题">
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="给提示词起个名字"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="模型">
            <input
              className="input"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="如 GPT-4o"
            />
          </Field>
          <Field label="类型">
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Prompt["type"] })}
            >
              <option value="image">生图</option>
              <option value="video">生视频</option>
              <option value="task">任务</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="可见性">
            <div className="flex gap-1.5">
              {VIS_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, visibility: v })}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                    form.visibility === v
                      ? VISIBILITY_META[v].cls
                      : "border-white/10 text-mist-400 hover:text-mist-200",
                  )}
                >
                  {VISIBILITY_META[v].label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="所属项目">
            <select
              className="input"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">无</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="标签（逗号分隔）">
          <input
            className="input"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="摄影, 人像, 电影感"
          />
        </Field>
        <Field label="提示词内容（通用）">
          <textarea
            className="input min-h-[70px] font-mono"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </Field>
        <Field label="英文版本">
          <textarea
            className="input min-h-[70px] font-mono"
            value={form.contentEn}
            onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
          />
        </Field>
        <Field label="中文版本">
          <textarea
            className="input min-h-[70px] font-mono"
            value={form.contentZh}
            onChange={(e) => setForm({ ...form, contentZh: e.target.value })}
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost-sm">
          取消
        </button>
        <button onClick={submit} disabled={saving} className="btn-neon py-2">
          {saving ? <Spinner className="text-xs" /> : <Check className="h-4 w-4" />}{" "}
          {isEdit ? "保存" : "创建"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 项目管理                                                            */
/* ------------------------------------------------------------------ */

function ProjectsTab() {
  const [list, setList] = useState<(Project & { promptCount: number })[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<(Project & { promptCount: number }) | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.projects().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);

  if (selectedId) {
    const proj = list?.find((p) => p.id === selectedId);
    return (
      <ProjectPromptsView
        projectId={selectedId}
        projectName={proj?.name}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const onDelete = async (p: Project) => {
    if (!confirm(`确认删除项目「${p.name}」？项目下的提示词不会被删除。`)) return;
    try {
      await api.deleteProject(p.id);
      toast.success("已删除");
      load();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">项目管理</h2>
        <button onClick={() => setCreating(true)} className="btn-neon py-2">
          <Plus className="h-4 w-4" /> 新建项目
        </button>
      </div>

      {!list ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <EmptyHint
          icon={<FolderKanban className="h-6 w-6" />}
          title="还没有项目"
          desc="创建项目来分组管理你的提示词"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="card-glow group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              style={{ borderLeftWidth: 3, borderLeftColor: p.color || "#7C5CFF" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: p.color || "#7C5CFF" }}
                  />
                  <span className="text-[10px] font-bold uppercase text-mist-500">
                    {VISIBILITY_META[p.visibility].label}
                  </span>
                </div>
                <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-mist-300">
                  {p.promptCount} 个提示词
                </span>
              </div>
              <h3 className="font-display text-base font-semibold text-mist-50">{p.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-mist-400">
                {p.description || "暂无描述"}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] text-mist-500">{timeAgo(p.createdAt)}创建</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className="btn-ghost-sm"
                    title="查看提示词"
                  >
                    进入
                  </button>
                  <button
                    onClick={() => setEditing(p)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-neon-cyan"
                    title="编辑"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-neon-rose"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProjectModal
          project={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: (Project & { promptCount: number }) | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    color: project?.color ?? PROJECT_COLORS[0],
    visibility: (project?.visibility ?? "private") as Visibility,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("请输入项目名称");
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      visibility: form.visibility,
    };
    try {
      if (isEdit && project) await api.updateProject(project.id, body);
      else await api.createProject(body);
      toast.success(isEdit ? "已更新" : "已创建");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "编辑项目" : "新建项目"}>
      <div className="space-y-3">
        <Field label="项目名称">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如 封面插画集"
          />
        </Field>
        <Field label="描述">
          <textarea
            className="input min-h-[70px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="简单描述这个项目的用途"
          />
        </Field>
        <Field label="颜色">
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                className={cn(
                  "h-8 w-8 rounded-lg border-2 transition",
                  form.color === c ? "border-white" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>
        <Field label="可见性">
          <div className="flex gap-1.5">
            {VIS_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => setForm({ ...form, visibility: v })}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                  form.visibility === v
                    ? VISIBILITY_META[v].cls
                    : "border-white/10 text-mist-400 hover:text-mist-200",
                )}
              >
                {VISIBILITY_META[v].label}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost-sm">
          取消
        </button>
        <button onClick={submit} disabled={saving} className="btn-neon py-2">
          {saving ? <Spinner className="text-xs" /> : <Check className="h-4 w-4" />}{" "}
          {isEdit ? "保存" : "创建"}
        </button>
      </div>
    </Modal>
  );
}

function ProjectPromptsView({
  projectId,
  projectName,
  onBack,
}: {
  projectId: string;
  projectName?: string;
  onBack: () => void;
}) {
  const [list, setList] = useState<Prompt[] | null>(null);
  useEffect(() => {
    setList(null);
    api
      .myPrompts(projectId)
      .then(setList)
      .catch(() => setList([]));
  }, [projectId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost-sm">
          <ChevronLeft className="h-3.5 w-3.5" /> 返回项目列表
        </button>
        <h2 className="font-display text-lg font-bold">
          {projectName ?? "项目"} · 提示词
        </h2>
      </div>
      {!list ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <EmptyHint
          icon={<FileText className="h-6 w-6" />}
          title="该项目下还没有提示词"
          desc="在「我的提示词」中新建或调整提示词所属项目"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <PromptCard key={p.id} prompt={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 收藏夹                                                              */
/* ------------------------------------------------------------------ */

function CollectionsTab() {
  const { favoriteIds } = useAuth();
  const [list, setList] = useState<(Collection & { count: number })[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.collections().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);

  if (selectedId) {
    const col = list?.find((c) => c.id === selectedId);
    return (
      <CollectionPromptsView
        collectionId={selectedId}
        collectionName={selectedId === "all" ? "全部收藏" : col?.name}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const onDelete = async (c: Collection) => {
    if (!confirm(`确认删除收藏夹「${c.name}」？其中的收藏不会被取消。`)) return;
    try {
      await api.deleteCollection(c.id);
      toast.success("已删除");
      load();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const totalCount = favoriteIds.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">收藏夹</h2>
        <button onClick={() => setCreating(true)} className="btn-neon py-2">
          <Plus className="h-4 w-4" /> 新建收藏夹
        </button>
      </div>

      {!list ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {/* 全部收藏 */}
          <button
            onClick={() => setSelectedId("all")}
            className="card-glow group flex items-center gap-3 rounded-2xl border border-white/5 bg-ink-800/60 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-gradient/20 text-neon-purple">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold text-mist-50">全部收藏</div>
              <div className="text-xs text-mist-400">{totalCount} 个提示词</div>
            </div>
          </button>

          {list.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyHint
                icon={<BookMarked className="h-6 w-6" />}
                title="还没有收藏夹分组"
                desc="创建分组来整理你的收藏"
              />
            </div>
          )}

          {list.map((c) => (
            <div
              key={c.id}
              className="card-glow group relative flex items-center gap-3 rounded-2xl border border-white/5 bg-ink-800/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <button
                onClick={() => setSelectedId(c.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-neon-cyan">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold text-mist-50 group-hover:text-neon-cyan">
                    {c.name}
                  </div>
                  <div className="text-xs text-mist-400">{c.count} 个提示词</div>
                </div>
              </button>
              <button
                onClick={() => onDelete(c)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-neon-rose"
                title="删除收藏夹"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CollectionModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CollectionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("请输入收藏夹名称");
      return;
    }
    setSaving(true);
    try {
      await api.createCollection(name.trim());
      toast.success("已创建");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "创建失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="新建收藏夹">
      <Field label="收藏夹名称">
        <input
          className="input"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          placeholder="如 灵感库、待办素材"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost-sm">
          取消
        </button>
        <button onClick={submit} disabled={saving} className="btn-neon py-2">
          {saving ? <Spinner className="text-xs" /> : <Check className="h-4 w-4" />} 创建
        </button>
      </div>
    </Modal>
  );
}

function CollectionPromptsView({
  collectionId,
  collectionName,
  onBack,
}: {
  collectionId: string;
  collectionName?: string;
  onBack: () => void;
}) {
  const [list, setList] = useState<Prompt[] | null>(null);
  useEffect(() => {
    setList(null);
    const req = collectionId === "all" ? api.favorites() : api.favorites(collectionId);
    req.then(setList).catch(() => setList([]));
  }, [collectionId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost-sm">
          <ChevronLeft className="h-3.5 w-3.5" /> 返回收藏夹
        </button>
        <h2 className="font-display text-lg font-bold">{collectionName ?? "收藏夹"}</h2>
      </div>
      {!list ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <EmptyHint
          icon={<BookMarked className="h-6 w-6" />}
          title="这里还没有收藏"
          desc="浏览提示词时点击爱心，收藏到这里"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <PromptCard key={p.id} prompt={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 复制历史                                                            */
/* ------------------------------------------------------------------ */

function HistoryTab() {
  const [list, setList] = useState<CopyHistory[] | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = () => api.myHistory().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);

  const onClear = async () => {
    if (!confirm("确认清空所有复制历史？此操作不可恢复。")) return;
    setClearing(true);
    try {
      await api.clearHistory();
      toast.success("已清空");
      setList([]);
    } catch (e: any) {
      toast.error(e.message || "清空失败");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">复制历史</h2>
        {list && list.length > 0 && (
          <button
            onClick={onClear}
            disabled={clearing}
            className="btn-ghost-sm text-neon-rose"
          >
            {clearing ? <Spinner className="text-xs" /> : <Trash2 className="h-3.5 w-3.5" />}{" "}
            清空历史
          </button>
        )}
      </div>

      {!list ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <EmptyHint
          icon={<History className="h-6 w-6" />}
          title="暂无复制历史"
          desc="复制提示词后会在这里记录"
        />
      ) : (
        <div className="space-y-2">
          {list.map((h) => {
            const meta = typeMeta(h.promptType);
            return (
              <Link
                key={h.id}
                to={`/prompt/${h.promptId}`}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-800/50 p-3 transition hover:bg-white/[0.03]"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon-cyan/15 text-neon-cyan">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-mist-100">
                    {h.promptTitle}
                  </div>
                  <div className="text-xs text-mist-500">
                    {meta.label} · {timeAgo(h.copiedAt)}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-mist-600">查看</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 提示词对比                                                          */
/* ------------------------------------------------------------------ */

function CompareTab() {
  const [all, setAll] = useState<Prompt[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Prompt[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.myPrompts().then(setAll).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    const base = q
      ? all.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q),
        )
      : all;
    return base.slice(0, 30);
  }, [all, query]);

  const selectedMap = useMemo(() => {
    const m = new Map<string, Prompt>();
    all?.forEach((p) => {
      if (selected.includes(p.id)) m.set(p.id, p);
    });
    return m;
  }, [all, selected]);

  const toggle = (id: string) => {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 4) {
        toast.info("最多选择 4 个提示词");
        return s;
      }
      return [...s, id];
    });
    setResult(null);
  };

  const runCompare = async () => {
    if (selected.length < 2) {
      toast.info("请至少选择 2 个提示词");
      return;
    }
    setLoading(true);
    try {
      const r = await api.compare(selected);
      setResult(r);
    } catch (e: any) {
      toast.error(e.message || "对比失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">提示词对比</h2>
        <p className="mt-0.5 text-sm text-mist-400">
          选择 2-4 个提示词，并排查看英文版本（contentEn）的差异，差异行将以琥珀色高亮。
        </p>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
        <input
          className="input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索提示词标题或内容"
        />
      </div>

      {/* 已选提示词 */}
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <span className="text-xs text-mist-500">已选 0 / 4</span>
        ) : (
          Array.from(selectedMap.values()).map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon-purple/40 bg-neon-purple/15 px-2 py-1 text-xs font-medium text-mist-50"
            >
              <button onClick={() => toggle(p.id)} className="text-mist-400 hover:text-neon-rose">
                <X className="h-3 w-3" />
              </button>
              <span className="max-w-[140px] truncate">{p.title}</span>
            </span>
          ))
        )}
        {selected.length > 0 && (
          <button
            onClick={runCompare}
            disabled={loading || selected.length < 2}
            className="btn-neon py-1.5 text-xs"
          >
            {loading ? <Spinner className="text-xs" /> : <GitCompare className="h-3.5 w-3.5" />}{" "}
            开始对比 ({selected.length})
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-white/5 bg-ink-800/40">
        {all === null ? (
          <div className="p-4">
            <Spinner label="加载提示词…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-mist-500">没有匹配的提示词</div>
        ) : (
          filtered.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-white/5 p-3 text-left transition last:border-b-0",
                  checked ? "bg-neon-purple/10" : "hover:bg-white/[0.02]",
                )}
              >
                <div
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded border",
                    checked
                      ? "border-neon-purple bg-neon-purple text-white"
                      : "border-white/20 text-transparent",
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-mist-100">{p.title}</div>
                  <div className="truncate font-mono text-xs text-mist-500">{p.content}</div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    VISIBILITY_META[p.visibility].cls,
                  )}
                >
                  {VISIBILITY_META[p.visibility].label}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* 对比结果 */}
      {loading ? (
        <PageLoader label="对比中…" />
      ) : (
        result &&
        result.length >= 2 && <CompareView prompts={result} />
      )}
    </div>
  );
}

function CompareView({ prompts }: { prompts: Prompt[] }) {
  const linesByPrompt = prompts.map((p) => (p.contentEn || p.content || "").split("\n"));
  const maxLines = Math.max(1, ...linesByPrompt.map((l) => l.length));

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-mist-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-neon-amber/40" /> 差异行
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-white/10" /> 相同行
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-800/40">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `repeat(${prompts.length}, minmax(280px, 1fr))` }}
        >
          {/* 表头 */}
          {prompts.map((p) => (
            <div
              key={p.id}
              className="border-b border-white/10 bg-ink-850/60 p-3"
            >
              <div className="truncate text-sm font-semibold text-mist-50">{p.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mist-500">
                <span>{p.model || "—"}</span>
                <span className="text-mist-600">·</span>
                <span>{typeMeta(p.type).label}</span>
              </div>
            </div>
          ))}
          {/* 每行：逐行对比 */}
          {Array.from({ length: maxLines }).map((_, i) => {
            const cells = linesByPrompt.map((l) => l[i] ?? "");
            const allSame = cells.every((c) => c === cells[0]);
            return cells.map((c, idx) => (
              <div
                key={`${i}-${idx}`}
                className={cn(
                  "border-b border-white/5 p-3 font-mono text-xs leading-relaxed",
                  allSame ? "text-mist-300" : "bg-neon-amber/10 text-neon-amber",
                )}
              >
                <span className="mr-2 select-none text-mist-600">{i + 1}</span>
                {c || <span className="text-mist-600">—</span>}
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 通用组件                                                            */
/* ------------------------------------------------------------------ */

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-ink-800/95 p-5 shadow-card"
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 transition hover:text-mist-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-mist-400">{label}</span>
      {children}
    </label>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dot,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50"
          : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-50",
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dot }}
        />
      )}
      {label}
      {count !== undefined && <span className="text-mist-500">{count}</span>}
    </button>
  );
}

function EmptyHint({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-ink-800/40 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-400">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold text-mist-100">{title}</p>
      <p className="mt-1 text-sm text-mist-400">{desc}</p>
    </div>
  );
}
