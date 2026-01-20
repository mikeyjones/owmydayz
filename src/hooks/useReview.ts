import { useQuery } from "convex/react";
import type {
	CompletedItemWithBoard,
	CompletionStats,
	MonthlyBreakdown,
	PeriodType,
} from "~/types";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "./useCurrentUser";

export function useCompletedItems(period?: PeriodType) {
	const { userId } = useCurrentUser();

	const result = useQuery(
		api.kanban.getCompletedItems,
		userId ? { userId, period } : "skip",
	);

	return {
		data: result as CompletedItemWithBoard[] | undefined,
		isLoading: result === undefined,
		error: null,
	};
}

export function useCompletionStats() {
	const { userId } = useCurrentUser();

	const result = useQuery(
		api.kanban.getCompletionStats,
		userId ? { userId } : "skip",
	);

	return {
		data: result as CompletionStats | null | undefined,
		isLoading: result === undefined,
		error: null,
	};
}

export function useMonthlyBreakdown() {
	const { userId } = useCurrentUser();

	const result = useQuery(
		api.kanban.getMonthlyBreakdown,
		userId ? { userId } : "skip",
	);

	return {
		data: result as MonthlyBreakdown[] | undefined,
		isLoading: result === undefined,
		error: null,
	};
}
