// Stub hook - review not yet implemented in Convex
// TODO: Implement review in Convex

export function useReviewItems() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useReviewItem(itemId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useCompletedItems() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useCompletionStats() {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useMonthlyBreakdown() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}
