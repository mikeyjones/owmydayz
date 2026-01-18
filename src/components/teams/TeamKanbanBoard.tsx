import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Loader2, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	applyOptimisticTeamMoves,
	type PendingTeamMove,
	useDeleteTeamColumn,
	useDeleteTeamItem,
	useMoveTeamItem,
	useTeamBoardWithColumns,
} from "~/hooks/useTeamBoards";
import type { TeamColumnWithItems, TeamItem } from "~/types";
import { getColumnColor } from "~/utils/columnColors";
import { TeamBoardDialog } from "./TeamBoardDialog";
import { TeamCreateColumnDialog } from "./TeamCreateColumnDialog";
import { TeamCreateItemDialog } from "./TeamCreateItemDialog";
import { TeamEditItemDialog } from "./TeamEditItemDialog";
import { TeamKanbanColumn } from "./TeamKanbanColumn";

// System column name constant
const SYSTEM_COLUMN_NOW = "Now";

interface TeamKanbanBoardProps {
	boardId: string;
	teamId: string;
}

export function TeamKanbanBoard({ boardId, teamId }: TeamKanbanBoardProps) {
	const { data: board, isLoading, error } = useTeamBoardWithColumns(boardId);
	const moveItemMutation = useMoveTeamItem();
	const deleteItemMutation = useDeleteTeamItem();
	const deleteColumnMutation = useDeleteTeamColumn();

	const [createItemDialog, setCreateItemDialog] = useState<{
		open: boolean;
		columnId: string;
		columnName: string;
	}>({ open: false, columnId: "", columnName: "" });
	const [editItemDialog, setEditItemDialog] = useState<{
		open: boolean;
		item: TeamItem | null;
	}>({ open: false, item: null });
	const [createColumnDialog, setCreateColumnDialog] = useState(false);
	const [boardSettingsDialog, setBoardSettingsDialog] = useState(false);

	// Optimistic state: track pending moves
	const [pendingMoves, setPendingMoves] = useState<
		Map<string, PendingTeamMove>
	>(new Map());

	// Focus mode state: track which non-"Now" column is currently expanded
	const [expandedColumnId, setExpandedColumnId] = useState<string | null>(null);

	// Get first non-system, non-"Now" column as default expanded
	const defaultExpandedColumn = useMemo(() => {
		if (!board?.columns) return null;
		return board.columns.find(
			(col) => !col.isSystem || col.name !== SYSTEM_COLUMN_NOW,
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
		const optimisticColumns = applyOptimisticTeamMoves(
			board.columns,
			pendingMoves,
		);
		return {
			...board,
			columns: optimisticColumns,
		};
	}, [board, pendingMoves]);

	// Clear pending moves when Convex data reflects the change
	useEffect(() => {
		if (!board || pendingMoves.size === 0) return;

		const movesToClear: string[] = [];
		pendingMoves.forEach((move, itemId) => {
			const item = board.columns
				.flatMap((col) => col.items)
				.find((i) => i.id === itemId);

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

	// Monitor for drag and drop events
	useEffect(() => {
		return monitorForElements({
			onDrop: ({ source, location }) => {
				const destination = location.current.dropTargets[0];
				if (!destination || !optimisticBoard) return;

				const sourceData = source.data;
				const destData = destination.data;

				// Only handle item drops
				if (sourceData.type !== "item") return;

				const sourceItemId = sourceData.itemId as string;
				// Get current item position from optimistic board (accounts for previous optimistic moves)
				const currentItem = optimisticBoard.columns
					.flatMap((col) => col.items)
					.find((item) => item.id === sourceItemId);

				if (!currentItem) return;

				const sourceItem = sourceData.item as TeamItem;
				let targetColumnId: string;
				let newPosition: number;

				if (destData.type === "column") {
					// Dropped directly on a column (empty area)
					targetColumnId = destData.columnId as string;
					const targetColumn = optimisticBoard.columns.find(
						(c) => c.id === targetColumnId,
					);
					newPosition = targetColumn?.items.length || 0;
				} else if (destData.type === "item") {
					// Dropped on another item
					targetColumnId = destData.columnId as string;
					const targetColumn = optimisticBoard.columns.find(
						(c) => c.id === targetColumnId,
					);
					const targetItemId = destData.itemId as string;
					const targetIndex =
						targetColumn?.items.findIndex((i) => i.id === targetItemId) ?? -1;

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
								targetColumn?.items.findIndex((i) => i.id === sourceItemId) ??
								-1;
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
			},
		});
	}, [optimisticBoard, boardId, moveItemMutation]);

	// Handler for unfolding a column in focus mode
	const handleUnfoldColumn = useCallback((columnId: string) => {
		setExpandedColumnId(columnId);
	}, []);

	// Determine if a column should be folded
	const isColumnFolded = useCallback(
		(column: TeamColumnWithItems) => {
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

	const handleEditItem = useCallback((item: TeamItem) => {
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !board) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-destructive">Failed to load board</p>
			</div>
		);
	}

	// Use optimistic board for rendering
	const displayBoard = optimisticBoard || board;

	return (
		<div className="h-full flex flex-col">
			{/* Board Header */}
			<div className="flex items-center justify-between mb-4 px-1">
				<div>
					<h2 className="text-xl font-bold">{displayBoard.name}</h2>
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
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Column
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setBoardSettingsDialog(true)}
					>
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Kanban Columns */}
			<div className="flex-1 overflow-x-auto pb-4">
				<div className="flex gap-4 h-full min-h-[400px]">
					{displayBoard.columns.map((column, index) => (
						<TeamKanbanColumn
							key={column.id}
							column={column}
							onAddItem={handleAddItem}
							onEditItem={handleEditItem}
							onDeleteItem={handleDeleteItem}
							onDeleteColumn={handleDeleteColumn}
							isFolded={isColumnFolded(column)}
							onUnfold={handleUnfoldColumn}
							columnColor={getColumnColor(index)}
						/>
					))}

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
			<TeamCreateItemDialog
				open={createItemDialog.open}
				onOpenChange={(open) =>
					setCreateItemDialog((prev) => ({ ...prev, open }))
				}
				columnId={createItemDialog.columnId}
				boardId={boardId}
				columnName={createItemDialog.columnName}
			/>

			<TeamEditItemDialog
				open={editItemDialog.open}
				onOpenChange={(open) =>
					setEditItemDialog((prev) => ({ ...prev, open }))
				}
				item={editItemDialog.item}
				boardId={boardId}
			/>

			<TeamCreateColumnDialog
				open={createColumnDialog}
				onOpenChange={setCreateColumnDialog}
				boardId={boardId}
			/>

			<TeamBoardDialog
				open={boardSettingsDialog}
				onOpenChange={setBoardSettingsDialog}
				teamId={teamId}
				board={displayBoard}
			/>
		</div>
	);
}
