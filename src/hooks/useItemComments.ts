// Stub hook - item comments not yet implemented in Convex
// TODO: Implement item comments in Convex

export function useItemComments(itemId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useItemCommentCount(itemId: string) {
	return {
		data: 0,
		isLoading: false,
		error: null,
	};
}

export function useCreateItemComment() {
	return {
		mutate: async () => {
			console.warn("Item comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateItemComment() {
	return {
		mutate: async () => {
			console.warn("Item comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteItemComment() {
	return {
		mutate: async () => {
			console.warn("Item comments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

// Aliases for kanban item comments
export const useKanbanItemComments = useItemComments;
export const useKanbanItemCommentCount = useItemCommentCount;
export const useCreateKanbanItemComment = useCreateItemComment;
export const useUpdateKanbanItemComment = useUpdateItemComment;
export const useDeleteKanbanItemComment = useDeleteItemComment;

// Replies stub
export function useKanbanItemCommentReplies(parentCommentId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

// Aliases for team item comments
export const useTeamItemComments = useItemComments;
export const useTeamItemCommentCount = useItemCommentCount;
export const useCreateTeamItemComment = useCreateItemComment;
export const useUpdateTeamItemComment = useUpdateItemComment;
export const useDeleteTeamItemComment = useDeleteItemComment;

// Team replies stub
export function useTeamItemCommentReplies(parentCommentId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}
