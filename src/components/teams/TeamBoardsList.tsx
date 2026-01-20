import { LayoutDashboard, Plus } from "lucide-react";
import { useState } from "react";
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
import { Button } from "~/components/ui/button";
import { useDeleteTeamBoard, useTeamBoards } from "~/hooks/useTeamBoards";
import type { TeamBoard } from "~/types";
import { TeamBoardCard } from "./TeamBoardCard";
import { TeamBoardDialog } from "./TeamBoardDialog";

interface TeamBoardsListProps {
	teamId: string;
}

export function TeamBoardsList({ teamId }: TeamBoardsListProps) {
	const { data: boards, isLoading, error } = useTeamBoards(teamId);
	const deleteBoardMutation = useDeleteTeamBoard();

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingBoard, setEditingBoard] = useState<TeamBoard | null>(null);
	const [deletingBoard, setDeletingBoard] = useState<TeamBoard | null>(null);

	const handleEdit = (board: TeamBoard) => {
		setEditingBoard(board);
	};

	const handleDelete = (board: TeamBoard) => {
		setDeletingBoard(board);
	};

	const confirmDelete = async () => {
		if (deletingBoard) {
			await deleteBoardMutation.mutate({ id: deletingBoard.id, teamId });
			setDeletingBoard(null);
		}
	};

	if (isLoading) {
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
					<h2 className="text-xl font-semibold">Team Boards</h2>
					<p className="text-sm text-muted-foreground">
						Shared boards visible to all team members
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
					{boards.map((board: TeamBoard) => (
						<TeamBoardCard
							key={board.id}
							board={board}
							teamId={teamId}
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
						Create your first team board to get started
					</p>
					<Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create Board
					</Button>
				</div>
			)}

			{/* Create Dialog */}
			<TeamBoardDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				teamId={teamId}
			/>

			{/* Edit Dialog */}
			<TeamBoardDialog
				open={!!editingBoard}
				onOpenChange={(open) => !open && setEditingBoard(null)}
				teamId={teamId}
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
