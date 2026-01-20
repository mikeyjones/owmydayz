import { FileText, MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { ItemCommentList } from "~/components/comments";
import { ItemForm, type ItemFormData } from "~/components/kanban/ItemForm";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	useCreateTeamItemComment,
	useDeleteTeamItemComment,
	useTeamItemComments,
	useUpdateTeamItemComment,
} from "~/hooks/useItemComments";
import { useUpdateTeamItem } from "~/hooks/useTeamBoards";
// TODO: Implement comment replies in Convex
import { authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";
import type { ItemCommentWithUser, TeamItem } from "~/types";

interface TeamEditItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: TeamItem | null;
	boardId: string;
}

type Tab = "details" | "comments";

export function TeamEditItemDialog({
	open,
	onOpenChange,
	item,
	boardId,
}: TeamEditItemDialogProps) {
	const [activeTab, setActiveTab] = useState<Tab>("details");
	const [repliesCache, _setRepliesCache] = useState<
		Record<string, ItemCommentWithUser[]>
	>({});
	const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
		{},
	);

	const { data: session } = authClient.useSession();
	const updateItemMutation = useUpdateTeamItem();

	// Comments hooks
	const { data: comments = [], isLoading: isLoadingComments } =
		useTeamItemComments(item?.id || "");

	const createCommentMutation = useCreateTeamItemComment();
	const updateCommentMutation = useUpdateTeamItemComment();
	const deleteCommentMutation = useDeleteTeamItemComment();

	const handleSubmit = async (data: ItemFormData) => {
		if (!item) return;

		try {
			await updateItemMutation.mutate({
				id: item.id,
				name: data.name,
				description: data.description || undefined,
				importance: data.importance,
				effort: data.effort,
				tags: data.tags,
				boardId,
			} as Parameters<typeof updateItemMutation.mutate>[0]);
			onOpenChange(false);
		} catch {
			// Error already handled in mutation
		}
	};

	const handleLoadReplies = useCallback(async (parentCommentId: string) => {
		// TODO: Implement comment replies in Convex
		console.warn("Comment replies not yet implemented in Convex");
		setLoadingReplies((prev) => ({ ...prev, [parentCommentId]: false }));
	}, []);

	const handleCreateComment = useCallback(
		async (_content: string, parentCommentId?: string) => {
			if (!item) return;
			// TODO: Implement when item comments are available in Convex
			await createCommentMutation.mutate();
			// Refresh replies cache if this was a reply
			if (parentCommentId) {
				handleLoadReplies(parentCommentId);
			}
		},
		[item, createCommentMutation, handleLoadReplies],
	);

	const handleUpdateComment = useCallback(
		(_commentId: string, _content: string) => {
			if (!item) return;
			// TODO: Implement when item comments are available in Convex
			updateCommentMutation.mutate();
		},
		[item, updateCommentMutation],
	);

	const handleDeleteComment = useCallback(
		(_commentId: string) => {
			if (!item) return;
			// TODO: Implement when item comments are available in Convex
			deleteCommentMutation.mutate();
		},
		[item, deleteCommentMutation],
	);

	const getReplies = useCallback(
		(parentCommentId: string) => {
			return repliesCache[parentCommentId] || [];
		},
		[repliesCache],
	);

	const isLoadingRepliesFor = useCallback(
		(parentCommentId: string) => {
			return loadingReplies[parentCommentId] || false;
		},
		[loadingReplies],
	);

	if (!item) return null;

	const currentUserId = session?.user?.id || "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{item.name}</DialogTitle>
					<DialogDescription>
						View and edit item details or add comments.
					</DialogDescription>
				</DialogHeader>

				{/* Tab buttons */}
				<div className="flex border-b">
					<Button
						variant="ghost"
						className={cn(
							"flex-1 rounded-none border-b-2 border-transparent",
							activeTab === "details" && "border-primary text-primary",
						)}
						onClick={() => setActiveTab("details")}
					>
						<FileText className="h-4 w-4 mr-2" />
						Details
					</Button>
					<Button
						variant="ghost"
						className={cn(
							"flex-1 rounded-none border-b-2 border-transparent",
							activeTab === "comments" && "border-primary text-primary",
						)}
						onClick={() => setActiveTab("comments")}
					>
						<MessageSquare className="h-4 w-4 mr-2" />
						Comments
					</Button>
				</div>

				{/* Tab content */}
				<div className="flex-1 overflow-y-auto min-h-0">
					{activeTab === "details" ? (
						<div className="pt-4">
							<ItemForm
								defaultValues={{
									name: item.name,
									description: item.description || "",
									importance:
										(item.importance as "low" | "medium" | "high") || "medium",
									effort:
										(item.effort as "small" | "medium" | "big") || "medium",
									tags: item.tags || [],
								}}
								onSubmit={handleSubmit}
								isPending={updateItemMutation.isPending}
								submitLabel="Save Changes"
								onCancel={() => onOpenChange(false)}
							/>
						</div>
					) : (
						<div className="pt-4">
							<ItemCommentList
								comments={comments}
								currentUserId={currentUserId}
								itemId={item.id}
								isLoading={isLoadingComments}
								onCreateComment={handleCreateComment}
								onUpdateComment={handleUpdateComment}
								onDeleteComment={handleDeleteComment}
								onLoadReplies={handleLoadReplies}
								getReplies={getReplies}
								isLoadingReplies={isLoadingRepliesFor}
								isCreating={createCommentMutation.isPending}
								isUpdating={updateCommentMutation.isPending}
								isDeleting={deleteCommentMutation.isPending}
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
