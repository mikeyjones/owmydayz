import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
	attachClosestEdge,
	type Edge,
	extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
	MessageSquare,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	useClockifyConnection,
	useStartTimer,
	useStopTimer,
} from "~/hooks/useClockify";
import { useKanbanItemCommentCount } from "~/hooks/useItemComments";
import { cn } from "~/lib/utils";
import type {
	KanbanEffort,
	KanbanImportance,
	KanbanItem as KanbanItemType,
} from "~/types";
import type { ColumnColor } from "~/utils/columnColors";
import { DropIndicator } from "./DropIndicator";

interface KanbanItemProps {
	item: KanbanItemType;
	onEdit: (item: KanbanItemType) => void;
	onDelete: (itemId: string) => void;
	isDragging?: boolean;
	columnColor?: ColumnColor;
	defaultClockifyClientId?: string;
	defaultClockifyProjectId?: string;
}

const importanceStyles: Record<
	KanbanImportance,
	{ bg: string; text: string; label: string }
> = {
	low: { bg: "bg-green-500/20", text: "text-green-600", label: "Low" },
	medium: { bg: "bg-yellow-500/20", text: "text-yellow-600", label: "Medium" },
	high: { bg: "bg-red-500/20", text: "text-red-600", label: "High" },
};

const effortStyles: Record<
	KanbanEffort,
	{ bg: string; text: string; label: string }
> = {
	small: { bg: "bg-blue-500/20", text: "text-blue-600", label: "S" },
	medium: { bg: "bg-purple-500/20", text: "text-purple-600", label: "M" },
	big: { bg: "bg-orange-500/20", text: "text-orange-600", label: "L" },
};

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

