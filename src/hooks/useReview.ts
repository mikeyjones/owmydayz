// Stub hook - review not yet implemented in Convex
// TODO: Implement review in Convex

import type {
	CompletedItemWithBoard,
	CompletionStats,
	MonthlyBreakdown,
	PeriodType,
} from "~/types";

export function useReviewItems() {
	return {
		data: [] as CompletedItemWithBoard[],
		isLoading: false,
		error: null,
	};
}

export function useReviewItem(_itemId: string) {
	return {
		data: null as CompletedItemWithBoard | null,
		isLoading: false,
		error: null,
	};
}

export function useCompletedItems(_period?: PeriodType) {
	return {
		data: [] as CompletedItemWithBoard[],
		isLoading: false,
		error: null,
	};
}

export function useCompletionStats() {
	return {
		data: null as CompletionStats | null,
		isLoading: false,
		error: null,
	};
}

export function useMonthlyBreakdown() {
	return {
		data: [] as MonthlyBreakdown[],
		isLoading: false,
		error: null,
	};
}
