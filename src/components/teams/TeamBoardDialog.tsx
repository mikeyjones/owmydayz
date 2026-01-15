import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { TeamBoardForm, type TeamBoardFormData } from "./TeamBoardForm";
import { useCreateTeamBoard, useUpdateTeamBoard } from "~/hooks/useTeamBoards";
import type { TeamBoard } from "~/db/schema";

interface TeamBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  /** Board to edit. If null/undefined, dialog is in create mode */
  board?: TeamBoard | null;
}

export function TeamBoardDialog({
  open,
  onOpenChange,
  teamId,
  board,
}: TeamBoardDialogProps) {
  const createBoardMutation = useCreateTeamBoard();
  const updateBoardMutation = useUpdateTeamBoard();

  const isEditMode = !!board;
  const mutation = isEditMode ? updateBoardMutation : createBoardMutation;

  const defaultValues = isEditMode
    ? {
        name: board.name,
        description: board.description || "",
        focusMode: board.focusMode,
      }
    : undefined;

  const handleSubmit = async (data: TeamBoardFormData) => {
    if (isEditMode) {
      updateBoardMutation.mutate(
        { id: board.id, teamId, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createBoardMutation.mutate(
        { teamId, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
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
              : "Create a new board for your team."}
          </DialogDescription>
        </DialogHeader>
        <TeamBoardForm
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
