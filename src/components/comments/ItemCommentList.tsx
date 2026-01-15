import { ItemCommentForm } from "./ItemCommentForm";
import { ItemCommentItem } from "./ItemCommentItem";
import { MessageSquare } from "lucide-react";
import type { ItemCommentWithUser } from "~/data-access/item-comments";

interface ItemCommentListProps {
  comments: ItemCommentWithUser[];
  currentUserId: string;
  itemId: string;
  isLoading?: boolean;
  onCreateComment: (content: string, parentCommentId?: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onLoadReplies: (parentCommentId: string) => void;
  getReplies: (parentCommentId: string) => ItemCommentWithUser[];
  isLoadingReplies: (parentCommentId: string) => boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ItemCommentList({
  comments,
  currentUserId,
  itemId,
  isLoading = false,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onLoadReplies,
  getReplies,
  isLoadingReplies,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: ItemCommentListProps) {
  const handleCreateComment = (content: string) => {
    onCreateComment(content);
  };

  const handleReply = (content: string, parentCommentId: string) => {
    onCreateComment(content, parentCommentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment form */}
      <ItemCommentForm
        onSubmit={handleCreateComment}
        isPending={isCreating}
        placeholder="Add a comment..."
      />

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4 divide-y">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-4 first:pt-0">
              <ItemCommentItem
                comment={comment}
                currentUserId={currentUserId}
                itemId={itemId}
                onUpdate={onUpdateComment}
                onDelete={onDeleteComment}
                onReply={handleReply}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                isReplying={isCreating}
                replies={getReplies(comment.id)}
                isLoadingReplies={isLoadingReplies(comment.id)}
                onLoadReplies={onLoadReplies}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
