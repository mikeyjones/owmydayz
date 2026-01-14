import { eq, and, gte, lte, desc, sql, isNotNull } from "drizzle-orm";
import { database } from "~/db";
import { kanbanItem, kanbanBoard, kanbanColumn } from "~/db/schema";

// =====================================================
// Types
// =====================================================

export type CompletedItemWithBoard = {
  id: string;
  name: string;
  description: string | null;
  importance: string;
  effort: string;
  tags: string[] | null;
  completedAt: Date;
  boardId: string;
  boardName: string;
};

export type CompletionStats = {
  totalCompleted: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  completedThisYear: number;
  currentStreak: number;
  longestStreak: number;
  milestones: {
    reached: number[];
    next: number | null;
  };
};

export type PeriodType = "day" | "week" | "month" | "year";

// Milestone thresholds
const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

// =====================================================
// Helper Functions
// =====================================================

function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfWeek(date: Date = new Date()): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(date: Date = new Date()): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfMonth(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfMonth(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfYear(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfYear(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setMonth(11, 31);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getDateRangeForPeriod(period: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "day":
      return { start: getStartOfDay(now), end: getEndOfDay(now) };
    case "week":
      return { start: getStartOfWeek(now), end: getEndOfWeek(now) };
    case "month":
      return { start: getStartOfMonth(now), end: getEndOfMonth(now) };
    case "year":
      return { start: getStartOfYear(now), end: getEndOfYear(now) };
  }
}

// =====================================================
// Query Functions
// =====================================================

/**
 * Find all completed items for a user within a date range
 */
export async function findCompletedItemsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CompletedItemWithBoard[]> {
  const results = await database
    .select({
      id: kanbanItem.id,
      name: kanbanItem.name,
      description: kanbanItem.description,
      importance: kanbanItem.importance,
      effort: kanbanItem.effort,
      tags: kanbanItem.tags,
      completedAt: kanbanItem.completedAt,
      boardId: kanbanBoard.id,
      boardName: kanbanBoard.name,
    })
    .from(kanbanItem)
    .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
    .where(
      and(
        eq(kanbanBoard.userId, userId),
        isNotNull(kanbanItem.completedAt),
        gte(kanbanItem.completedAt, startDate),
        lte(kanbanItem.completedAt, endDate)
      )
    )
    .orderBy(desc(kanbanItem.completedAt));

  return results.map((item) => ({
    ...item,
    completedAt: item.completedAt!,
  }));
}

/**
 * Find completed items for a specific period
 */
export async function findCompletedItemsByPeriod(
  userId: string,
  period: PeriodType
): Promise<CompletedItemWithBoard[]> {
  const { start, end } = getDateRangeForPeriod(period);
  return findCompletedItemsByDateRange(userId, start, end);
}

/**
 * Get count of items completed on a specific date
 */
async function getCompletedCountForDate(userId: string, date: Date): Promise<number> {
  const start = getStartOfDay(date);
  const end = getEndOfDay(date);

  const result = await database
    .select({ count: sql<number>`count(*)` })
    .from(kanbanItem)
    .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
    .where(
      and(
        eq(kanbanBoard.userId, userId),
        isNotNull(kanbanItem.completedAt),
        gte(kanbanItem.completedAt, start),
        lte(kanbanItem.completedAt, end)
      )
    );

  return Number(result[0]?.count ?? 0);
}

/**
 * Calculate the current streak (consecutive days with completions)
 */
async function calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
  // Get all distinct completion dates
  const completionDates = await database
    .select({
      date: sql<string>`DATE(${kanbanItem.completedAt})`,
    })
    .from(kanbanItem)
    .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
    .where(
      and(
        eq(kanbanBoard.userId, userId),
        isNotNull(kanbanItem.completedAt)
      )
    )
    .groupBy(sql`DATE(${kanbanItem.completedAt})`)
    .orderBy(desc(sql`DATE(${kanbanItem.completedAt})`));

  if (completionDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const dates = completionDates.map((d) => new Date(d.date));
  const today = getStartOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  // Check if streak is still active (completed today or yesterday)
  const mostRecentCompletion = getStartOfDay(dates[0]);
  const streakIsActive =
    mostRecentCompletion.getTime() === today.getTime() ||
    mostRecentCompletion.getTime() === yesterday.getTime();

  for (const date of dates) {
    const currentDate = getStartOfDay(date);

    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.floor(
        (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    lastDate = currentDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  currentStreak = streakIsActive ? tempStreak : 0;

  // If completed today, start counting from today
  if (mostRecentCompletion.getTime() === today.getTime()) {
    currentStreak = tempStreak;
  }

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get comprehensive completion statistics for a user
 */
export async function getCompletionStats(userId: string): Promise<CompletionStats> {
  const now = new Date();

  // Get counts for different periods in parallel
  const [
    totalResult,
    todayCount,
    weekCount,
    monthCount,
    yearCount,
    streakData,
  ] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(kanbanItem)
      .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
      .where(
        and(
          eq(kanbanBoard.userId, userId),
          isNotNull(kanbanItem.completedAt)
        )
      ),
    getCompletedCountForDate(userId, now),
    findCompletedItemsByPeriod(userId, "week").then((items) => items.length),
    findCompletedItemsByPeriod(userId, "month").then((items) => items.length),
    findCompletedItemsByPeriod(userId, "year").then((items) => items.length),
    calculateStreak(userId),
  ]);

  const totalCompleted = Number(totalResult[0]?.count ?? 0);

  // Calculate milestones
  const reachedMilestones = MILESTONES.filter((m) => totalCompleted >= m);
  const nextMilestone = MILESTONES.find((m) => totalCompleted < m) ?? null;

  return {
    totalCompleted,
    completedToday: todayCount,
    completedThisWeek: weekCount,
    completedThisMonth: monthCount,
    completedThisYear: yearCount,
    currentStreak: streakData.current,
    longestStreak: streakData.longest,
    milestones: {
      reached: reachedMilestones,
      next: nextMilestone,
    },
  };
}

/**
 * Get monthly breakdown for year view
 */
export async function getMonthlyBreakdown(
  userId: string,
  year: number = new Date().getFullYear()
): Promise<{ month: number; count: number }[]> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const results = await database
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${kanbanItem.completedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(kanbanItem)
    .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
    .where(
      and(
        eq(kanbanBoard.userId, userId),
        isNotNull(kanbanItem.completedAt),
        gte(kanbanItem.completedAt, startOfYear),
        lte(kanbanItem.completedAt, endOfYear)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${kanbanItem.completedAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${kanbanItem.completedAt})`);

  // Fill in missing months with 0
  const monthlyData: { month: number; count: number }[] = [];
  for (let month = 1; month <= 12; month++) {
    const found = results.find((r) => Number(r.month) === month);
    monthlyData.push({
      month,
      count: found ? Number(found.count) : 0,
    });
  }

  return monthlyData;
}
