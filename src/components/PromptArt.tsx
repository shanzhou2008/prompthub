import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/lib/types";

interface Props {
  prompt: Pick<Prompt, "id" | "hue" | "pattern" | "type" | "title" | "content" | "contentEn" | "model" | "videoUrl" | "imageUrl" | "imageLgUrl">;
  className?: string;
  animated?: boolean;
  imageSize?: "card" | "detail";
  videoPreview?: boolean;
}

/**
 * 构建图片 URL：
 * - 本地图片（/images/xxx.jpg）直接使用
 * - Pollinations URL 通过 /api/img 代理（Vercel 服务器在美国，可以访问 Pollinations）
 */
function buildImageUrl(prompt: Props["prompt"], size: "card" | "detail"): string {
  const raw = size === "detail" ? (prompt.imageLgUrl || prompt.imageUrl) : (prompt.imageUrl || prompt.imageLgUrl);
  if (!raw) return "";
  // 本地图片和 Pexels CDN 图片直接使用
  if (raw.startsWith("/images/") || raw.startsWith("http")) return raw;
  return raw;
}

export function PromptArt({
  prompt,
  className,
  animated = true,
  imageSize = "card",
  videoPreview = false,
}: Props) {
  const { hue, pattern, type, title, videoUrl } = prompt;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = type === "video" && !!videoUrl;
  const primarySrc = buildImageUrl(prompt, imageSize);

  const h = hue;
  const c1 = `hsl(${h} 90% 62%)`;
  const c2 = `hsl(${(h + 40) % 360} 88% 58%)`;
  const c3 = `hsl(${(h + 180) % 360} 85% 55%)`;
  const dark = `hsl(${h} 60% 8%)`;

  return (
    <div
      className={cn("relative overflow-hidden group", className)}
      style={{ background: dark }}
      onMouseEnter={() => {
        if (videoPreview && isVideo && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        if (videoPreview && isVideo && videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <CssFallback hue={hue} pattern={pattern} c1={c1} c2={c2} c3={c3} />

      {primarySrc && !imgFailed && (
        <img
          src={primarySrc}
          alt={title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700",
            imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          )}
        />
      )}

      {isVideo && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            muted
            loop
            preload="none"
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              videoPlaying ? "opacity-100" : "opacity-0",
            )}
          />
          {!videoPlaying && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-md ring-2 ring-white/30 transition-transform group-hover:scale-110">
                <svg className="ml-1 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}

      {type === "video" && (
        <div className="absolute bottom-3 right-3 z-20 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90">
          ▶ VIDEO
        </div>
      )}

      {type === "task" && (
        <div className="absolute bottom-3 right-3 z-20 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300/90">
          ⚡ TASK
        </div>
      )}

      {primarySrc && !imgLoaded && !imgFailed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-700/40 via-ink-800/20 to-ink-700/40" />
      )}

      {animated && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div
            className="absolute inset-x-0 h-24 animate-scan"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[5] h-1/4 bg-gradient-to-t from-ink-900/80 to-transparent" />
    </div>
  );
}

function CssFallback({ hue, pattern, c1, c2, c3 }: { hue: number; pattern: string; c1: string; c2: string; c3: string }) {
  if (pattern === "mesh") {
    return (
      <div className="absolute inset-0" style={{
        background: `radial-gradient(40% 50% at 20% 25%, ${c1}cc, transparent 60%), radial-gradient(45% 55% at 80% 30%, ${c2}aa, transparent 65%), radial-gradient(50% 60% at 60% 85%, ${c3}aa, transparent 60%)`,
      }} />
    );
  }
  if (pattern === "orbs") {
    return (
      <div className="absolute inset-0" style={{
        background: `radial-gradient(30% 40% at 15% 20%, ${c1}aa, transparent 50%), radial-gradient(25% 35% at 75% 40%, ${c2}88, transparent 55%), radial-gradient(20% 30% at 40% 80%, ${c3}77, transparent 50%)`,
      }} />
    );
  }
  if (pattern === "rings") {
    return (
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${c1}44, transparent 70%), radial-gradient(ellipse 70% 70% at 50% 50%, ${c2}22, transparent 80%), radial-gradient(ellipse 90% 90% at 50% 50%, ${c3}11, transparent 90%)`,
      }} />
    );
  }
  if (pattern === "waves") {
    return (
      <div className="absolute inset-0" style={{
        background: `linear-gradient(170deg, ${c1}66 0%, transparent 40%), linear-gradient(190deg, ${c2}44 10%, transparent 50%), linear-gradient(180deg, ${c3}33 20%, transparent 60%)`,
      }} />
    );
  }
  if (pattern === "grid") {
    return (
      <div className="absolute inset-0" style={{
        background: `radial-gradient(50% 60% at 50% 30%, ${c2}44, transparent 70%)`,
      }} />
    );
  }
  return (
    <div className="absolute inset-0" style={{
      background: `radial-gradient(40% 50% at 30% 20%, ${c1}88, transparent 60%), radial-gradient(45% 55% at 70% 70%, ${c2}66, transparent 60%)`,
    }} />
  );
}
