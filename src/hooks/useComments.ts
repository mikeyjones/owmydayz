// Stub hook - comments not yet implemented in Convex
// TODO: Implement comments in Convex

import type { CommentWithUser } from "~/types";

export function usePostComments(_postId: string) {
	return {
		data: [] as CommentWithUser[],
		isLoading: false,
		error: null,
	};
}

export function useCreateComment() {
	return {
		mutate: async (_data: unknown, _options?: unknown) => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateComment() {
	return {
		mutate: async (_data: unknown, _options?: unknown) => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteComment() {
	return {
		mutate: async (_data: unknown, _options?: unknown) => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useLikeComment() {
	return {
		mutate: async (_commentId: unknown) => {
			console.warn("Comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUnlikeComment() {
	return {
		mutate: async (_commentId: unknown) => {
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
		data: [] as CommentWithUser[],
		isLoading: false,
		error: null,
	};
}
