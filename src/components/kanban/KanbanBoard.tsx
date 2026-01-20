import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Loader2, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	applyOptimisticColumnReorder,
	applyOptimisticMoves,
	type PendingMove,
	useBoardWithColumns,
	useDeleteColumn,
	useDeleteItem,
	useMoveItem,
	useReorderColumns,
} from "~/hooks/useKanban";
import type { KanbanColumnWithItems, KanbanItem } from "~/types";
import { getColumnColorById } from "~/utils/columnColors";
import { calculateNewColumnOrder } from "~/utils/columnReordering";
import { BoardDialog } from "./BoardDialog";
import { CreateColumnDialog } from "./CreateColumnDialog";
import { CreateItemDialog } from "./CreateItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { KanbanColumnComponent } from "./KanbanColumn";

// System column name constant
const SYSTEM_COLUMN_NOW = "Now";

interface KanbanBoardProps {
	boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
	const { data: board, isLoading, error } = useBoardWithColumns(boardId);
	const moveItemMutation = useMoveItem();
	const deleteItemMutation = useDeleteItem();
	const deleteColumnMutation = useDeleteColumn();
	const reorderColumnsMutation = useReorderColumns();

	const [createItemDialog, setCreateItemDialog] = useState<{
		open: boolean;
		columnId: string;
		columnName: string;
	}>({ open: false, columnId: "", columnName: "" });
	const [editItemDialog, setEditItemDialog] = useState<{
		open: boolean;
		item: KanbanItem | null;
	}>({ open: false, item: null });
	const [createColumnDialog, setCreateColumnDialog] = useState(false);
	const [boardSettingsDialog, setBoardSettingsDialog] = useState(false);

	// Optimistic state: track pending moves
	const [pendingMoves, setPendingMoves] = useState<Map<string, PendingMove>>(
		new Map(),
	);

	// Optimistic state: track pending column reorder
	const [pendingColumnReorder, setPendingColumnReorder] = useState<
		string[] | null
	>(null);

	// Drag preview state for animated column shifting
	const [dragPreview, setDragPreview] = useState<{
		draggedColumnId: string;
		targetColumnId: string;
		insertPosition: "before" | "after";
	} | null>(null);

	// Focus mode state: track which non-"Now" column is currently expanded
	const [expandedColumnId, setExpandedColumnId] = useState<string | null>(null);

	// Get first non-system, non-"Now" column as default expanded
	const defaultExpandedColumn = useMemo(() => {
		if (!board?.columns) return null;
		return board.columns.find(
			(col: KanbanColumnWithItems) =>
				!col.isSystem || col.name !== SYSTEM_COLUMN_NOW,
		);
	}, [board?.columns]);

	// Initialize expanded column when board loads or focus mode changes
	useEffect(() => {
		if (board?.focusMode && !expandedColumnId && defaultExpandedColumn) {
			setExpandedColumnId(defaultExpandedColumn.id);
		}
	}, [board?.focusMode, expandedColumnId, defaultExpandedColumn]);

	// Apply optimistic updates to board columns
	const optimisticBoard = useMemo(() => {
		if (!board?.columns) return board;

		// First, apply item moves
		let optimisticColumns = applyOptimisticMoves(board.columns, pendingMoves);

		// Then, apply column reordering if pending
		if (pendingColumnReorder) {
			optimisticColumns = applyOptimisticColumnReorder(
				optimisticColumns,
				pendingColumnReorder,
			);
		}

		return {
			...board,
			columns: optimisticColumns,
		};
	}, [board, pendingMoves, pendingColumnReorder]);

