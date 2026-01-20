// Stub functions - reactions not yet implemented in Convex
// TODO: Implement reactions server functions

export async function getCommentLikeCountFn(_args: any) {
	console.warn("Comment like count not yet implemented");
	return 0;
}

export async function getCommentReactionStatusFn(_args: any) {
	console.warn("Comment reaction status not yet implemented");
	return { isLiked: false };
}

export async function getPostLikeCountFn(_args: any) {
	console.warn("Post like count not yet implemented");
	return 0;
}

export async function getPostReactionStatusFn(_args: any) {
	console.warn("Post reaction status not yet implemented");
	return { isLiked: false };
}
