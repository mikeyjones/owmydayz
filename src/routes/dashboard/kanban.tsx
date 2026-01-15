import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, LayoutGrid, Loader2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { KanbanBoard, CreateBoardDialog } from "~/components/kanban";
import { useBoards, useDeleteBoard } from "~/hooks/useKanban";
import type { KanbanBoard as KanbanBoardType } from "~/types";

export const Route = createFileRoute("/dashboard/kanban")({
  component: KanbanPage,
});

function KanbanPage() {
  const { data: boards, isLoading, error } = useBoards();
  const deleteBoardMutation = useDeleteBoard();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [createBoardDialog, setCreateBoardDialog] = useState(false);

  const handleBoardCreated = (boardId: string) => {
    setSelectedBoardId(boardId);
  };

  const handleDeleteBoard = (boardId: string) => {
    deleteBoardMutation.mutate(boardId, {
      onSuccess: () => {
        if (selectedBoardId === boardId) {
          setSelectedBoardId(null);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load boards</p>
        </div>
      </div>
    );
  }

  // If a board is selected, show the board view
  if (selectedBoardId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedBoardId(null)}
          >
            &larr; Back to Boards
          </Button>
        </div>
        <KanbanBoard boardId={selectedBoardId} />
      </div>
    );
  }

  // Show the board list view
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Boards
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your tasks and projects with boards.
            </p>
          </div>
          <Button onClick={() => setCreateBoardDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Board
          </Button>
        </div>

        {boards && boards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onSelect={() => setSelectedBoardId(board.id)}
                onDelete={() => handleDeleteBoard(board.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first board to start organizing your tasks.
              </p>
              <Button onClick={() => setCreateBoardDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Board
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateBoardDialog
        open={createBoardDialog}
        onOpenChange={setCreateBoardDialog}
        onSuccess={handleBoardCreated}
      />
    </div>
  );
}

interface BoardCardProps {
  board: KanbanBoardType;
  onSelect: () => void;
  onDelete: () => void;
}

function BoardCard({ board, onSelect, onDelete }: BoardCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{board.name}</CardTitle>
            {board.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {board.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4 mr-1" />
          <span>
            Created {new Date(board.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
