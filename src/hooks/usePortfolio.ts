// Stub hook - portfolio not yet implemented in Convex
// TODO: Implement portfolio in Convex

export function usePortfolioItems() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function usePortfolioItem(_itemId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useCreatePortfolioItem() {
	return {
		mutate: async () => {
			console.warn("Portfolio not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Portfolio not yet implemented in Convex");
			return null;
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdatePortfolioItem() {
	return {
		mutate: async () => {
			console.warn("Portfolio not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeletePortfolioItem() {
	return {
		mutate: async () => {
			console.warn("Portfolio not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
