import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2, LayoutDashboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { KanbanBoard } from "~/db/schema";

interface BoardCardProps {
  board: KanbanBoard;
  onEdit: (board: KanbanBoard) => void;
  onDelete: (board: KanbanBoard) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-semibold truncate">
            {board.name}
          </CardTitle>
          {board.description && (
            <CardDescription className="mt-1 line-clamp-2">
              {board.description}
            </CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(board)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(board)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Link
          to="/dashboard/kanban/$boardId"
          params={{ boardId: board.id }}
          className="block"
        >
          <Button variant="outline" className="w-full">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Open Board
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Created {new Date(board.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
