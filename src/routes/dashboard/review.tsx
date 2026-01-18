import { createFileRoute } from "@tanstack/react-router";
import {
	Award,
	Calendar,
	CheckCircle2,
	Flame,
	Loader2,
	Sparkles,
	Star,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useState } from "react";
import {
	useCompletedItems,
	useCompletionStats,
	useMonthlyBreakdown,
} from "~/hooks/useReview";
import { cn } from "~/lib/utils";
import type { CompletedItemWithBoard, PeriodType } from "~/types";

export const Route = createFileRoute("/dashboard/review")({
	component: ReviewPage,
});

// Motivational messages based on completion count
const getMotivationalMessage = (count: number, period: PeriodType): string => {
	if (count === 0) {
		const messages: Record<PeriodType, string> = {
			day: "Today's a fresh start! Complete your first task to begin.",
			week: "A new week means new opportunities. Let's make it count!",
			month: "This month is full of potential. Start your journey!",
			year: "Every achievement starts with a single step.",
		};
		return messages[period];
	}

	if (period === "day") {
		if (count >= 10) return "You're on fire today! Absolutely crushing it! 🔥";
		if (count >= 5) return "Fantastic progress! Keep the momentum going!";
		if (count >= 3) return "Great work! You're building something amazing.";
		return "Nice start! Every task completed is a step forward.";
	}

	if (period === "week") {
		if (count >= 30) return "What a productive week! You're unstoppable!";
		if (count >= 15) return "Impressive dedication this week!";
		if (count >= 7) return "Solid week of progress. Well done!";
		return "Good start to the week!";
	}

	if (period === "month") {
		if (count >= 100) return "Legendary month! Your consistency is inspiring!";
		if (count >= 50) return "Outstanding month of achievements!";
		if (count >= 25) return "A month to be proud of!";
		return "Building great habits this month!";
	}

	// year
	if (count >= 500) return "What an incredible year of achievements!";
	if (count >= 200) return "You've accomplished so much this year!";
	if (count >= 100) return "A year of meaningful progress!";
	return "Every completion adds up. Keep going!";
};

// Period labels
const periodLabels: Record<PeriodType, string> = {
	day: "Today",
	week: "This Week",
	month: "This Month",
	year: "This Year",
};

