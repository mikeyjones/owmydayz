import { useState } from "react";
import { Plus, LayoutDashboard } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { BoardCard } from "./BoardCard";
import { BoardDialog } from "./BoardDialog";
import { useBoards, useDeleteBoard } from "~/hooks/useKanban";
import type { KanbanBoard } from "~/types";

export function BoardList() {
  const { data: boards, isPending, error } = useBoards();
  const deleteBoardMutation = useDeleteBoard();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<KanbanBoard | null>(null);

  const handleEdit = (board: KanbanBoard) => {
    setEditingBoard(board);
  };

  const handleDelete = (board: KanbanBoard) => {
    setDeletingBoard(board);
  };

  const confirmDelete = () => {
    if (deletingBoard) {
      deleteBoardMutation.mutate(deletingBoard.id, {
        onSettled: () => setDeletingBoard(null),
      });
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load boards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boards</h1>
          <p className="text-muted-foreground">
            Organize your tasks with visual boards
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </div>

      {/* Board Grid */}
      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No boards yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first board to get started
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Board
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <BoardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Dialog */}
      <BoardDialog
        open={!!editingBoard}
        onOpenChange={(open) => !open && setEditingBoard(null)}
        board={editingBoard}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBoard}
        onOpenChange={(open) => !open && setDeletingBoard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBoard?.name}"? This will
              also delete all columns and items in this board. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBoardMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