	// Clear pending moves when Convex data reflects the change
	useEffect(() => {
		if (!board || pendingMoves.size === 0) return;

		const movesToClear: string[] = [];
		pendingMoves.forEach((move, itemId) => {
			const item = board.columns
				.flatMap((col: KanbanColumnWithItems) => col.items)
				.find((i: KanbanItem) => i.id === itemId);

			// Clear if item is in the expected position
			if (
				item &&
				item.columnId === move.toColumnId &&
				item.position === move.newPosition
			) {
				movesToClear.push(itemId);
			}
		});

		if (movesToClear.length > 0) {
			setPendingMoves((prev) => {
				const next = new Map(prev);
				for (const id of movesToClear) {
					next.delete(id);
				}
				return next;
			});
		}
	}, [board, pendingMoves]);

	// Clear pending column reorder when Convex data reflects the change
	useEffect(() => {
		if (!board || !pendingColumnReorder) return;

		// Get user columns only (exclude system columns) and sort by position
		const userColumns = board.columns
			.filter((col: KanbanColumnWithItems) => !col.isSystem)
			.sort(
				(a: KanbanColumnWithItems, b: KanbanColumnWithItems) =>
					a.position - b.position,
			);

		// Check if the current column order matches the pending order
		const currentOrder = userColumns.map(
			(col: KanbanColumnWithItems) => col.id,
		);
		const ordersMatch =
			currentOrder.length === pendingColumnReorder.length &&
			currentOrder.every(
				(id: string, index: number) => id === pendingColumnReorder[index],
			);

		if (ordersMatch) {
			setPendingColumnReorder(null);
		}
	}, [board, pendingColumnReorder]);

