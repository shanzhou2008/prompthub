import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/lib/types";

interface Props {
  prompt: Pick<Prompt, "hue" | "pattern" | "type" | "title" | "content" | "contentEn" | "model" | "videoUrl">;
  className?: string;
  animated?: boolean;
  imageSize?: "square" | "square_hd" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  withImage?: boolean;
  /** 是否在卡片上自动播放视频预览（hover时） */
  videoPreview?: boolean;
}

/** 来源文案映射（不暴露"抓取"字样） */
export const SOURCE_LABELS: Record<string, string> = {
  crawled: "精选收录",
  submitted: "社区分享",
  official: "官方示例",
};

/**
 * 提示词预览：生图→真实生成图，生视频→视频海报+播放，任务→抽象艺术
 */
export function PromptArt({
  prompt,
  className,
  animated = true,
  imageSize = "landscape_16_9",
  withImage = true,
  videoPreview = false,
}: Props) {
  const { hue, pattern, type, title, content, contentEn, model, videoUrl } = prompt;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = type === "video" && videoUrl;
  const showImage = withImage && !imgFailed && !isVideo;

  const imgDesc = buildImageDescription(title, contentEn || content, type, model);
  const posterSrc = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    imgDesc,
  )}&image_size=${imageSize}`;

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
      {/* 底层 CSS 抽象艺术 */}
      <CssArt hue={hue} pattern={pattern} c1={c1} c2={c2} c3={c3} />

      {/* 生图：真实生成图 */}
      {showImage && (
        <img
          src={posterSrc}
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

      {/* 生视频：海报图 + 视频播放 */}
      {isVideo && (
        <>
          <img
            src={posterSrc}
            alt={title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              videoPlaying ? "opacity-0" : "opacity-100",
            )}
          />
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterSrc}
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
          {/* 播放按钮 */}
          {!videoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-md ring-2 ring-white/30 transition-transform group-hover:scale-110">
                <svg className="ml-1 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          {/* 视频标识 */}
          <div className="absolute bottom-3 right-3 z-10 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
            VIDEO
          </div>
        </>
      )}

      {/* 加载中渐变遮罩 */}
      {showImage && !imgLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-700/40 via-ink-800/20 to-ink-700/40" />
      )}

      {/* 扫描线 */}
      {animated && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div
            className="absolute inset-x-0 h-24 animate-scan"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />
        </div>
      )}

      {/* 边角类型标记 */}
      <div className="absolute left-3 top-3 z-10 font-mono text-[10px] tracking-widest text-white/50 drop-shadow">
        {TYPE_ICON[type] ?? "·"}
      </div>
      <div className="absolute right-3 top-3 z-10 font-mono text-[10px] tracking-widest text-white/50 drop-shadow">
        H{String(hue).padStart(3, "0")}
      </div>

      {/* 底部渐隐 */}
      <div className="absolute inset-x-0 bottom-0 z-[5] h-1/3 bg-gradient-to-t from-ink-900/80 to-transparent" />
    </div>
  );
}

const TYPE_ICON: Record<string, string> = {
  image: "IM",
  video: "VD",
  task: "TSK",
};

function buildImageDescription(
  title: string,
  content: string,
  type: string,
  model: string,
): string {
  if (type === "task") {
    return `abstract futuristic visualization representing ${title}, flowing data streams, neural network nodes, dark background with neon accents, cinematic, ultra detailed, 3d render`;
  }
  const core = (content || title).slice(0, 220);
  return `${core}, masterpiece, best quality, ultra detailed, cinematic lighting, 8k`;
}

function CssArt({
  hue,
  pattern,
  c1,
  c2,
  c3,
}: {
  hue: number;
  pattern: string;
  c1: string;
  c2: string;
  c3: string;
}) {
  if (pattern === "mesh") {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(40% 50% at 20% 25%, ${c1}cc, transparent 60%),
              radial-gradient(45% 55% at 80% 30%, ${c2}aa, transparent 65%),
              radial-gradient(50% 60% at 60% 85%, ${c3}aa, transparent 60%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />
      </>
    );
  }
  if (pattern === "orbs") {
    return (
      <>
        <div
          className="absolute h-32 w-32 rounded-full blur-2xl animate-float"
          style={{ background: c1, top: "10%", left: "15%", opacity: 0.85 }}
        />
        <div
          className="absolute h-24 w-24 rounded-full blur-2xl animate-float"
          style={{ background: c2, top: "45%", left: "55%", opacity: 0.75, animationDelay: "1.5s" }}
        />
        <div
          className="absolute h-20 w-20 rounded-full blur-xl animate-float"
          style={{ background: c3, bottom: "12%", left: "25%", opacity: 0.7, animationDelay: "3s" }}
        />
      </>
    );
  }
  if (pattern === "rings") {
    return (
      <div className="absolute inset-0 grid place-items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${30 + i * 22}%`,
              height: `${30 + i * 22}%`,
              borderColor: i % 2 === 0 ? `${c1}55` : `${c2}44`,
              boxShadow: `0 0 30px -8px ${i % 2 === 0 ? c1 : c2}`,
            }}
          />
        ))}
        <div
          className="h-16 w-16 rounded-full blur-xl"
          style={{ background: `radial-gradient(circle, ${c1}, ${c3})` }}
        />
      </div>
    );
  }
  if (pattern === "waves") {
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute -left-1/4 right-[-25%] h-[40%] rounded-[50%] blur-md"
            style={{
              bottom: `${i * 14 - 8}%`,
              background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? c1 : c2}66, transparent)`,
              transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(60% 80% at 50% 0%, ${c1}33, transparent)` }}
        />
      </>
    );
  }
  if (pattern === "grid") {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${c1}22 1px, transparent 1px),
              linear-gradient(90deg, ${c1}22 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            transform: "perspective(400px) rotateX(55deg) scale(1.6)",
            transformOrigin: "bottom",
            maskImage: "linear-gradient(to top, black, transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(50% 60% at 50% 30%, ${c2}55, transparent 70%)` }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: c1 }}
        />
      </>
    );
  }
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-x-[-20%] h-1/2 blur-2xl animate-float"
          style={{
            top: `${10 + i * 18}%`,
            background: `linear-gradient(90deg, transparent, ${[c1, c2, c3][i]}88, transparent)`,
            transform: `skewY(${i % 2 === 0 ? -6 : 6}deg)`,
            opacity: 0.7,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
    </>
  );
}
