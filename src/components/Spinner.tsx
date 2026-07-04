import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-mist-400", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-neon-purple" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function PageLoader({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner label={label} className="text-base" />
    </div>
  );
}

/** 卡片骨架屏 */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60">
      <div className="aspect-[16/10] animate-pulse bg-ink-700/60" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-ink-700/60" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink-700/60" />
        <div className="h-3 w-full animate-pulse rounded bg-ink-700/40" />
        <div className="flex gap-1 pt-2">
          <div className="h-5 w-12 animate-pulse rounded bg-ink-700/40" />
          <div className="h-5 w-12 animate-pulse rounded bg-ink-700/40" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
