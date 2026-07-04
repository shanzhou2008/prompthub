import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "@/store/useToast";
import { cn } from "@/lib/utils";

const ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLOR = {
  success: "text-neon-lime border-neon-lime/30",
  error: "text-neon-rose border-neon-rose/30",
  info: "text-neon-cyan border-neon-cyan/30",
};

export function ToastHost() {
  const { toasts, remove } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-ink-800/95 px-4 py-3 text-sm shadow-card backdrop-blur-xl",
                COLOR[t.type],
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-mist-50">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="text-mist-500 transition hover:text-mist-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
