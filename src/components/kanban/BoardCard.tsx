import { useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { KanbanBoard } from "~/types";

interface BoardCardProps {
	board: KanbanBoard;
	onEdit: (board: KanbanBoard) => void;
	onDelete: (board: KanbanBoard) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
	const navigate = useNavigate();
	const boardId = String(board._id);

	const handleCardClick = () => {
		navigate({ to: "/dashboard/kanban/$boardId", params: { boardId } });
	};

	return (
		<Card
			className="group hover:shadow-md transition-shadow cursor-pointer"
			onClick={handleCardClick}
		>
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
					<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onEdit(board);
							}}
						>
							<Pencil className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onDelete(board);
							}}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-center gap-2 text-muted-foreground">
					<LayoutDashboard className="h-4 w-4" />
					<span className="text-sm">Click to open</span>
				</div>
				<p className="text-xs text-muted-foreground mt-3 text-center">
					Created {new Date(board.createdAt).toLocaleDateString()}
				</p>
			</CardContent>
		</Card>
	);
}
