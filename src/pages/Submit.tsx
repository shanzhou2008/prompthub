import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Clapperboard,
  Terminal,
  Globe,
  Lock,
  Link2,
  Folder,
  ChevronDown,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/store/useToast";
import { useAuth } from "@/store/useAuth";
import { Reveal } from "@/components/Reveal";
import { PromptArt } from "@/components/PromptArt";
import { cn } from "@/lib/utils";
import type { Project, Visibility } from "@/lib/types";

const TYPES = [
  { key: "image", label: "生图", icon: ImageIcon },
  { key: "video", label: "生视频", icon: Clapperboard },
  { key: "task", label: "任务", icon: Terminal },
] as const;

const MODELS_BY_TYPE: Record<string, string[]> = {
  image: ["midjourney", "stable-diffusion", "dall-e-3", "flux"],
  video: ["sora", "runway-gen3", "kling", "jimeng"],
  task: ["gpt-4", "claude-3.5", "gemini"],
};

const PATTERNS = ["mesh", "orbs", "rings", "waves", "grid", "aurora"] as const;

const VISIBILITIES: {
  key: Visibility;
  label: string;
  desc: string;
  icon: typeof Globe;
}[] = [
  { key: "public", label: "公开", desc: "全网可见", icon: Globe },
  { key: "private", label: "私有", desc: "仅自己可见", icon: Lock },
  { key: "link", label: "仅链接", desc: "凭链接访问", icon: Link2 },
];

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState<string>("image");
  const [model, setModel] = useState("midjourney");
  const [title, setTitle] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [langTab, setLangTab] = useState<"zh" | "en">("zh");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState("zh");
  const [hue, setHue] = useState(() => Math.floor(Math.random() * 360));
  const [pattern, setPattern] = useState<string>("mesh");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [projectId, setProjectId] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectOpen, setProjectOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  // 加载已有项目列表
  useEffect(() => {
    if (!user) return;
    api.projects().then(setProjects).catch(() => setProjects([]));
  }, [user]);

  // 点击外部关闭项目下拉
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const selectedProject = projects.find((p) => p.id === projectId);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    if (!contentZh.trim() || !contentEn.trim()) {
      toast.error("请同时填写中英文提示词内容");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createMyPrompt({
        title: title.trim(),
        contentEn: contentEn.trim(),
        contentZh: contentZh.trim(),
        content: contentZh.trim(),
        type,
        model,
        vendor: model,
        params: {},
        tags,
        language,
        hue,
        pattern,
        visibility,
        projectId: projectId || undefined,
      });
      toast.success("发布成功");
      navigate(`/prompt/${res.id}`);
    } catch (err: any) {
      toast.error(err.message || "发布失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-8">
      <Reveal>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">发布提示词</h1>
          <p className="mt-1 text-sm text-mist-400">
            填写双语内容并选择可见性，直接发布到你的提示词库
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,400px)]">
          {/* 左侧表单 */}
          <form onSubmit={onSubmit} className="space-y-5">
            {/* 类型 */}
            <Field label="类型">
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setType(t.key);
                      setModel(MODELS_BY_TYPE[t.key][0]);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition",
                      type === t.key
                        ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50 shadow-[0_0_20px_-6px_rgba(124,92,255,0.6)]"
                        : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-100",
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* 模型 */}
            <Field label="模型">
              <div className="flex flex-wrap gap-2">
                {MODELS_BY_TYPE[type].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition",
                      model === m
                        ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan"
                        : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-100",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="标题">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="一句话概括这个提示词的用途"
                className="input"
              />
            </Field>

            {/* 双语内容 */}
            <Field label="提示词内容（中英双语）">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-850/80">
                <div className="flex border-b border-white/10">
                  {(["zh", "en"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setLangTab(tab)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium transition",
                        langTab === tab
                          ? "bg-neon-purple/15 text-mist-50"
                          : "text-mist-400 hover:text-mist-200",
                      )}
                    >
                      {tab === "zh" ? "中文" : "English"}
                      {(tab === "zh" ? contentZh : contentEn) && (
                        <Check className="h-3 w-3 text-neon-lime" />
                      )}
                    </button>
                  ))}
                </div>
                <textarea
                  value={langTab === "zh" ? contentZh : contentEn}
                  onChange={(e) =>
                    langTab === "zh"
                      ? setContentZh(e.target.value)
                      : setContentEn(e.target.value)
                  }
                  rows={6}
                  required
                  placeholder={
                    langTab === "zh"
                      ? "粘贴中文版提示词内容…"
                      : "Paste the English version of the prompt…"
                  }
                  className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-mist-50 outline-none placeholder:text-mist-500"
                />
                <div className="flex items-center justify-between border-t border-white/10 px-4 py-1.5 text-[10px] text-mist-500">
                  <span className={contentZh ? "text-neon-lime" : ""}>
                    中文 {contentZh ? "已填写" : "未填写"}
                  </span>
                  <span className={contentEn ? "text-neon-lime" : ""}>
                    EN {contentEn ? "已填写" : "未填写"}
                  </span>
                </div>
              </div>
            </Field>

            {/* 可见性 */}
            <Field label="可见性">
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITIES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVisibility(v.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition",
                      visibility === v.key
                        ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_22px_-6px_rgba(0,229,255,0.7)]"
                        : "border-white/10 bg-white/[0.03] text-mist-300 hover:text-mist-100",
                    )}
                  >
                    <v.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{v.label}</span>
                    <span className="text-[10px] leading-tight text-mist-500">
                      {v.desc}
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            {/* 项目分类 */}
            <Field label="项目分类">
              <div ref={projectRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProjectOpen((o) => !o)}
                  className="input flex items-center justify-between text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {selectedProject ? (
                      <>
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: selectedProject.color || "#7C5CFF" }}
                        />
                        <span className="truncate text-mist-50">
                          {selectedProject.name}
                        </span>
                        <span className="shrink-0 text-xs text-mist-500">
                          · {selectedProject.promptCount}
                        </span>
                      </>
                    ) : (
                      <>
                        <Folder className="h-4 w-4 shrink-0 text-mist-500" />
                        <span className="text-mist-300">不归类</span>
                      </>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-mist-500 transition",
                      projectOpen && "rotate-180",
                    )}
                  />
                </button>
                {projectOpen && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-ink-850/95 shadow-glow backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectId("");
                        setProjectOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-white/5",
                        !projectId ? "bg-neon-purple/15 text-mist-50" : "text-mist-300",
                      )}
                    >
                      <Folder className="h-4 w-4 text-mist-500" />
                      不归类
                    </button>
                    {projects.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-mist-500">
                        暂无项目，可在个人中心创建
                      </div>
                    ) : (
                      projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProjectId(p.id);
                            setProjectOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-white/5",
                            projectId === p.id
                              ? "bg-neon-purple/15 text-mist-50"
                              : "text-mist-300",
                          )}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: p.color || "#7C5CFF" }}
                          />
                          <span className="flex-1 truncate text-left">{p.name}</span>
                          <span className="shrink-0 text-xs text-mist-500">
                            {p.promptCount}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Field>

            {/* 标签 */}
            <Field label="标签（最多 6 个）">
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="text-mist-500 hover:text-neon-rose"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 6 && (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="输入标签后回车"
                    className="w-32 bg-transparent text-sm text-mist-100 outline-none placeholder:text-mist-500"
                  />
                )}
              </div>
            </Field>

            <Field label="语言">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="zh" className="bg-ink-850">
                  中文
                </option>
                <option value="en" className="bg-ink-850">
                  英文
                </option>
                <option value="ja" className="bg-ink-850">
                  日文
                </option>
                <option value="other" className="bg-ink-850">
                  其他
                </option>
              </select>
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
                取消
              </button>
              <button type="submit" disabled={loading} className="btn-neon">
                <Upload className="h-4 w-4" />
                {loading ? "发布中…" : "立即发布"}
              </button>
            </div>
          </form>

          {/* 右侧实时预览 */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-ink-800/60 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-mist-200">
                  <Sparkles className="h-4 w-4 text-neon-cyan" />
                  实时预览
                </span>
                <button
                  type="button"
                  onClick={() => setHue(Math.floor(Math.random() * 360))}
                  className="btn-ghost-sm"
                  title="随机色相"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  换色
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <PromptArt
                  prompt={{
                    hue,
                    pattern: pattern as any,
                    type: type as any,
                    title: title || "未命名提示词",
                    content: contentZh || contentEn,
                    contentEn,
                    model,
                  }}
                  className="aspect-[16/10] w-full"
                  animated={false}
                />
              </div>

              {/* 图案选择 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-mist-400">预览图案</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {PATTERNS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPattern(p)}
                      className={cn(
                        "rounded-lg border px-1 py-1.5 text-[10px] font-medium transition",
                        pattern === p
                          ? "border-neon-purple/50 bg-neon-purple/15 text-mist-50"
                          : "border-white/10 bg-white/[0.03] text-mist-400 hover:text-mist-200",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 摘要 */}
              <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs">
                <SummaryRow label="类型">
                  <span className="text-mist-100">
                    {TYPES.find((t) => t.key === type)?.label}
                  </span>
                </SummaryRow>
                <SummaryRow label="模型">
                  <span className="text-mist-100">{model}</span>
                </SummaryRow>
                <SummaryRow label="可见性">
                  <span className="text-mist-100">
                    {VISIBILITIES.find((v) => v.key === visibility)?.label}
                  </span>
                </SummaryRow>
                <SummaryRow label="项目">
                  {selectedProject ? (
                    <span className="flex items-center gap-1.5 text-mist-100">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: selectedProject.color || "#7C5CFF" }}
                      />
                      {selectedProject.name}
                    </span>
                  ) : (
                    <span className="text-mist-400">不归类</span>
                  )}
                </SummaryRow>
                <SummaryRow label="标签">
                  {tags.length > 0 ? (
                    <span className="text-mist-100">{tags.join(" · ")}</span>
                  ) : (
                    <span className="text-mist-400">无</span>
                  )}
                </SummaryRow>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-mist-300">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-mist-500">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  );
}
