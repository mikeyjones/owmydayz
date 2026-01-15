import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Target, CheckCircle2 } from "lucide-react";
import { useAllNowItems, useCompleteItem } from "~/hooks/useKanban";
import { FocusItem } from "~/components/FocusItem";

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

export const Route = createFileRoute("/dashboard/focus")({
  component: FocusPage,
});

function FocusPage() {
  const { data: items, isLoading, error } = useAllNowItems();
  const completeItemMutation = useCompleteItem();

  const handleComplete = (itemId: string, boardId: string) => {
    completeItemMutation.mutate({ itemId, boardId });
  };

  // Group items by board
  const groupedItems = items?.reduce(
    (acc, item) => {
      if (!acc[item.boardName]) {
        acc[item.boardName] = [];
      }
      acc[item.boardName].push(item);
      return acc;
    },
    {} as Record<string, NowItem[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load focus items</p>
        </div>
      </div>
    );
  }

  const totalItems = items?.length || 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
            <Target className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Focus
          </h1>
        </div>
        <p className="text-muted-foreground">
          {totalItems === 0
            ? "You're all caught up! No items need your attention right now."
            : `${totalItems} item${totalItems === 1 ? "" : "s"} across all your boards need attention.`}
        </p>
      </div>

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">All Clear!</h2>
          <p className="text-white/50 text-center max-w-md">
            You don't have any items in your "Now" columns. Add items to a board's
            "Now" column to see them here.
          </p>
        </div>
      )}

      {/* Items grouped by board */}
      {groupedItems && Object.keys(groupedItems).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([boardName, boardItems]) => (
            <div key={boardName}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                {boardName}
                <span className="text-white/20">({boardItems.length})</span>
              </h2>
              <div className="space-y-2">
                {boardItems.map((item) => (
                  <FocusItem
                    key={item._id}
                    item={item}
                    onComplete={handleComplete}
                    isCompleting={completeItemMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
