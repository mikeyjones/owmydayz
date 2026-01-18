// Stub hook - posts not yet implemented in Convex
// TODO: Implement posts in Convex

export function usePosts(category?: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function usePost(postId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useCreatePost() {
	return {
		mutate: async () => {
			console.warn("Posts not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Posts not yet implemented in Convex");
			return null;
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdatePost() {
	return {
		mutate: async () => {
			console.warn("Posts not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Posts not yet implemented in Convex");
			return null;
		},
		isPending: false,
		isError: false,
	};
}

export function useDeletePost() {
	return {
		mutate: async () => {
			console.warn("Posts not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
