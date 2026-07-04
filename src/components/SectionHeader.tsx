import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  moreTo?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, moreTo, className }: Props) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-neon-gradient" />
          <h2 className="font-display text-xl font-bold text-mist-50 sm:text-2xl">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-sm text-mist-400">{subtitle}</p>}
      </div>
      {moreTo && (
        <Link
          to={moreTo}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-mist-300 transition hover:text-neon-cyan"
        >
          查看全部
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
