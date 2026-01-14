import { useQuery } from "@tanstack/react-query";
import {
  completedItemsQueryOptions,
  completionStatsQueryOptions,
  monthlyBreakdownQueryOptions,
} from "~/queries/review";
import type { PeriodType } from "~/data-access/review";

/**
 * Hook to get completed items for a specific time period
 */
export function useCompletedItems(period: PeriodType, enabled = true) {
  return useQuery({
    ...completedItemsQueryOptions(period),
    enabled,
  });
}

/**
 * Hook to get comprehensive completion statistics
 */
export function useCompletionStats(enabled = true) {
  return useQuery({
    ...completionStatsQueryOptions(),
    enabled,
  });
}

/**
 * Hook to get monthly breakdown for year view
 */
export function useMonthlyBreakdown(year?: number, enabled = true) {
  return useQuery({
    ...monthlyBreakdownQueryOptions(year),
    enabled,
  });
}
