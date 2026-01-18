import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useCreateBoard } from "~/hooks/useKanban";
import { BoardForm, type BoardFormData } from "./BoardForm";

interface CreateBoardDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (boardId: string) => void;
}

export function CreateBoardDialog({
	open,
	onOpenChange,
	onSuccess,
}: CreateBoardDialogProps) {
	const createBoardMutation = useCreateBoard();

	const handleSubmit = async (data: BoardFormData) => {
		createBoardMutation.mutate(
			{
				name: data.name,
				description: data.description || undefined,
			},
			{
				onSuccess: (newBoard) => {
					onOpenChange(false);
					onSuccess?.(newBoard.id);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create New Board</DialogTitle>
					<DialogDescription>
						Create a new board to organize your tasks.
					</DialogDescription>
				</DialogHeader>
				<BoardForm
					onSubmit={handleSubmit}
					isPending={createBoardMutation.isPending}
					submitLabel="Create Board"
					onCancel={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
