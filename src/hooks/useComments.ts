// Stub hook - comments not yet implemented in Convex
// TODO: Implement comments in Convex

export function usePostComments(_postId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useCreateComment() {
	return {
		mutate: async () => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateComment() {
	return {
		mutate: async () => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteComment() {
	return {
		mutate: async () => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useLikeComment() {
	return {
		mutate: async () => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUnlikeComment() {
	return {
		mutate: async () => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useCommentLikeStatus(_commentId: string) {
	return {
		data: { isLiked: false, likeCount: 0 },
		isLoading: false,
		error: null,
	};
}

export function useCommentReplies(_commentId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}
