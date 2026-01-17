import { useState } from "react";
import confetti from "canvas-confetti";
import { Check, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

// Convex now item type
interface NowItem {
  _id: string;
  columnId: string;
  boardId: string;
  name: string;
  description?: string;
  importance: string;
  effort: string;
  tags: string[];
  position: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  boardName: string;
}

interface FocusItemProps {
  item: NowItem;
  onComplete: (itemId: string, boardId: string) => void;
  isCompleting?: boolean;
}

type KanbanImportance = "low" | "medium" | "high";

const importanceStyles: Record<KanbanImportance, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Low" },
  medium: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Medium" },
  high: { bg: "bg-rose-500/20", text: "text-rose-400", label: "High" },
};

function triggerConfetti() {
  // Create a burst of confetti from the center
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function FocusItem({ item, onComplete, isCompleting = false }: FocusItemProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const importance = (item.importance || "medium") as KanbanImportance;

  const handleCheck = () => {
    if (isCompleting || isChecked) return;
    
    setIsChecked(true);
    triggerConfetti();
    
    // Start fade out animation
    setTimeout(() => {
      setIsAnimatingOut(true);
    }, 300);
    
    // Actually complete the item after animation
    setTimeout(() => {
      onComplete(item._id, item.boardId);
    }, 600);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
        "bg-card/50 border border-border hover:border-border/60",
        "hover:bg-card/80",
        isAnimatingOut && "opacity-0 scale-95 translate-x-4",
        isChecked && !isAnimatingOut && "bg-emerald-500/10 border-emerald-500/30"
      )}
    >
      {/* Custom Checkbox */}
      <button
        onClick={handleCheck}
        disabled={isCompleting || isChecked}
        className={cn(
          "relative flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200",
          "flex items-center justify-center",
          isChecked
            ? "bg-emerald-500 border-emerald-500"
            : "border-border hover:border-emerald-400 hover:bg-emerald-500/10",
          (isCompleting || isChecked) && "cursor-not-allowed"
        )}
      >
        {isCompleting ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : isChecked ? (
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-medium text-[15px] leading-tight transition-all duration-200",
              isChecked ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {item.name}
          </h3>
          <span
            className={cn(
              "flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide",
              importanceStyles[importance].bg,
              importanceStyles[importance].text
            )}
          >
            {importanceStyles[importance].label}
          </span>
        </div>

        {item.description && (
          <p
            className={cn(
              "text-sm mt-1.5 line-clamp-2 transition-colors duration-200",
              isChecked ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          >
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {item.boardName}
          </span>
        </div>
      </div>
    </div>
  );
}
