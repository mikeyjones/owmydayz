import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TeamKanbanColumn } from "./TeamKanbanColumn";
import { TeamKanbanItemCard } from "./TeamKanbanItem";
import { TeamCreateItemDialog } from "./TeamCreateItemDialog";
import { TeamEditItemDialog } from "./TeamEditItemDialog";
import { TeamCreateColumnDialog } from "./TeamCreateColumnDialog";
import {
  useTeamBoardWithColumns,
  useMoveTeamItem,
  useDeleteTeamItem,
  useDeleteTeamColumn,
} from "~/hooks/useTeamBoards";
import type { TeamItem, TeamColumn } from "~/db/schema";

interface TeamKanbanBoardProps {
  boardId: string;
  teamId: string;
}

export function TeamKanbanBoard({ boardId, teamId }: TeamKanbanBoardProps) {
  const { data: board, isLoading, error } = useTeamBoardWithColumns(boardId);
  const moveItemMutation = useMoveTeamItem();
  const deleteItemMutation = useDeleteTeamItem();
  const deleteColumnMutation = useDeleteTeamColumn();

  const [activeItem, setActiveItem] = useState<TeamItem | null>(null);
  const [createItemDialog, setCreateItemDialog] = useState<{
    open: boolean;
    columnId: string;
    columnName: string;
  }>({ open: false, columnId: "", columnName: "" });
  const [editItemDialog, setEditItemDialog] = useState<{
    open: boolean;
    item: TeamItem | null;
  }>({ open: false, item: null });
  const [createColumnDialog, setCreateColumnDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "item") {
      setActiveItem(activeData.item);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over || !board) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || activeData.type !== "item") return;

      const activeItem = activeData.item as TeamItem;
      let targetColumnId: string;
      let newPosition: number;

      if (overData?.type === "column") {
        targetColumnId = over.id as string;
        const targetColumn = board.columns.find((c) => c.id === targetColumnId);
        newPosition = targetColumn?.items.length || 0;
      } else if (overData?.type === "item") {
        const overItem = overData.item as TeamItem;
        targetColumnId = overItem.columnId;
        const targetColumn = board.columns.find((c) => c.id === targetColumnId);
        const overIndex = targetColumn?.items.findIndex(
          (i) => i.id === overItem.id
        );
        newPosition = overIndex !== undefined && overIndex >= 0 ? overIndex : 0;
      } else {
        return;
      }

      if (
        activeItem.columnId !== targetColumnId ||
        activeItem.position !== newPosition
      ) {
        moveItemMutation.mutate({
          itemId: activeItem.id,
          newColumnId: targetColumnId,
          newPosition,
          boardId,
        });
      }
    },
    [board, boardId, moveItemMutation]
  );

  const handleAddItem = useCallback((columnId: string, columnName: string) => {
    setCreateItemDialog({ open: true, columnId, columnName });
  }, []);

  const handleEditItem = useCallback((item: TeamItem) => {
    setEditItemDialog({ open: true, item });
  }, []);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteItemMutation.mutate({ id: itemId, boardId });
    },
    [boardId, deleteItemMutation]
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      deleteColumnMutation.mutate({ id: columnId, boardId });
    },
    [boardId, deleteColumnMutation]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load board</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold">{board.name}</h2>
          {board.description && (
            <p className="text-sm text-muted-foreground">{board.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateColumnDialog(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-h-[400px]">
            {board.columns.map((column) => (
              <TeamKanbanColumn
                key={column.id}
                column={column}
                onAddItem={handleAddItem}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {board.columns.length === 0 && (
              <div className="flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No columns yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateColumnDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Column
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="w-72">
              <TeamKanbanItemCard
                item={activeItem}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <TeamCreateItemDialog
        open={createItemDialog.open}
        onOpenChange={(open) =>
          setCreateItemDialog((prev) => ({ ...prev, open }))
        }
        columnId={createItemDialog.columnId}
        boardId={boardId}
        columnName={createItemDialog.columnName}
      />

      <TeamEditItemDialog
        open={editItemDialog.open}
        onOpenChange={(open) => setEditItemDialog((prev) => ({ ...prev, open }))}
        item={editItemDialog.item}
        boardId={boardId}
      />

      <TeamCreateColumnDialog
        open={createColumnDialog}
        onOpenChange={setCreateColumnDialog}
        boardId={boardId}
      />
    </div>
  );
}
