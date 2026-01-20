import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
	ChevronRight,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import type { KanbanColumn as KanbanColumnType, KanbanItem } from "~/types";
import type { ColumnColor } from "~/utils/columnColors";
import { KanbanItemCard } from "./KanbanItem";

interface KanbanColumnProps {
	column: KanbanColumnType & { items: KanbanItem[] };
	onAddItem: (columnId: string, columnName: string) => void;
	onEditItem: (item: KanbanItem) => void;
	onDeleteItem: (itemId: string) => void;
	onEditColumn?: (column: KanbanColumnType) => void;
	onDeleteColumn?: (columnId: string) => void;
	isFolded?: boolean;
	onUnfold?: (columnId: string) => void;
	columnColor?: ColumnColor;
}

export function KanbanColumnComponent({
	column,
	onAddItem,
	onEditItem,
	onDeleteItem,
	onEditColumn,
	onDeleteColumn,
	isFolded = false,
	onUnfold,
	columnColor,
}: KanbanColumnProps) {
	const ref = useRef<HTMLDivElement>(null);
	const foldedRef = useRef<HTMLButtonElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const columnRef = useRef<HTMLDivElement>(null);
	const [isOver, setIsOver] = useState(false);
	const [isColumnOver, setIsColumnOver] = useState(false);

	const isSystemColumn = column.isSystem;
	const SYSTEM_COLUMN_COMPLETED = "Completed";
	const isCompletedColumn =
		column.isSystem && column.name === SYSTEM_COLUMN_COMPLETED;

	// Set up drop target for expanded column
	useEffect(() => {
		const element = ref.current;
		if (!element || isFolded) return;

		return dropTargetForElements({
			element,
			getData: () => ({
				type: "column",
				columnId: column.id,
			}),
			canDrop: ({ source }) => source.data.type === "item",
			onDragEnter: () => setIsOver(true),
			onDragLeave: () => setIsOver(false),
			onDrop: () => setIsOver(false),
		});
	}, [column.id, isFolded]);

	// Set up drop target for folded column
	useEffect(() => {
		const element = foldedRef.current;
		if (!element || !isFolded) return;

		return dropTargetForElements({
			element,
			getData: () => ({
				type: "column",
				columnId: column.id,
			}),
			canDrop: ({ source }) => source.data.type === "item",
			onDragEnter: () => setIsOver(true),
			onDragLeave: () => setIsOver(false),
			onDrop: () => setIsOver(false),
		});
	}, [column.id, isFolded]);

	// Set up draggable for column reordering
	useEffect(() => {
		const element = columnRef.current;
		const header = headerRef.current;
		if (!element || !header) return;

		// Only Completed cannot be dragged
		if (isCompletedColumn || isFolded) return;

		return draggable({
			element,
			dragHandle: header,
			getInitialData: () => ({
				type: "column",
				columnId: column.id,
				columnName: column.name,
				isSystemColumn: column.isSystem,
			}),
		});
	}, [column.id, column.isSystem, column.name, isCompletedColumn, isFolded]);

	// Set up drop target for column reordering
	useEffect(() => {
		const element = columnRef.current;
		// Only Completed column cannot be a drop target
		if (!element || isCompletedColumn || isFolded) return;

		return dropTargetForElements({
			element,
			getData: ({ input, element }) => {
				const data = {
					type: "column",
					columnId: column.id,
				};
				// Attach edge detection for left/right positioning
				return attachClosestEdge(data, {
					input,
					element,
					allowedEdges: ["left", "right"],
				});
			},
			canDrop: ({ source }) => {
				// Only accept other columns (not items)
				return (
					source.data.type === "column" && source.data.columnId !== column.id
				);
			},
			onDragEnter: () => setIsColumnOver(true),
			onDragLeave: () => setIsColumnOver(false),
			onDrop: () => setIsColumnOver(false),
		});
	}, [column.id, isCompletedColumn, isFolded]);

	// Keyboard handler for folded column
	const handleFoldedKeyDown = (e: React.KeyboardEvent) => {
		if ((e.key === " " || e.key === "Enter") && onUnfold) {
			e.preventDefault();
			onUnfold(column.id);
		}
	};

	// Render folded/collapsed column
	if (isFolded) {
		return (
			<Tooltip content={`Click to expand ${column.name}`}>
				<button
					ref={foldedRef}
					type="button"
					onClick={() => onUnfold?.(column.id)}
					onKeyDown={handleFoldedKeyDown}
					aria-label={`Expand ${column.name} column with ${column.items.length} items`}
					aria-expanded="false"
					className={cn(
						"flex flex-col w-12 min-w-12 max-w-12 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
						columnColor?.bg || "bg-muted/30",
						columnColor?.border,
						isOver && "ring-2 ring-primary/50 bg-primary/10",
					)}
				>
					{/* Folded Header */}
					<div
						className={cn(
							"flex flex-col items-center gap-2 p-2 border-b rounded-t-lg w-full",
							columnColor?.headerBg || "bg-muted/50",
						)}
					>
						<ChevronRight
							className={cn(
								"h-4 w-4",
								columnColor?.text || "text-muted-foreground",
							)}
						/>
						<span
							className={cn(
								"text-xs px-1.5 py-0.5 rounded-full",
								columnColor?.headerBg || "bg-muted",
								columnColor?.text || "text-muted-foreground",
							)}
						>
							{column.items.length}
						</span>
					</div>

					{/* Vertical Column Name */}
					<div className="flex-1 flex items-center justify-center p-2 min-h-[100px]">
						<span
							className={cn(
								"font-semibold text-sm whitespace-nowrap",
								columnColor?.text || "text-muted-foreground",
							)}
							style={{
								writingMode: "vertical-rl",
								textOrientation: "mixed",
								transform: "rotate(180deg)",
							}}
						>
							{column.name}
						</span>
					</div>
				</button>
			</Tooltip>
		);
	}

	return (
		<div
			ref={columnRef}
			role="region"
			aria-label={`${column.name} column with ${column.items.length} items`}
			className={cn(
				"flex flex-col w-72 min-w-72 max-w-72 rounded-lg border transition-all",
				columnColor?.bg || "bg-muted/30",
				columnColor?.border,
				isOver && "ring-2 ring-primary/50",
				isColumnOver &&
					"ring-2 ring-blue-500/70 scale-105 transition-transform",
			)}
		>
			{/* Column Header */}
			<div
				ref={headerRef}
				data-drag-handle="true"
				className={cn(
					"flex items-center justify-between p-3 border-b rounded-t-lg",
					columnColor?.headerBg || "bg-muted/50",
					!isCompletedColumn && "hover:cursor-grab active:cursor-grabbing",
				)}
			>
				<div className="flex items-center gap-2">
					<h3 className={cn("font-semibold text-sm", columnColor?.text)}>
						{column.name}
					</h3>
					<span
						className={cn(
							"text-xs px-2 py-0.5 rounded-full",
							columnColor?.headerBg || "bg-muted",
							columnColor?.text || "text-muted-foreground",
						)}
					>
						{column.items.length}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => onAddItem(column.id, column.name)}
						aria-label={`Add item to ${column.name}`}
					>
						<Plus className="h-4 w-4" />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								aria-label={`Column options for ${column.name}`}
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{onEditColumn && !isSystemColumn && (
								<DropdownMenuItem onClick={() => onEditColumn(column)}>
									<Pencil className="h-4 w-4 mr-2" />
									Rename
								</DropdownMenuItem>
							)}
							{onDeleteColumn &&
								(isSystemColumn ? (
									<DropdownMenuItem
										disabled
										className="opacity-50 cursor-not-allowed"
										title="System columns cannot be deleted"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem
										onClick={() => onDeleteColumn(column.id)}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Items Container */}
			<div
				ref={ref}
				role="list"
				aria-label={`${column.name} items`}
				className={cn(
					"flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px] max-h-[calc(100vh-300px)]",
					isOver && "bg-primary/5",
				)}
			>
				{column.items.map((item) => (
					<KanbanItemCard
						key={item.id}
						item={item}
						onEdit={onEditItem}
						onDelete={onDeleteItem}
						columnColor={columnColor}
					/>
				))}

				{column.items.length === 0 && (
					<div
						className={cn(
							"flex items-center justify-center h-20 text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
							isOver && "border-primary bg-primary/10",
						)}
					>
						Drop items here
					</div>
				)}
			</div>
		</div>
	);
}
