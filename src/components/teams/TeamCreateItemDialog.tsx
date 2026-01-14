import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ItemForm, type ItemFormData } from "~/components/kanban/ItemForm";
import { useCreateTeamItem } from "~/hooks/useTeamBoards";

interface TeamCreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  columnName: string;
}

export function TeamCreateItemDialog({
  open,
  onOpenChange,
  columnId,
  boardId,
  columnName,
}: TeamCreateItemDialogProps) {
  const createItemMutation = useCreateTeamItem();

  const handleSubmit = async (data: ItemFormData) => {
    createItemMutation.mutate(
      {
        columnId,
        boardId,
        name: data.name,
        description: data.description || undefined,
        importance: data.importance,
        effort: data.effort,
        tags: data.tags,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
          <DialogDescription>
            Add a new item to the "{columnName}" column.
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          onSubmit={handleSubmit}
          isPending={createItemMutation.isPending}
          submitLabel="Create Item"
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
