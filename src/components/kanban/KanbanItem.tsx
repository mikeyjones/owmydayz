import { useRef, useState, useEffect } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachClosestEdge, extractClosestEdge, type Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { GripVertical, MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { useKanbanItemCommentCount } from "~/hooks/useItemComments";
import { DropIndicator } from "./DropIndicator";
import type { KanbanItem as KanbanItemType, KanbanImportance, KanbanEffort } from "~/db/schema";
import type { ColumnColor } from "~/utils/columnColors";

interface KanbanItemProps {
  item: KanbanItemType;
  onEdit: (item: KanbanItemType) => void;
  onDelete: (itemId: string) => void;
  isDragging?: boolean;
  columnColor?: ColumnColor;
}

const importanceStyles: Record<KanbanImportance, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-green-500/20", text: "text-green-600", label: "Low" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-600", label: "Medium" },
  high: { bg: "bg-red-500/20", text: "text-red-600", label: "High" },
};

const effortStyles: Record<KanbanEffort, { bg: string; text: string; label: string }> = {
  small: { bg: "bg-blue-500/20", text: "text-blue-600", label: "S" },
  medium: { bg: "bg-purple-500/20", text: "text-purple-600", label: "M" },
  big: { bg: "bg-orange-500/20", text: "text-orange-600", label: "L" },
};

export function KanbanItemCard({
  item,
  onEdit,
  onDelete,
  isDragging: isDraggingProp = false,
  columnColor,
}: KanbanItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const { data: commentCount } = useKanbanItemCommentCount(item.id);

  useEffect(() => {
    const element = ref.current;
    const dragHandle = dragHandleRef.current;
    if (!element || !dragHandle) return;

    return combine(
      draggable({
        element,
        dragHandle,
        getInitialData: () => ({
          type: "item",
          itemId: item.id,
          item,
          columnId: item.columnId,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) => {
          return attachClosestEdge(
            { type: "item", itemId: item.id, columnId: item.columnId },
            { input, element, allowedEdges: ["top", "bottom"] }
          );
        },
        canDrop: ({ source }) => {
          // Don't allow dropping on itself
          return source.data.type === "item" && source.data.itemId !== item.id;
        },
        onDragEnter: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge);
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge);
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [item.id, item.columnId, item]);

  const importance = (item.importance || "medium") as KanbanImportance;
  const effort = (item.effort || "medium") as KanbanEffort;
  const tags = item.tags || [];

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-card border rounded-lg p-3 shadow-sm transition-all border-l-4",
        columnColor?.accent || "border-l-transparent",
        "hover:shadow-md hover:border-primary/30",
        (isDragging || isDraggingProp) && "opacity-50 shadow-lg ring-2 ring-primary/50"
      )}
    >
      <DropIndicator edge={closestEdge} />
      <div className="flex items-start gap-2">
        <button
          ref={dragHandleRef}
          type="button"
          className="mt-0.5 p-1 -ml-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight break-words">
              {item.name}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                importanceStyles[importance].bg,
                importanceStyles[importance].text
              )}
            >
              {importanceStyles[importance].label}
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                effortStyles[effort].bg,
                effortStyles[effort].text
              )}
            >
              {effortStyles[effort].label}
            </span>

            {tags.length > 0 && (
              <>
                {tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 h-4"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{tags.length - 2}
                  </span>
                )}
              </>
            )}

            {commentCount !== undefined && commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