// Month names for year view
const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function ReviewPage() {
	const [period, setPeriod] = useState<PeriodType>("day");

	const { data: items, isLoading: itemsLoading } = useCompletedItems(period);
	const { data: stats, isLoading: statsLoading } = useCompletionStats();
	const { data: monthlyData, isLoading: monthlyLoading } =
		useMonthlyBreakdown();

	const isLoading = itemsLoading || statsLoading;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const itemCount = items?.length || 0;
	const motivationalMessage = getMotivationalMessage(itemCount, period);

	// Group items by date for display
	const groupedItems = items?.reduce(
		(acc, item) => {
			const dateKey = new Date(item.completedAt).toLocaleDateString("en-US", {
				weekday: "long",
				month: "short",
				day: "numeric",
			});
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(item);
			return acc;
		},
		{} as Record<string, CompletedItemWithBoard[]>,
	);

	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
						<Trophy className="h-6 w-6 text-amber-400" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
						Your Achievements
					</h1>
				</div>
				<p className="text-muted-foreground">{motivationalMessage}</p>
			</div>

			{/* Stats Cards */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
					<StatsCard
						icon={<CheckCircle2 className="h-5 w-5" />}
						label="Total Completed"
						value={stats.totalCompleted}
						gradient="from-emerald-500/20 to-teal-500/20"
						iconColor="text-emerald-400"
					/>
					<StatsCard
						icon={<Flame className="h-5 w-5" />}
						label="Current Streak"
						value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`}
						gradient="from-orange-500/20 to-red-500/20"
						iconColor="text-orange-400"
						highlight={stats.currentStreak >= 7}
					/>
					<StatsCard
						icon={<TrendingUp className="h-5 w-5" />}
						label="Longest Streak"
						value={`${stats.longestStreak} day${stats.longestStreak !== 1 ? "s" : ""}`}
						gradient="from-blue-500/20 to-indigo-500/20"
						iconColor="text-blue-400"
					/>
					<StatsCard
						icon={<Calendar className="h-5 w-5" />}
						label="This Month"
						value={stats.completedThisMonth}
						gradient="from-purple-500/20 to-pink-500/20"
						iconColor="text-purple-400"
					/>
				</div>
			)}

			{/* Milestones */}
			{stats && stats.milestones.reached.length > 0 && (
				<div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
					<div className="flex items-center gap-2 mb-3">
						<Award className="h-5 w-5 text-amber-400" />
						<span className="font-semibold text-amber-300">
							Milestones Reached
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{stats.milestones.reached.map((milestone) => (
							<MilestoneBadge key={milestone} count={milestone} />
						))}
						{stats.milestones.next && (
							<div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/40">
								<Sparkles className="h-3 w-3" />
								Next: {stats.milestones.next}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Period Tabs */}
			<div className="flex gap-2 mb-6 p-1 rounded-lg bg-white/5 border border-white/10">
				{(["day", "week", "month", "year"] as PeriodType[]).map((p) => (
					<button
						key={p}
						onClick={() => setPeriod(p)}
						className={cn(
							"flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
							period === p
								? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30"
								: "text-white/50 hover:text-white/80 hover:bg-white/5",
						)}
					>
						{periodLabels[p]}
					</button>
				))}
			</div>

			{/* Year View - Monthly Breakdown */}
			{period === "year" && monthlyData && !monthlyLoading && (
				<div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
					<h3 className="text-sm font-semibold text-white/60 mb-4">
						Monthly Breakdown
					</h3>
					<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
						{monthlyData.map((data) => (
							<div
								key={data.month}
								className={cn(
									"p-3 rounded-lg text-center transition-all",
									data.count > 0
										? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
										: "bg-white/5 border border-white/5",
								)}
							>
								<div className="text-xs text-white/40 mb-1">
									{monthNames[data.month - 1].slice(0, 3)}
								</div>
								<div
									className={cn(
										"text-lg font-bold",
										data.count > 0 ? "text-amber-300" : "text-white/20",
									)}
								>
									{data.count}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Completed Items List */}
			<div className="space-y-6">
				{itemCount === 0 ? (
					<EmptyState period={period} />
				) : (
					groupedItems &&
					Object.entries(groupedItems).map(([date, dateItems]) => (
						<div key={date} className="space-y-2">
							<h3 className="text-sm font-semibold text-white/40 flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
								{date}
								<span className="text-white/20">({dateItems.length})</span>
							</h3>
							<div className="space-y-2">
								{dateItems.map((item) => (
									<CompletedItemCard key={item.id} item={item} />
								))}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

// Stats Card Component
function StatsCard({
	icon,
	label,
	value,
	gradient,
	iconColor,
	highlight = false,
}: {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	gradient: string;
	iconColor: string;
	highlight?: boolean;
}) {
	return (
		<div
			className={cn(
				"p-4 rounded-xl border transition-all",
				`bg-gradient-to-br ${gradient}`,
				highlight
					? "border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
					: "border-white/10",
			)}
		>
			<div className={cn("mb-2", iconColor)}>{icon}</div>
			<div className="text-2xl font-bold text-white/90">{value}</div>
			<div className="text-xs text-white/50">{label}</div>
		</div>
	);
}

// Milestone Badge Component
function MilestoneBadge({ count }: { count: number }) {
	return (
		<div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
			<Star className="h-3 w-3 text-amber-400 fill-amber-400" />
			<span className="text-sm font-medium text-amber-300">{count}</span>
		</div>
	);
}

// Completed Item Card Component
function CompletedItemCard({ item }: { item: CompletedItemWithBoard }) {
	const importanceColors: Record<string, string> = {
		low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
		medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
		high: "bg-red-500/20 text-red-300 border-red-500/30",
	};

	return (
		<div className="group flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all">
			<div className="mt-0.5 p-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
				<CheckCircle2 className="h-4 w-4 text-emerald-400" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="font-medium text-white/90 truncate">{item.name}</p>
						<p className="text-xs text-white/40 mt-0.5">
							from <span className="text-white/60">{item.boardName}</span>
							{" · "}
							{new Date(item.completedAt).toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "2-digit",
							})}
						</p>
					</div>
					<span
						className={cn(
							"shrink-0 px-2 py-0.5 rounded text-xs font-medium border",
							importanceColors[item.importance] || importanceColors.medium,
						)}
					>
						{item.importance}
					</span>
				</div>
				{item.description && (
					<p className="text-sm text-white/50 mt-1 line-clamp-2">
						{item.description}
					</p>
				)}
			</div>
		</div>
	);
}

// Empty State Component
function EmptyState({ period }: { period: PeriodType }) {
	const messages: Record<PeriodType, { title: string; description: string }> = {
		day: {
			title: "No completions today yet",
			description:
				"Complete tasks from your boards and they'll appear here. Today's a great day to check things off!",
		},
		week: {
			title: "No completions this week",
			description:
				"Start working through your tasks and celebrate your progress here.",
		},
		month: {
			title: "No completions this month",
			description:
				"This month is full of potential. Complete your first task to get started!",
		},
		year: {
			title: "No completions this year",
			description: "A new year of possibilities awaits. Let's make it count!",
		},
	};

	const { title, description } = messages[period];

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
				<Trophy className="h-12 w-12 text-amber-400/50" />
			</div>
			<h2 className="text-xl font-semibold text-white/70 mb-2">{title}</h2>
			<p className="text-white/40 text-center max-w-md">{description}</p>
		</div>
	);
}
