import { useState, useCallback, useMemo, useEffect } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Plus, Settings, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { KanbanColumnComponent } from "./KanbanColumn";
import { CreateItemDialog } from "./CreateItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { CreateColumnDialog } from "./CreateColumnDialog";
import { BoardDialog } from "./BoardDialog";
import {
  useBoardWithColumns,
  useMoveItem,
  useDeleteItem,
  useDeleteColumn,
} from "~/hooks/useKanban";
import { getColumnColor } from "~/utils/columnColors";
import type { KanbanItem } from "~/types";
import type { KanbanColumnWithItems } from "~/types";

// System column name constant
const SYSTEM_COLUMN_NOW = "Now";

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { data: board, isLoading, error } = useBoardWithColumns(boardId);
  const moveItemMutation = useMoveItem();
  const deleteItemMutation = useDeleteItem();
  const deleteColumnMutation = useDeleteColumn();

  const [createItemDialog, setCreateItemDialog] = useState<{
    open: boolean;
    columnId: string;
    columnName: string;
  }>({ open: false, columnId: "", columnName: "" });
  const [editItemDialog, setEditItemDialog] = useState<{
    open: boolean;
    item: KanbanItem | null;
  }>({ open: false, item: null });
  const [createColumnDialog, setCreateColumnDialog] = useState(false);
  const [boardSettingsDialog, setBoardSettingsDialog] = useState(false);
  
  // Focus mode state: track which non-"Now" column is currently expanded
  const [expandedColumnId, setExpandedColumnId] = useState<string | null>(null);

  // Get first non-system, non-"Now" column as default expanded
  const defaultExpandedColumn = useMemo(() => {
    if (!board?.columns) return null;
    return board.columns.find(
      (col) => !col.isSystem || col.name !== SYSTEM_COLUMN_NOW
    );
  }, [board?.columns]);

  // Initialize expanded column when board loads or focus mode changes
  useEffect(() => {
    if (board?.focusMode && !expandedColumnId && defaultExpandedColumn) {
      setExpandedColumnId(defaultExpandedColumn.id);
    }
  }, [board?.focusMode, expandedColumnId, defaultExpandedColumn]);

  // Monitor for drag and drop events
  useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const destination = location.current.dropTargets[0];
        if (!destination || !board) return;

        const sourceData = source.data;
        const destData = destination.data;

        // Only handle item drops
        if (sourceData.type !== "item") return;

        const sourceItem = sourceData.item as KanbanItem;
        let targetColumnId: string;
        let newPosition: number;

        if (destData.type === "column") {
          // Dropped directly on a column (empty area)
          targetColumnId = destData.columnId as string;
          const targetColumn = board.columns.find((c) => c.id === targetColumnId);
          newPosition = targetColumn?.items.length || 0;
        } else if (destData.type === "item") {
          // Dropped on another item
          targetColumnId = destData.columnId as string;
          const targetColumn = board.columns.find((c) => c.id === targetColumnId);
          const targetItemId = destData.itemId as string;
          const targetIndex = targetColumn?.items.findIndex(
            (i) => i.id === targetItemId
          ) ?? -1;

          // Determine position based on closest edge
          const closestEdge = extractClosestEdge(destData);
          
          if (targetIndex >= 0) {
            // If dropping below, add 1 to position
            newPosition = closestEdge === "bottom" ? targetIndex + 1 : targetIndex;
            
            // Adjust if moving within the same column and from above
            if (sourceItem.columnId === targetColumnId) {
              const sourceIndex = targetColumn?.items.findIndex(
                (i) => i.id === sourceItem.id
              ) ?? -1;
              if (sourceIndex >= 0 && sourceIndex < newPosition) {
                newPosition -= 1;
              }
            }
          } else {
            newPosition = 0;
          }
        } else {
          return;
        }

        // Only update if something changed
        if (
          sourceItem.columnId !== targetColumnId ||
          sourceItem.position !== newPosition
        ) {
          moveItemMutation.mutate({
            itemId: sourceItem.id,
            newColumnId: targetColumnId,
            newPosition,
            boardId,
          });
        }
      },
    });
  }, [board, boardId, moveItemMutation]);

  // Handler for unfolding a column in focus mode
  const handleUnfoldColumn = useCallback((columnId: string) => {
    setExpandedColumnId(columnId);
  }, []);

  // Determine if a column should be folded
  const isColumnFolded = useCallback(
    (column: KanbanColumnWithItems) => {
      if (!board?.focusMode) return false;
      
      // "Now" column is never folded
      if (column.isSystem && column.name === SYSTEM_COLUMN_NOW) return false;
      
      // The currently expanded column is not folded
      if (column.id === expandedColumnId) return false;
      
      // All other columns are folded in focus mode
      return true;
    },
    [board?.focusMode, expandedColumnId]
  );

  const handleAddItem = useCallback((columnId: string, columnName: string) => {
    setCreateItemDialog({ open: true, columnId, columnName });
  }, []);

  const handleEditItem = useCallback((item: KanbanItem) => {
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

  if (isLoading || board === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load board</p>
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Board not found</p>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateColumnDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBoardSettingsDialog(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-h-[400px]">
          {board.columns.map((column, index) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onDeleteColumn={handleDeleteColumn}
              isFolded={isColumnFolded(column)}
              onUnfold={handleUnfoldColumn}
              columnColor={getColumnColor(index)}
            />
          ))}

          {board.columns.length === 0 && (
            <div className="flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  No columns yet
                </p>
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

      {/* Dialogs */}
      <CreateItemDialog
        open={createItemDialog.open}
        onOpenChange={(open) =>
          setCreateItemDialog((prev) => ({ ...prev, open }))
        }
        columnId={createItemDialog.columnId}
        boardId={boardId}
        columnName={createItemDialog.columnName}
      />

      <EditItemDialog
        open={editItemDialog.open}
        onOpenChange={(open) => setEditItemDialog((prev) => ({ ...prev, open }))}
        item={editItemDialog.item}
        boardId={boardId}
      />

      <CreateColumnDialog
        open={createColumnDialog}
        onOpenChange={setCreateColumnDialog}
        boardId={boardId}
      />

      <BoardDialog
        open={boardSettingsDialog}
        onOpenChange={setBoardSettingsDialog}
        board={board}
      />
    </div>
  );
}