	// Monitor for drag and drop events
	useEffect(() => {
		return monitorForElements({
			onDragStart: () => {
				// Can add start animations here if needed
			},

			onDrag: ({ location, source }) => {
				if (source.data.type !== "column") return;

				const dest = location.current.dropTargets[0];
				if (!dest || dest.data.type !== "column") {
					setDragPreview((prev) => (prev ? null : prev));
					return;
				}

				const draggedColumnId = source.data.columnId as string;
				const targetColumnId = dest.data.columnId as string;

				if (draggedColumnId === targetColumnId) {
					setDragPreview((prev) => (prev ? null : prev));
					return;
				}

				const closestEdge = extractClosestEdge(dest.data);
				const insertPosition = closestEdge === "right" ? "after" : "before";

				// Only update if the preview has actually changed
				setDragPreview((prev) => {
					if (
						prev &&
						prev.draggedColumnId === draggedColumnId &&
						prev.targetColumnId === targetColumnId &&
						prev.insertPosition === insertPosition
					) {
						return prev; // No change, don't trigger re-render
					}
					return {
						draggedColumnId,
						targetColumnId,
						insertPosition,
					};
				});
			},

			onDrop: ({ source, location }) => {
				const destination = location.current.dropTargets[0];
				if (!destination || !optimisticBoard) return;

				const sourceData = source.data;
				const destData = destination.data;

				// Handle column reordering
				if (sourceData.type === "column") {
					const draggedColumnId = sourceData.columnId as string;
					const targetColumnId = destData.columnId as string;

					// Can't drop a column on itself
					if (draggedColumnId === targetColumnId) {
						setDragPreview(null);
						return;
					}

					// Determine if we're dropping before or after the target
					const closestEdge = extractClosestEdge(destData);
					const dropAfter = closestEdge === "right";

					// Calculate new column order
					const newColumnOrder = calculateNewColumnOrder(
						optimisticBoard.columns,
						draggedColumnId,
						targetColumnId,
						dropAfter,
					);

					// Apply optimistic update
					setPendingColumnReorder(newColumnOrder);
					setDragPreview(null); // Clear preview on drop

					// Prepare columnOrder array with positions for mutation
					const columnOrder = newColumnOrder.map((columnId, index) => ({
						id: columnId,
						position: index,
					}));

					// Fire mutation
					reorderColumnsMutation.mutate({
						boardId,
						columnOrder,
					});

					return;
				}

				// Handle item drops
				if (sourceData.type !== "item") return;

				const sourceItemId = sourceData.itemId as string;
				// Get current item position from optimistic board (accounts for previous optimistic moves)
				const currentItem = optimisticBoard.columns
					.flatMap((col: KanbanColumnWithItems) => col.items)
					.find((item: KanbanItem) => item.id === sourceItemId);

				if (!currentItem) return;

				const sourceItem = sourceData.item as KanbanItem;
				let targetColumnId: string;
				let newPosition: number;

				if (destData.type === "column") {
					// Dropped directly on a column (empty area)
					targetColumnId = destData.columnId as string;
					const targetColumn = optimisticBoard.columns.find(
						(c: KanbanColumnWithItems) => c.id === targetColumnId,
					);
					newPosition = targetColumn?.items.length || 0;
				} else if (destData.type === "item") {
					// Dropped on another item
					targetColumnId = destData.columnId as string;
					const targetColumn = optimisticBoard.columns.find(
						(c: KanbanColumnWithItems) => c.id === targetColumnId,
					);
					const targetItemId = destData.itemId as string;
					const targetIndex =
						targetColumn?.items.findIndex(
							(i: KanbanItem) => i.id === targetItemId,
						) ?? -1;

					// Determine position based on closest edge
					const closestEdge = extractClosestEdge(destData);

					if (targetIndex >= 0) {
						// If dropping below, add 1 to position
						newPosition =
							closestEdge === "bottom" ? targetIndex + 1 : targetIndex;

						// Adjust if moving within the same column and from above
						// Use currentItem.columnId (from optimistic board) not sourceItem.columnId
						if (currentItem.columnId === targetColumnId) {
							const sourceIndex =
								targetColumn?.items.findIndex(
									(i: KanbanItem) => i.id === sourceItemId,
								) ?? -1;
							if (sourceIndex >= 0 && sourceIndex < newPosition) {
								newPosition -= 1;
							}
						}
					} else {
						newPosition = 0;
					}
				} else {
					return;
				}

				// Only update if something changed
				// Compare against current optimistic position, not original
				if (
					currentItem.columnId !== targetColumnId ||
					currentItem.position !== newPosition
				) {
					// Apply optimistic update immediately
					setPendingMoves((prev) => {
						const next = new Map(prev);
						next.set(sourceItemId, {
							itemId: sourceItemId,
							fromColumnId: currentItem.columnId,
							toColumnId: targetColumnId,
							newPosition,
							item: currentItem, // Use current item from optimistic board
						});
						return next;
					});

					// Fire mutation
					moveItemMutation.mutate({
						itemId: sourceItem.id,
						newColumnId: targetColumnId,
						newPosition,
						boardId,
					});
				}

				// Clear drag preview when drag ends
				setDragPreview(null);
			},
		});
	}, [optimisticBoard, boardId, moveItemMutation, reorderColumnsMutation]);

	// Handler for unfolding a column in focus mode
	const handleUnfoldColumn = useCallback((columnId: string) => {
		setExpandedColumnId(columnId);
	}, []);

	// Determine if a column should be folded
	const isColumnFolded = useCallback(
		(column: KanbanColumnWithItems) => {
			if (!board?.focusMode) return false;

			// "Now" column is never folded
			if (column.isSystem && column.name === SYSTEM_COLUMN_NOW) return false;

			// The currently expanded column is not folded
			if (column.id === expandedColumnId) return false;

			// All other columns are folded in focus mode
			return true;
		},
		[board?.focusMode, expandedColumnId],
	);

	const handleAddItem = useCallback((columnId: string, columnName: string) => {
		setCreateItemDialog({ open: true, columnId, columnName });
	}, []);

	const handleEditItem = useCallback((item: KanbanItem) => {
		setEditItemDialog({ open: true, item });
	}, []);

	const handleDeleteItem = useCallback(
		(itemId: string) => {
			deleteItemMutation.mutate({ id: itemId, boardId });
		},
		[boardId, deleteItemMutation],
	);

