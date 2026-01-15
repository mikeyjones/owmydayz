import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { KanbanItemCard } from "./KanbanItem";
import type { KanbanColumn as KanbanColumnType, KanbanItem } from "~/db/schema";
import type { ColumnColor } from "~/utils/columnColors";

interface KanbanColumnProps {
  column: KanbanColumnType & { items: KanbanItem[] };
  onAddItem: (columnId: string, columnName: string) => void;
  onEditItem: (item: KanbanItem) => void;
  onDeleteItem: (itemId: string) => void;
  onEditColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  isFolded?: boolean;
  onUnfold?: (columnId: string) => void;
  columnColor?: ColumnColor;
}

export function KanbanColumnComponent({
  column,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onEditColumn,
  onDeleteColumn,
  isFolded = false,
  onUnfold,
  columnColor,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const isSystemColumn = column.isSystem;

  // Render folded/collapsed column
  if (isFolded) {
    return (
      <Tooltip content={`Click to expand ${column.name}`}>
        <button
          ref={setNodeRef as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={() => onUnfold?.(column.id)}
          className={cn(
            "flex flex-col w-12 min-w-12 max-w-12 rounded-lg border cursor-pointer transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
            columnColor?.bg || "bg-muted/30",
            columnColor?.border,
            isOver && "ring-2 ring-primary/50"
          )}
        >
          {/* Folded Header */}
          <div className={cn(
            "flex flex-col items-center gap-2 p-2 border-b rounded-t-lg w-full",
            columnColor?.headerBg || "bg-muted/50"
          )}>
            <ChevronRight className={cn("h-4 w-4", columnColor?.text || "text-muted-foreground")} />
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              columnColor?.headerBg || "bg-muted",
              columnColor?.text || "text-muted-foreground"
            )}>
              {column.items.length}
            </span>
          </div>

          {/* Vertical Column Name */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-[100px]">
            <span
              className={cn(
                "font-semibold text-sm whitespace-nowrap",
                columnColor?.text || "text-muted-foreground"
              )}
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
              }}
            >
              {column.name}
            </span>
          </div>
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col w-72 min-w-72 max-w-72 rounded-lg border",
        columnColor?.bg || "bg-muted/30",
        columnColor?.border,
        isOver && "ring-2 ring-primary/50"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b rounded-t-lg",
        columnColor?.headerBg || "bg-muted/50"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold text-sm", columnColor?.text)}>{column.name}</h3>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            columnColor?.headerBg || "bg-muted",
            columnColor?.text || "text-muted-foreground"
          )}>
            {column.items.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddItem(column.id, column.name)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          {!isSystemColumn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditColumn && (
                  <DropdownMenuItem onClick={() => onEditColumn(column)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                )}
                {onDeleteColumn && (
                  <DropdownMenuItem
                    onClick={() => onDeleteColumn(column.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Items Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px] max-h-[calc(100vh-300px)]"
      >
        <SortableContext
          items={column.items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.items.map((item) => (
            <KanbanItemCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              columnColor={columnColor}
            />
          ))}
        </SortableContext>

        {column.items.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}
