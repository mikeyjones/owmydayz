import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { BoardForm, type BoardFormData } from "./BoardForm";
import { useCreateBoard, useUpdateBoard } from "~/hooks/useKanban";
import type { KanbanBoard } from "~/types";

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Board to edit. If null/undefined, dialog is in create mode */
  board?: KanbanBoard | null;
}

export function BoardDialog({
  open,
  onOpenChange,
  board,
}: BoardDialogProps) {
  const createBoardMutation = useCreateBoard();
  const updateBoardMutation = useUpdateBoard();

  const isEditMode = !!board;
  const mutation = isEditMode ? updateBoardMutation : createBoardMutation;

  const defaultValues = isEditMode
    ? {
        name: board.name,
        description: board.description || "",
        focusMode: board.focusMode,
      }
    : undefined;

  const handleSubmit = async (data: BoardFormData) => {
    if (isEditMode) {
      updateBoardMutation.mutate(
        { id: board.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createBoardMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Board" : "Create Board"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the board details."
              : "Create a new board to organize your tasks."}
          </DialogDescription>
        </DialogHeader>
        <BoardForm
          key={isEditMode ? board.id : "create"}
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