	const handleDeleteColumn = useCallback(
		(columnId: string) => {
			deleteColumnMutation.mutate({ id: columnId, boardId });
		},
		[boardId, deleteColumnMutation],
	);

	// Use optimistic board for rendering
	const displayBoard = optimisticBoard || board;

	// Render columns with simple drop indicator
	const renderColumnsWithPreview = useCallback(() => {
		if (!displayBoard) return null;
		const columns = displayBoard.columns;

		return columns.map((column: KanbanColumnWithItems, index: number) => {
			const isDragged =
				dragPreview && column.id === dragPreview.draggedColumnId;
			const isDropTarget =
				dragPreview &&
				column.id === dragPreview.targetColumnId &&
				!pendingColumnReorder;
			const showDropBefore =
				isDropTarget && dragPreview.insertPosition === "before";
			const showDropAfter =
				isDropTarget && dragPreview.insertPosition === "after";

			return (
				<div key={column.id} className="relative flex-shrink-0">
					{/* Drop indicator before */}
					{showDropBefore && (
						<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10 -ml-2" />
					)}

					{/* Column wrapper with opacity for dragged column */}
					<div className={isDragged ? "opacity-50" : "opacity-100"}>
						<KanbanColumnComponent
							column={column}
							onAddItem={handleAddItem}
							onEditItem={handleEditItem}
							onDeleteItem={handleDeleteItem}
							onDeleteColumn={handleDeleteColumn}
							isFolded={isColumnFolded(column)}
							onUnfold={handleUnfoldColumn}
							columnColor={getColumnColorById(column.id)}
						/>
					</div>

					{/* Drop indicator after */}
					{showDropAfter && (
						<div className="absolute right-0 top-0 bottom-0 w-1 bg-primary z-10 -mr-2" />
					)}
				</div>
			);
		});
	}, [
		displayBoard,
		dragPreview,
		pendingColumnReorder,
		handleAddItem,
		handleEditItem,
		handleDeleteItem,
		handleDeleteColumn,
		isColumnFolded,
		handleUnfoldColumn,
	]);

	if (isLoading || board === undefined) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Failed to load board</p>
			</div>
		);
	}

	if (board === null) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Board not found</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col" role="main" aria-label="Kanban board">
			{/* Board Header */}
			<div className="flex items-center justify-between mb-4 px-1">
				<div>
					<h1 className="text-xl font-bold">{displayBoard.name}</h1>
					{displayBoard.description && (
						<p className="text-sm text-muted-foreground">
							{displayBoard.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCreateColumnDialog(true)}
						aria-label="Add new column to board"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Column
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setBoardSettingsDialog(true)}
						aria-label="Board settings"
					>
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Kanban Columns */}
			<div
				className="flex-1 overflow-x-auto pb-4"
				role="region"
				aria-label="Board columns"
			>
				<div className="flex gap-4 h-full min-h-[400px]">
					{renderColumnsWithPreview()}

					{displayBoard.columns.length === 0 && (
						<div className="flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg">
							<div className="text-center">
								<p className="text-muted-foreground mb-2">No columns yet</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCreateColumnDialog(true)}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Column
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Dialogs */}
			<CreateItemDialog
				open={createItemDialog.open}
				onOpenChange={(open) =>
					setCreateItemDialog((prev) => ({ ...prev, open }))
				}
				columnId={createItemDialog.columnId}
				boardId={boardId}
				columnName={createItemDialog.columnName}
			/>

			<EditItemDialog
				open={editItemDialog.open}
				onOpenChange={(open) =>
					setEditItemDialog((prev) => ({ ...prev, open }))
				}
				item={editItemDialog.item}
				boardId={boardId}
			/>

			<CreateColumnDialog
				open={createColumnDialog}
				onOpenChange={setCreateColumnDialog}
				boardId={boardId}
			/>

			<BoardDialog
				open={boardSettingsDialog}
				onOpenChange={setBoardSettingsDialog}
				board={displayBoard}
			/>
		</div>
	);
}
