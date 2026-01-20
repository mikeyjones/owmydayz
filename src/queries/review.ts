import { queryOptions } from "@tanstack/react-query";
import {
	getCompletedItemsFn,
	getCompletionStatsFn,
	getMonthlyBreakdownFn,
} from "~/fn/review";
import type { PeriodType } from "~/types/review";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const completedItemsQueryOptions = (period: PeriodType) =>
	queryOptions({
		queryKey: ["review-completed-items", period],
		queryFn: () =>
			getCompletedItemsFn({ data: { period }, headers: getAuthHeaders() }),
	});

export const completionStatsQueryOptions = () =>
	queryOptions({
		queryKey: ["review-stats"],
		queryFn: () => getCompletionStatsFn({ headers: getAuthHeaders() }),
	});

export const monthlyBreakdownQueryOptions = (year?: number) =>
	queryOptions({
		queryKey: ["review-monthly-breakdown", year ?? new Date().getFullYear()],
		queryFn: () =>
			getMonthlyBreakdownFn({ data: { year }, headers: getAuthHeaders() }),
	});