export function KanbanItemCard({
	item,
	onEdit,
	onDelete,
	isDragging: isDraggingProp = false,
	columnColor,
	defaultClockifyClientId: _defaultClockifyClientId,
	defaultClockifyProjectId,
}: KanbanItemProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const dragStartedRef = useRef(false);

	const { data: commentCount } = useKanbanItemCommentCount(item.id);
	const { isConnected } = useClockifyConnection();
	const { mutate: startTimer } = useStartTimer();
	const { mutate: stopTimer } = useStopTimer();

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

	// Handler for play/pause button
	const handleTimerToggle = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent event bubbling

		if (isTimerRunning) {
			// Stop the timer
			stopTimer({ itemId: item.id });
		} else {
			// Start the timer
			// Use item's project ID if available, otherwise fall back to board default
			const projectId = item.clockifyProjectId || defaultClockifyProjectId;

			startTimer({
				itemId: item.id,
				description: item.name,
				projectId: projectId,
			});
		}
	};

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return combine(
			draggable({
				element,
				dragHandle: element,
				canDrag: (args) => {
					// Safely access the event target
					const event = (args?.input as any)?.event;
					if (!event) {
						return true; // Allow drag if we can't determine the target
					}

					const target = event.target as HTMLElement;

					// Safety check: ensure target is an Element
					if (!target || !target.tagName) {
						return true;
					}

					const tagName = target.tagName.toUpperCase();

					// Don't drag if clicking on buttons, inputs, or their children
					if (
						tagName === "BUTTON" ||
						tagName === "INPUT" ||
						tagName === "TEXTAREA" ||
						tagName === "SELECT" ||
						target.closest("button") ||
						target.closest("input") ||
						target.closest("textarea") ||
						target.closest("select")
					) {
						return false;
					}

					return true;
				},
				getInitialData: () => ({
					type: "item",
					itemId: item.id,
					item,
					columnId: item.columnId,
				}),
				onDragStart: () => {
					dragStartedRef.current = true;
					setIsDragging(true);
				},
				onDrop: () => {
					setIsDragging(false);
					// Reset drag flag after a brief delay to allow click event to check it
					setTimeout(() => {
						dragStartedRef.current = false;
					}, 100);
				},
			}),
			dropTargetForElements({
				element,
				getData: ({ input, element }) => {
					return attachClosestEdge(
						{ type: "item", itemId: item.id, columnId: item.columnId },
						{ input, element, allowedEdges: ["top", "bottom"] },
					);
				},
				canDrop: ({ source }) => {
					// Don't allow dropping on itself
					return source.data.type === "item" && source.data.itemId !== item.id;
				},
				onDragEnter: ({ self }) => {
					const edge = extractClosestEdge(self.data);
					setClosestEdge(edge);
				},
				onDrag: ({ self }) => {
					const edge = extractClosestEdge(self.data);
					setClosestEdge(edge);
				},
				onDragLeave: () => {
					setClosestEdge(null);
				},
				onDrop: () => {
					setClosestEdge(null);
				},
			}),
		);
	}, [item.id, item.columnId, item]);

	// Click handler to open edit dialog
	const handleCardClick = (e: React.MouseEvent) => {
		// Don't open edit dialog if:
		// 1. User was dragging
		// 2. Click was on a button or interactive element
		if (dragStartedRef.current) {
			return;
		}

		const target = e.target as HTMLElement;
		// Don't open dialog if clicking on buttons or interactive elements
		if (
			target.closest("button") ||
			target.closest("input") ||
			target.closest("textarea") ||
			target.closest("select")
		) {
			return;
		}

		onEdit(item);
	};

	// Keyboard navigation handler
	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Space or Enter to edit the item
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			onEdit(item);
		}
	};

	const importance = (item.importance || "medium") as KanbanImportance;
	const effort = (item.effort || "medium") as KanbanEffort;
	const tags = item.tags || [];

	return (
		<div
			ref={ref}
			role="article"
			aria-label={`Task: ${item.name}. ${item.description ? `Description: ${item.description}. ` : ""}Importance: ${importanceStyles[importance].label}. Effort: ${effortStyles[effort].label}.`}
			onClick={handleCardClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			className={cn(
				"relative bg-card border rounded-lg p-3 shadow-sm transition-all border-l-4",
				columnColor?.accent || "border-l-transparent",
				"hover:shadow-md hover:border-primary/30 hover:bg-accent/5",
				"hover:cursor-grab active:cursor-grabbing",
				"focus:outline-none focus:ring-2 focus:ring-primary/50 focus:shadow-lg",
				(isDragging || isDraggingProp) &&
					"opacity-50 shadow-lg ring-2 ring-primary/50",
			)}
		>
			<DropIndicator edge={closestEdge} />
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<h4 className="font-medium text-sm leading-tight break-words">
						{item.name}
					</h4>

					{item.description && (
						<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
							{item.description}
						</p>
					)}

					{/* Timer UI - only show if Clockify is connected */}
					{isConnected && (
						<div className="flex items-center gap-1.5 mt-2">
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"h-6 w-6 shrink-0",
									isTimerRunning && "text-green-600 hover:text-green-700",
								)}
								onClick={handleTimerToggle}
								aria-label={isTimerRunning ? "Stop timer" : "Start timer"}
								title={isTimerRunning ? "Stop timer" : "Start timer"}
							>
								{isTimerRunning ? (
									<Pause className="h-3.5 w-3.5" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
							</Button>
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

					<div className="flex items-center gap-2 mt-2 flex-wrap">
						<span
							className={cn(
								"px-1.5 py-0.5 rounded text-[10px] font-medium",
								importanceStyles[importance].bg,
								importanceStyles[importance].text,
							)}
						>
							{importanceStyles[importance].label}
						</span>
						<span
							className={cn(
								"px-1.5 py-0.5 rounded text-[10px] font-medium",
								effortStyles[effort].bg,
								effortStyles[effort].text,
							)}
						>
							{effortStyles[effort].label}
						</span>

						{tags.length > 0 && (
							<>
								{tags.slice(0, 2).map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										className="text-[10px] py-0 px-1.5 h-4"
									>
										{tag}
									</Badge>
								))}
								{tags.length > 2 && (
									<span className="text-[10px] text-muted-foreground">
										+{tags.length - 2}
									</span>
								)}
							</>
						)}

						{commentCount !== undefined && commentCount > 0 && (
							<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
								<MessageSquare className="h-3 w-3" />
								{commentCount}
							</span>
						)}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 shrink-0"
							aria-label={`More options for ${item.name}`}
						>
							<MoreHorizontal className="h-3.5 w-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(item)}>
							<Pencil className="h-4 w-4 mr-2" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(item.id)}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
