import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export function RatingStars({ value, onChange, size = 18, readonly }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHover(i)}
          onClick={() => !readonly && onChange?.(i)}
          className={cn(
            "transition-transform",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
          )}
          aria-label={`${i} 星`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              i <= display ? "fill-neon-amber text-neon-amber" : "text-mist-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}
