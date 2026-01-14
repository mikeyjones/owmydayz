import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { TeamKanbanItemCard } from "./TeamKanbanItem";
import type { TeamColumn as TeamColumnType, TeamItem } from "~/db/schema";

interface TeamKanbanColumnProps {
  column: TeamColumnType & { items: TeamItem[] };
  onAddItem: (columnId: string, columnName: string) => void;
  onEditItem: (item: TeamItem) => void;
  onDeleteItem: (itemId: string) => void;
  onEditColumn?: (column: TeamColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function TeamKanbanColumn({
  column,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onEditColumn,
  onDeleteColumn,
}: TeamKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const isSystemColumn = column.isSystem;

  return (
    <div
      className={cn(
        "flex flex-col w-72 min-w-72 max-w-72 bg-muted/30 rounded-lg border",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
            <TeamKanbanItemCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
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
