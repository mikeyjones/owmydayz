import confetti from "canvas-confetti";
import { Check, Loader2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import {
	useClockifyConnection,
	useStartTimer,
	useStopTimer,
} from "~/hooks/useClockify";
import { cn } from "~/lib/utils";

// Convex now item type
interface NowItem {
	_id: string;
	columnId: string;
	boardId: string;
	name: string;
	description?: string;
	importance: string;
	effort: string;
	tags: string[];
	position: number;
	completedAt?: number;
	// Clockify timer integration fields
	clockifyProjectId?: string;
	clockifyClientId?: string;
	clockifyTimeEntryId?: string;
	timerStartedAt?: number;
	timerTotalSeconds?: number;
	lastTimerSync?: number;
	createdAt: number;
	updatedAt: number;
	boardName: string;
}

interface FocusItemProps {
	item: NowItem;
	onComplete: (itemId: string, boardId: string) => void;
	onEdit: (item: NowItem) => void;
	isCompleting?: boolean;
}

type KanbanImportance = "low" | "medium" | "high";

const importanceStyles: Record<
	KanbanImportance,
	{ bg: string; text: string; label: string }
> = {
	low: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Low" },
	medium: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Medium" },
	high: { bg: "bg-rose-500/20", text: "text-rose-400", label: "High" },
};

function triggerConfetti() {
	// Create a burst of confetti from the center
	const count = 200;
	const defaults = {
		origin: { y: 0.7 },
		zIndex: 9999,
	};

	function fire(particleRatio: number, opts: confetti.Options) {
		confetti({
			...defaults,
			...opts,
			particleCount: Math.floor(count * particleRatio),
		});
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55,
	});
	fire(0.2, {
		spread: 60,
	});
	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8,
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2,
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 45,
	});
}

/**
 * Format elapsed seconds into HH:MM:SS or MM:SS format
 */
function formatElapsedTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function FocusItem({
	item,
	onComplete,
	onEdit,
	isCompleting = false,
}: FocusItemProps) {
	const [isChecked, setIsChecked] = useState(false);
	const [isAnimatingOut, setIsAnimatingOut] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const { isConnected } = useClockifyConnection();
	const { mutate: startTimer } = useStartTimer();
	const { mutate: stopTimer } = useStopTimer();

	const importance = (item.importance || "medium") as KanbanImportance;

	// Calculate if timer is currently running
	const isTimerRunning = !!item.clockifyTimeEntryId && !!item.timerStartedAt;

	// Update elapsed time every second when timer is running
	useEffect(() => {
		if (isTimerRunning && item.timerStartedAt) {
			// Calculate initial elapsed time
			const updateElapsedTime = () => {
				if (!item.timerStartedAt) return;
				const now = Date.now();
				const elapsed = Math.floor((now - item.timerStartedAt) / 1000);
				setElapsedSeconds(elapsed);
			};

			// Update immediately
			updateElapsedTime();

			// Then update every second
			const interval = setInterval(updateElapsedTime, 1000);
			return () => clearInterval(interval);
		}
		if (item.timerTotalSeconds) {
			// Show total time if timer is not running but has accumulated time
			setElapsedSeconds(item.timerTotalSeconds);
		} else {
			setElapsedSeconds(0);
		}
	}, [isTimerRunning, item.timerStartedAt, item.timerTotalSeconds]);

	const handleCheck = () => {
		if (isCompleting || isChecked) return;

		setIsChecked(true);
		triggerConfetti();

		// Start fade out animation
		setTimeout(() => {
			setIsAnimatingOut(true);
		}, 300);

		// Actually complete the item after animation
		setTimeout(() => {
			onComplete(item._id, item.boardId);
		}, 600);
	};

	// Handler for play/pause button
	const handleTimerToggle = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent event bubbling

		if (isTimerRunning) {
			// Stop the timer
			stopTimer({ itemId: item._id });
		} else {
			// Start the timer
			const projectId = item.clockifyProjectId;

			startTimer({
				itemId: item._id,
				description: item.name,
				projectId: projectId,
			});
		}
	};

	// Click handler to open edit dialog
	const handleCardClick = (e: React.MouseEvent) => {
		// Don't open edit dialog if clicking on buttons or interactive elements
		const target = e.target as HTMLElement;
		if (target.closest("button")) {
			return;
		}

		onEdit(item);
	};

	return (
		<div
			onClick={handleCardClick}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onEdit(item);
				}
			}}
			className={cn(
				"group flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
				"bg-card/50 border border-border hover:border-border/60",
				"hover:bg-card/80 cursor-pointer",
				"focus:outline-none focus:ring-2 focus:ring-primary/50",
				isAnimatingOut && "opacity-0 scale-95 translate-x-4",
				isChecked &&
					!isAnimatingOut &&
					"bg-emerald-500/10 border-emerald-500/30",
			)}
		>
			{/* Custom Checkbox */}
			<button
				type="button"
				onClick={handleCheck}
				disabled={isCompleting || isChecked}
				className={cn(
					"relative flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200",
					"flex items-center justify-center",
					isChecked
						? "bg-emerald-500 border-emerald-500"
						: "border-border hover:border-emerald-400 hover:bg-emerald-500/10",
					(isCompleting || isChecked) && "cursor-not-allowed",
				)}
			>
				{isCompleting ? (
					<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
				) : isChecked ? (
					<Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
				) : null}
			</button>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-3">
					<h3
						className={cn(
							"font-medium text-[15px] leading-tight transition-all duration-200",
							isChecked
								? "text-muted-foreground line-through"
								: "text-foreground",
						)}
					>
						{item.name}
					</h3>
					<span
						className={cn(
							"flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide",
							importanceStyles[importance].bg,
							importanceStyles[importance].text,
						)}
					>
						{importanceStyles[importance].label}
					</span>
				</div>

				{item.description && (
					<p
						className={cn(
							"text-sm mt-1.5 line-clamp-2 transition-colors duration-200",
							isChecked ? "text-muted-foreground/50" : "text-muted-foreground",
						)}
					>
						{item.description}
					</p>
				)}

				<div className="flex items-center gap-3 mt-2">
					<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
						{item.boardName}
					</span>

					{/* Timer UI - only show if Clockify is connected */}
					{isConnected && (
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={handleTimerToggle}
								className={cn(
									"p-1 rounded hover:bg-accent transition-colors",
									isTimerRunning && "text-green-600 hover:text-green-700",
								)}
								aria-label={isTimerRunning ? "Stop timer" : "Start timer"}
								title={isTimerRunning ? "Stop timer" : "Start timer"}
							>
								{isTimerRunning ? (
									<Pause className="h-3.5 w-3.5" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
							</button>
							{elapsedSeconds > 0 && (
								<span
									className={cn(
										"text-[10px] font-mono tabular-nums",
										isTimerRunning ? "text-green-600" : "text-muted-foreground",
									)}
								>
									{formatElapsedTime(elapsedSeconds)}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
