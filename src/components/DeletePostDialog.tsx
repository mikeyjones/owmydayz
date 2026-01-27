import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useDeletePost } from "~/hooks/usePosts";
import type { PostWithUser } from "~/types";

interface DeletePostDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	post: PostWithUser | null;
}

export function DeletePostDialog({
	open,
	onOpenChange,
	post,
}: DeletePostDialogProps) {
	const deletePostMutation = useDeletePost();

	const handleDelete = async () => {
		if (post) {
			try {
				await deletePostMutation.mutate();
				onOpenChange(false);
			} catch (error) {
				// Error already handled by mutation
			}
		}
	};

	const postTitle = post?.title || "this post";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Post</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{postTitle}"? This action cannot be
						undone and will permanently remove the post from the community.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={deletePostMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deletePostMutation.isPending}
					>
						{deletePostMutation.isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
