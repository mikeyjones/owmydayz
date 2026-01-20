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
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DropIndicator } from "~/components/kanban/DropIndicator";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useTeamItemCommentCount } from "~/hooks/useItemComments";
import { cn } from "~/lib/utils";
import type {
	KanbanEffort,
	KanbanImportance,
	TeamItem as TeamItemType,
} from "~/types";
import type { ColumnColor } from "~/utils/columnColors";

interface TeamKanbanItemProps {
	item: TeamItemType;
	onEdit: (item: TeamItemType) => void;
	onDelete: (itemId: string) => void;
	isDragging?: boolean;
	columnColor?: ColumnColor;
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

export function TeamKanbanItemCard({
	item,
	onEdit,
	onDelete,
	isDragging: isDraggingProp = false,
	columnColor,
}: TeamKanbanItemProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

	const { data: commentCount } = useTeamItemCommentCount(item.id);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return combine(
			draggable({
				element,
				dragHandle: element,
				canDrag: (args) => {
					// Safely access the event target
					const event = args?.input?.event;
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
				onDragStart: () => setIsDragging(true),
				onDrop: () => setIsDragging(false),
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

	const importance = (item.importance || "medium") as KanbanImportance;
	const effort = (item.effort || "medium") as KanbanEffort;
	const tags = item.tags || [];

	return (
		<div
			ref={ref}
			className={cn(
				"relative bg-card border rounded-lg p-3 shadow-sm transition-all border-l-4",
				columnColor?.accent || "border-l-transparent",
				"hover:shadow-md hover:border-primary/30",
				"hover:cursor-grab active:cursor-grabbing",
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
						<Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
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
