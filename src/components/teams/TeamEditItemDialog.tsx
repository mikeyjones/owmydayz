import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ItemForm, type ItemFormData } from "~/components/kanban/ItemForm";
import { useUpdateTeamItem } from "~/hooks/useTeamBoards";
import type { TeamItem } from "~/db/schema";

interface TeamEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TeamItem | null;
  boardId: string;
}

export function TeamEditItemDialog({
  open,
  onOpenChange,
  item,
  boardId,
}: TeamEditItemDialogProps) {
  const updateItemMutation = useUpdateTeamItem();

  const handleSubmit = async (data: ItemFormData) => {
    if (!item) return;

    updateItemMutation.mutate(
      {
        id: item.id,
        name: data.name,
        description: data.description || undefined,
        importance: data.importance,
        effort: data.effort,
        tags: data.tags,
        boardId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of this item.
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          defaultValues={{
            name: item.name,
            description: item.description || "",
            importance: (item.importance as "low" | "medium" | "high") || "medium",
            effort: (item.effort as "small" | "medium" | "big") || "medium",
            tags: item.tags || [],
          }}
          onSubmit={handleSubmit}
          isPending={updateItemMutation.isPending}
          submitLabel="Save Changes"
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
