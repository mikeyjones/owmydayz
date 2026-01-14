import { queryOptions } from "@tanstack/react-query";
import {
  getCompletedItemsFn,
  getCompletionStatsFn,
  getMonthlyBreakdownFn,
} from "~/fn/review";
import type { PeriodType } from "~/data-access/review";

export const completedItemsQueryOptions = (period: PeriodType) =>
  queryOptions({
    queryKey: ["review-completed-items", period],
    queryFn: () => getCompletedItemsFn({ data: { period } }),
  });

export const completionStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["review-stats"],
    queryFn: () => getCompletionStatsFn(),
  });

export const monthlyBreakdownQueryOptions = (year?: number) =>
  queryOptions({
    queryKey: ["review-monthly-breakdown", year ?? new Date().getFullYear()],
    queryFn: () => getMonthlyBreakdownFn({ data: { year } }),
  });
