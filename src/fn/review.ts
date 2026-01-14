import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  findCompletedItemsByPeriod,
  getCompletionStats,
  getMonthlyBreakdown,
  type PeriodType,
} from "~/data-access/review";

// =====================================================
// Review Server Functions
// =====================================================

const periodSchema = z.enum(["day", "week", "month", "year"]);

/**
 * Get completed items for a specific time period
 */
export const getCompletedItemsFn = createServerFn()
  .inputValidator(z.object({ period: periodSchema }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    return await findCompletedItemsByPeriod(context.userId, data.period as PeriodType);
  });

/**
 * Get comprehensive completion statistics
 */
export const getCompletionStatsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await getCompletionStats(context.userId);
  });

/**
 * Get monthly breakdown for year view
 */
export const getMonthlyBreakdownFn = createServerFn()
  .inputValidator(z.object({ year: z.number().optional() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    return await getMonthlyBreakdown(context.userId, data.year);
  });
