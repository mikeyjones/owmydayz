import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Send, X } from "lucide-react";

interface ItemCommentFormProps {
  onSubmit: (content: string) => void;
  isPending?: boolean;
  placeholder?: string;
  initialContent?: string;
  isEditing?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ItemCommentForm({
  onSubmit,
  isPending = false,
  placeholder = "Write a comment...",
  initialContent = "",
  isEditing = false,
  onCancel,
  autoFocus = false,
}: ItemCommentFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      if (!isEditing) {
        setContent("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] text-sm resize-none"
        disabled={isPending}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isPending}
        >
          <Send className="h-4 w-4 mr-1" />
          {isEditing ? "Update" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
