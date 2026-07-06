import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Prompt, Stats } from "@/lib/types";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<Prompt[]>([]);
  const [latest, setLatest] = useState<Prompt[]>([]);
  const [trending, setTrending] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const results = await Promise.allSettled([
          api.stats(),
          api.daily(),
          api.latest(),
          api.trending(),
        ]);
        if (!mounted) return;
        if (results[0].status === "fulfilled") setStats(results[0].value);
        if (results[1].status === "fulfilled") setDaily(results[1].value);
        if (results[2].status === "fulfilled") setLatest(results[2].value);
        if (results[3].status === "fulfilled") setTrending(results[3].value);
        const allFailed = results.every((r) => r.status === "rejected");
        if (allFailed) setError("所有数据加载失败，请检查网络");
      } catch (e: any) {
        if (mounted) setError(e?.message || "加载失败");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 调试信息（临时）
  const [debugInfo, setDebugInfo] = useState("");
  useEffect(() => {
    fetch("/api/prompts/stats")
      .then((r) => r.text())
      .then((t) => setDebugInfo(`stats API: ${t.slice(0, 200)}`))
      .catch((e) => setDebugInfo(`stats API error: ${e.message}`));
  }, []);

  return (
    <>
      {/* 调试条 - 临时 */}
      <div style={{ background: "#1a0033", color: "#0f0", padding: "8px 16px", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
        DEBUG: {debugInfo || "loading..."} | stats={stats ? "OK" : "null"} | daily={daily.length} | latest={latest.length} | trending={trending.length} | loading={String(loading)}
      </div>

      {/* Hero */}
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 12px" }}>
          发现最棒的 <span style={{ color: "#a855f7" }}>AI 提示词</span>
        </h1>
        <p style={{ color: "#aaa", maxWidth: "600px", margin: "0 auto 20px" }}>
          聚合生图、生视频与任务执行的优质提示词，每日更新，开箱即用。
        </p>
        {stats && (
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
            <Stat label="提示词总数" value={stats.total} />
            <Stat label="生图" value={stats.image} />
            <Stat label="生视频" value={stats.video} />
            <Stat label="任务" value={stats.task} />
          </div>
        )}
      </section>

      {error && (
        <div style={{ padding: "12px 20px", background: "#7f1d1d", color: "#fff", textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* 每日精选 */}
      <Section title="每日精选" prompts={daily} loading={loading} max={4} />

      {/* 最新更新 */}
      <Section title="最新更新" prompts={latest} loading={loading} max={8} />

      {/* 热门趋势 */}
      <Section title="热门趋势" prompts={trending} loading={loading} max={4} />

      {/* 分类导航 */}
      <section style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>按类型探索</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Link to="/explore?type=image" style={catLink}>生图提示词</Link>
          <Link to="/explore?type=video" style={catLink}>生视频提示词</Link>
          <Link to="/explore?type=task" style={catLink}>任务执行提示词</Link>
        </div>
      </section>
    </>
  );
}

const catLink: React.CSSProperties = {
  display: "block",
  padding: "20px",
  background: "#1a1a2e",
  border: "1px solid #333",
  borderRadius: "12px",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  textAlign: "center",
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#1a1a2e", padding: "12px 20px", borderRadius: "8px", border: "1px solid #333" }}>
      <div style={{ fontSize: "11px", color: "#888" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#a855f7" }}>{value}</div>
    </div>
  );
}

function Section({ title, prompts, loading, max }: { title: string; prompts: Prompt[]; loading: boolean; max: number }) {
  return (
    <section style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>{title}</h2>
      {loading ? (
        <div style={{ color: "#666", padding: "20px" }}>加载中...</div>
      ) : prompts.length === 0 ? (
        <div style={{ color: "#666", padding: "20px" }}>暂无数据</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
          {prompts.slice(0, max).map((p) => (
            <Link
              key={p.id}
              to={`/prompt/${p.id}`}
              style={{
                display: "block",
                padding: "16px",
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{p.model}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>{p.title}</div>
              <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.content}
              </div>
              <div style={{ marginTop: "8px", fontSize: "11px", color: "#666" }}>
                浏览 {p.viewCount} · 复制 {p.copyCount} · ★ {p.ratingAvg}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
