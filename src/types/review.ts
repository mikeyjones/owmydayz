// =====================================================
// Review Types
// =====================================================

export type PeriodType = "today" | "week" | "month" | "all" | "day" | "year";

export type CompletedItemWithBoard = {
	_id: string;
	columnId: string;
	boardId: string;
	name: string;
	description?: string;
	importance: string;
	effort: string;
	tags: string[];
	position: number;
	completedAt: number;
	createdAt: number;
	updatedAt: number;
	boardName: string;
};

export type ReviewStats = {
	totalCompleted: number;
	byImportance: {
		low: number;
		medium: number;
		high: number;
	};
	byEffort: {
		small: number;
		medium: number;
		big: number;
	};
};

export type CompletionStats = {
	totalCompleted: number;
	currentStreak: number;
	longestStreak: number;
	completedThisMonth: number;
	milestones: {
		reached: number[];
		next?: number;
	};
};

export type MonthlyBreakdown = {
	month: number;
	count: number;
};
