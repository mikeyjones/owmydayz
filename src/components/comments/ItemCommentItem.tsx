import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ItemCommentForm } from "./ItemCommentForm";
import { MoreHorizontal, Pencil, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ItemCommentWithUser } from "~/data-access/item-comments";

interface ItemCommentItemProps {
  comment: ItemCommentWithUser;
  currentUserId: string;
  itemId: string;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (content: string, parentCommentId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isReplying?: boolean;
  replies?: ItemCommentWithUser[];
  isLoadingReplies?: boolean;
  onLoadReplies?: (parentCommentId: string) => void;
  replyCount?: number;
  depth?: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ItemCommentItem({
  comment,
  currentUserId,
  itemId,
  onUpdate,
  onDelete,
  onReply,
  isUpdating = false,
  isDeleting = false,
  isReplying = false,
  replies = [],
  isLoadingReplies = false,
  onLoadReplies,
  replyCount = 0,
  depth = 0,
}: ItemCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplyFormOpen, setIsReplyFormOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = comment.userId === currentUserId;
  const hasReplies = replyCount > 0 || replies.length > 0;
  const maxDepth = 3; // Limit nesting depth

  const handleUpdate = (content: string) => {
    onUpdate(comment.id, content);
    setIsEditing(false);
  };

  const handleReply = (content: string) => {
    onReply(content, comment.id);
    setIsReplyFormOpen(false);
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0 && onLoadReplies) {
      onLoadReplies(comment.id);
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-8 pt-3")}>
      <Avatar className="h-8 w-8 shrink-0">
        {comment.user.image && (
          <AvatarImage src={comment.user.image} alt={comment.user.name} />
        )}
        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
          {getInitials(comment.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {comment.updatedAt > comment.createdAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <ItemCommentForm
              initialContent={comment.content}
              onSubmit={handleUpdate}
              isPending={isUpdating}
              isEditing
              onCancel={() => setIsEditing(false)}
              autoFocus
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsReplyFormOpen(!isReplyFormOpen)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={toggleReplies}
                  disabled={isLoadingReplies}
                >
                  {showReplies ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {isLoadingReplies
                    ? "Loading..."
                    : showReplies
                      ? "Hide replies"
                      : `${replyCount || replies.length} ${replyCount === 1 || replies.length === 1 ? "reply" : "replies"}`}
                </Button>
              )}

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(comment.id)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}

        {isReplyFormOpen && (
          <div className="mt-3">
            <ItemCommentForm
              onSubmit={handleReply}
              isPending={isReplying}
              placeholder="Write a reply..."
              onCancel={() => setIsReplyFormOpen(false)}
              autoFocus
            />
          </div>
        )}

        {/* Render replies */}
        {showReplies && replies.length > 0 && (
          <div className="border-l-2 border-muted mt-3">
            {replies.map((reply) => (
              <ItemCommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                itemId={itemId}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onReply={onReply}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                isReplying={isReplying}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
