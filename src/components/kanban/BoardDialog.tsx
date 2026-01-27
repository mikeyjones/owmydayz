import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useCreateBoard, useUpdateBoard } from "~/hooks/useKanban";
import type { KanbanBoard } from "~/types";
import { BoardForm, type BoardFormData } from "./BoardForm";

interface BoardDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Board to edit. If null/undefined, dialog is in create mode */
	board?: KanbanBoard | null;
}

export function BoardDialog({ open, onOpenChange, board }: BoardDialogProps) {
	const createBoardMutation = useCreateBoard();
	const updateBoardMutation = useUpdateBoard();

	const isEditMode = !!board;
	const mutation = isEditMode ? updateBoardMutation : createBoardMutation;

	const defaultValues = isEditMode
		? {
				name: board.name,
				description: board.description || "",
				focusMode: board.focusMode,
				clockifyDefaultClientId: board.clockifyDefaultClientId || undefined,
				clockifyDefaultProjectId: board.clockifyDefaultProjectId || undefined,
			}
		: undefined;

	const handleSubmit = async (data: BoardFormData) => {
		// Convert "__none__" to undefined for Clockify fields
		const processedData = {
			...data,
			clockifyDefaultClientId:
				!data.clockifyDefaultClientId ||
				data.clockifyDefaultClientId === "__none__"
					? undefined
					: data.clockifyDefaultClientId,
			clockifyDefaultProjectId:
				!data.clockifyDefaultProjectId ||
				data.clockifyDefaultProjectId === "__none__"
					? undefined
					: data.clockifyDefaultProjectId,
		};

		if (isEditMode) {
			updateBoardMutation.mutate(
				{ id: board._id, ...processedData },
				{ onSuccess: () => onOpenChange(false) },
			);
		} else {
			createBoardMutation.mutate(processedData, {
				onSuccess: () => onOpenChange(false),
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Board" : "Create Board"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the board details."
							: "Create a new board to organize your tasks."}
					</DialogDescription>
				</DialogHeader>
				<BoardForm
					key={isEditMode ? board._id : "create"}
					defaultValues={defaultValues}
					onSubmit={handleSubmit}
					isPending={mutation.isPending}
					submitLabel={isEditMode ? "Save Changes" : "Create Board"}
					onCancel={() => onOpenChange(false)}
					cancelLabel="Cancel"
				/>
			</DialogContent>
		</Dialog>
	);
}
