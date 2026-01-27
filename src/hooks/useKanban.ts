import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { KanbanColumnWithItems, KanbanItem } from "~/types";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

// =====================================================
// Optimistic Update Utilities
// =====================================================

export interface PendingMove {
	itemId: string;
	fromColumnId: string;
	toColumnId: string;
	newPosition: number;
	item: KanbanItem;
}

/**
 * Applies optimistic moves to columns by moving items from their original
 * positions to their target positions before the server confirms.
 */
export function applyOptimisticMoves(
	columns: KanbanColumnWithItems[],
	pendingMoves: Map<string, PendingMove>,
): KanbanColumnWithItems[] {
	if (pendingMoves.size === 0) {
		return columns;
	}

	// Create a map of columns for easy lookup
	const columnMap = new Map(columns.map((col) => [col.id, { ...col }]));

	// Process each pending move
	pendingMoves.forEach((move) => {
		const fromColumn = columnMap.get(move.fromColumnId);
		const toColumn = columnMap.get(move.toColumnId);

		if (!fromColumn || !toColumn) return;

		// Remove item from source column
		const sourceItems = fromColumn.items.filter(
			(item) => item.id !== move.itemId,
		);

		// Update positions in source column (shift items up)
		const updatedSourceItems = sourceItems.map((item, index) => ({
			...item,
			position: index,
		}));

		// Insert item into target column at new position
		const targetItems = [...toColumn.items];
		const updatedItem = {
			...move.item,
			columnId: move.toColumnId,
			position: move.newPosition,
		};

		// Remove item if it already exists in target column (for same-column moves)
		const filteredTargetItems = targetItems.filter(
			(item) => item.id !== move.itemId,
		);

		// Insert at the correct position
		filteredTargetItems.splice(move.newPosition, 0, updatedItem);

		// Update positions in target column
		const updatedTargetItems = filteredTargetItems.map((item, index) => ({
			...item,
			position: index,
		}));

		// Update column map
		columnMap.set(move.fromColumnId, {
			...fromColumn,
			items: updatedSourceItems,
		});

		columnMap.set(move.toColumnId, {
			...toColumn,
			items: updatedTargetItems,
		});
	});

	// Return columns in original order with updated items
	return columns.map((col) => columnMap.get(col.id) || col);
}

/**
 * Applies optimistic column reordering by rearranging columns based on
 * the new column order. Only "Completed" stays fixed at the end; "Now" can be reordered.
 *
 * @param columns - All columns including system columns
 * @param newColumnOrder - Array of column IDs in the new order (excluding Completed column)
 * @returns Reordered columns with updated positions
 */
export function applyOptimisticColumnReorder(
	columns: KanbanColumnWithItems[],
	newColumnOrder: string[],
): KanbanColumnWithItems[] {
	if (columns.length === 0) {
		return [];
	}

	// Separate Completed column from reorderable columns
	const completedColumn = columns.find(
		(col) => col.isSystem && col.name === "Completed",
	);
	const reorderableColumns = columns.filter(
		(col) => !(col.isSystem && col.name === "Completed"),
	);

	if (reorderableColumns.length === 0) {
		return completedColumn ? [completedColumn] : [];
	}

	// Create map of reorderable columns
	const columnMap = new Map(reorderableColumns.map((col) => [col.id, col]));

	// Reorder based on newColumnOrder
	const reorderedColumns: KanbanColumnWithItems[] = [];

	newColumnOrder.forEach((columnId) => {
		const column = columnMap.get(columnId);
		if (column) {
			reorderedColumns.push(column);
			columnMap.delete(columnId);
		}
	});

	// Add remaining columns
	columnMap.forEach((column) => {
		reorderedColumns.push(column);
	});

	// Update positions for reorderable columns (0 to N-1)
	const reorderedWithPositions = reorderedColumns.map((col, index) => ({
		...col,
		position: index,
	}));

	// Add Completed column at the end with high position
	if (completedColumn) {
		return [
			...reorderedWithPositions,
			{ ...completedColumn, position: 999999 },
		];
	}

	return reorderedWithPositions;
}

// =====================================================
// Board Hooks
// =====================================================

export function useBoards(enabled = true) {
	const { userId } = useCurrentUser();

	const boards = useQuery(
		api.kanban.getBoards,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: boards?.map((board) => ({ ...board, id: board._id })),
		isLoading: boards === undefined && enabled && !!userId,
		error: null,
	};
}

export function useBoard(boardId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const board = useQuery(
		api.kanban.getBoardById,
		!enabled || !boardId || !userId
			? "skip"
			: { id: boardId as Id<"kanbanBoards">, userId },
	);
	const normalizedBoard =
		board && typeof board === "object" ? { ...board, id: board._id } : board;

	return {
		data: normalizedBoard,
		isLoading:
			normalizedBoard === undefined && enabled && !!boardId && !!userId,
		error: null,
	};
}

export function useBoardWithColumns(boardId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const board = useQuery(
		api.kanban.getBoardWithColumns,
		!enabled || !boardId || !userId
			? "skip"
			: { id: boardId as Id<"kanbanBoards">, userId },
	);
	const normalizedBoard =
		board && typeof board === "object"
			? {
					...board,
					id: board._id,
					columns: board.columns?.map((column) => ({
						...column,
						id: column._id,
						items: column.items?.map((item) => ({
							...item,
							id: item._id,
							importance: item.importance as "low" | "medium" | "high",
							effort: item.effort as "small" | "medium" | "big",
						})),
					})),
				}
			: board;

	return {
		data: normalizedBoard,
		isLoading:
			normalizedBoard === undefined && enabled && !!boardId && !!userId,
		error: null,
	};
}

interface CreateBoardData {
	name: string;
	description?: string;
	clockifyDefaultClientId?: string;
	clockifyDefaultProjectId?: string;
}

interface MutationCallbacks<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

export function useCreateBoard() {
	const { userId } = useCurrentUser();
	const createBoard = useMutation(api.kanban.createBoard);

	return {
		mutate: async (
			data: CreateBoardData,
			callbacks?: MutationCallbacks<{ id: string }>,
		) => {
			if (!userId) {
				toast.error("You must be logged in to create a board");
				callbacks?.onError?.(
					new Error("You must be logged in to create a board"),
				);
				return;
			}
			try {
				const result = await createBoard({
					name: data.name,
					description: data.description,
					clockifyDefaultClientId: data.clockifyDefaultClientId,
					clockifyDefaultProjectId: data.clockifyDefaultProjectId,
					userId,
				});
				toast.success("Board created successfully!", {
					description: "Your new board is ready.",
				});
				callbacks?.onSuccess?.({ id: result });
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to create board", {
					description: err.message,
				});
				callbacks?.onError?.(err);
			}
		},
		mutateAsync: async (data: CreateBoardData) => {
			if (!userId) {
				throw new Error("You must be logged in to create a board");
			}
			const result = await createBoard({
				name: data.name,
				description: data.description,
				clockifyDefaultClientId: data.clockifyDefaultClientId,
				clockifyDefaultProjectId: data.clockifyDefaultProjectId,
				userId,
			});
			toast.success("Board created successfully!", {
				description: "Your new board is ready.",
			});
			return { id: result };
		},
		isPending: false,
	};
}

interface UpdateBoardData {
	id: string;
	name: string;
	description?: string;
	focusMode?: boolean;
	clockifyDefaultClientId?: string;
	clockifyDefaultProjectId?: string;
}

export function useUpdateBoard() {
	const { userId } = useCurrentUser();
	const updateBoard = useMutation(api.kanban.updateBoard);

	return {
		mutate: async (
			data: UpdateBoardData,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				toast.error("You must be logged in to update a board");
				callbacks?.onError?.(
					new Error("You must be logged in to update a board"),
				);
				return;
			}
			try {
				await updateBoard({
					id: data.id as Id<"kanbanBoards">,
					name: data.name,
					description: data.description,
					focusMode: data.focusMode,
					clockifyDefaultClientId: data.clockifyDefaultClientId,
					clockifyDefaultProjectId: data.clockifyDefaultProjectId,
					userId,
				});
				toast.success("Board updated successfully!");
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to update board", {
					description: err.message,
				});
				callbacks?.onError?.(err);
			}
		},
		isPending: false,
	};
}

export function useDeleteBoard() {
	const { userId } = useCurrentUser();
	const deleteBoard = useMutation(api.kanban.deleteBoard);

	return {
		mutate: async (boardId: string) => {
			if (!userId) {
				toast.error("You must be logged in to delete a board");
				return;
			}
			try {
				await deleteBoard({
					id: boardId as Id<"kanbanBoards">,
					userId,
				});
				toast.success("Board deleted successfully!");
			} catch (error) {
				toast.error("Failed to delete board", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Column Hooks
// =====================================================

interface CreateColumnData {
	boardId: string;
	name: string;
}

export function useCreateColumn() {
	const { userId } = useCurrentUser();
	const createColumn = useMutation(api.kanban.createColumn);

	return {
		mutate: async (
			data: CreateColumnData,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				toast.error("You must be logged in to create a column");
				callbacks?.onError?.(
					new Error("You must be logged in to create a column"),
				);
				return;
			}
			try {
				await createColumn({
					boardId: data.boardId as Id<"kanbanBoards">,
					name: data.name,
					userId,
				});
				toast.success("Column created successfully!");
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to create column", {
					description: err.message,
				});
				callbacks?.onError?.(err);
			}
		},
		isPending: false,
	};
}

interface UpdateColumnData {
	id: string;
	name: string;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useUpdateColumn() {
	const { userId } = useCurrentUser();
	const updateColumn = useMutation(api.kanban.updateColumn);

	return {
		mutate: async (data: UpdateColumnData) => {
			if (!userId) {
				toast.error("You must be logged in to update a column");
				return;
			}
			try {
				await updateColumn({
					id: data.id as Id<"kanbanColumns">,
					name: data.name,
					userId,
				});
				toast.success("Column updated successfully!");
			} catch (error) {
				toast.error("Failed to update column", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface DeleteColumnData {
	id: string;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useDeleteColumn() {
	const { userId } = useCurrentUser();
	const deleteColumn = useMutation(api.kanban.deleteColumn);

	return {
		mutate: async (data: DeleteColumnData) => {
			if (!userId) {
				toast.error("You must be logged in to delete a column");
				return;
			}
			try {
				await deleteColumn({
					id: data.id as Id<"kanbanColumns">,
					userId,
				});
				toast.success("Column deleted successfully!");
			} catch (error) {
				toast.error("Failed to delete column", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface ReorderColumnsData {
	boardId: string;
	columnOrder: Array<{ id: string; position: number }>;
}

export function useReorderColumns() {
	const { userId } = useCurrentUser();
	const reorderColumns = useMutation(api.kanban.reorderColumns);

	return {
		mutate: async (data: ReorderColumnsData) => {
			if (!userId) {
				toast.error("You must be logged in to reorder columns");
				return;
			}
			try {
				await reorderColumns({
					boardId: data.boardId as Id<"kanbanBoards">,
					columnOrder: data.columnOrder.map((item) => ({
						id: item.id as Id<"kanbanColumns">,
						position: item.position,
					})),
					userId,
				});
			} catch (error) {
				toast.error("Failed to reorder columns", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Item Hooks
// =====================================================

interface CreateItemData {
	columnId: string;
	boardId: string;
	name: string;
	description?: string;
	importance?: string;
	effort?: string;
	tags?: string[];
	clockifyProjectId?: string;
}

export function useCreateItem() {
	const { userId } = useCurrentUser();
	const createItem = useMutation(api.kanban.createItem);

	return {
		mutate: async (
			data: CreateItemData,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				toast.error("You must be logged in to create an item");
				callbacks?.onError?.(
					new Error("You must be logged in to create an item"),
				);
				return;
			}
			try {
				await createItem({
					columnId: data.columnId as Id<"kanbanColumns">,
					boardId: data.boardId as Id<"kanbanBoards">,
					name: data.name,
					description: data.description,
					importance: data.importance,
					effort: data.effort,
					tags: data.tags,
					clockifyProjectId: data.clockifyProjectId,
					userId,
				});
				toast.success("Item created successfully!");
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to create item", {
					description: err.message,
				});
				callbacks?.onError?.(err);
			}
		},
		isPending: false,
	};
}

interface UpdateItemData {
	id: string;
	name: string;
	description?: string;
	importance?: string;
	effort?: string;
	tags?: string[];
	clockifyClientId?: string;
	clockifyProjectId?: string;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useUpdateItem() {
	const { userId } = useCurrentUser();
	const updateItem = useMutation(api.kanban.updateItem);

	return {
		mutate: async (
			data: UpdateItemData,
			callbacks?: MutationCallbacks<void> & { silent?: boolean },
		) => {
			if (!userId) {
				toast.error("You must be logged in to update an item");
				callbacks?.onError?.(
					new Error("You must be logged in to update an item"),
				);
				return;
			}
			try {
				await updateItem({
					id: data.id as Id<"kanbanItems">,
					name: data.name,
					description: data.description,
					importance: data.importance,
					effort: data.effort,
					tags: data.tags,
					clockifyClientId: data.clockifyClientId,
					clockifyProjectId: data.clockifyProjectId,
					userId,
				});
				// Only show success toast if not silent mode
				if (!callbacks?.silent) {
					toast.success("Item updated successfully!");
				}
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to update item", {
					description: err.message,
				});
				callbacks?.onError?.(err);
				throw error;
			}
		},
		isPending: false,
	};
}

interface DeleteItemData {
	id: string;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useDeleteItem() {
	const { userId } = useCurrentUser();
	const deleteItem = useMutation(api.kanban.deleteItem);

	return {
		mutate: async (data: DeleteItemData) => {
			if (!userId) {
				toast.error("You must be logged in to delete an item");
				return;
			}
			try {
				await deleteItem({
					id: data.id as Id<"kanbanItems">,
					userId,
				});
				toast.success("Item deleted successfully!");
			} catch (error) {
				toast.error("Failed to delete item", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface MoveItemData {
	itemId: string;
	newColumnId: string;
	newPosition: number;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useMoveItem() {
	const { userId } = useCurrentUser();
	const moveItem = useMutation(api.kanban.moveItem);

	return {
		mutate: async (data: MoveItemData) => {
			if (!userId) {
				toast.error("You must be logged in to move an item");
				return;
			}
			try {
				await moveItem({
					itemId: data.itemId as Id<"kanbanItems">,
					newColumnId: data.newColumnId as Id<"kanbanColumns">,
					newPosition: data.newPosition,
					userId,
				});
			} catch (error) {
				toast.error("Failed to move item", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface MoveItemToBoardData {
	itemId: string;
	newBoardId: string;
	newColumnId: string;
	newPosition: number;
	sourceBoardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useMoveItemToBoard() {
	const { userId } = useCurrentUser();
	const moveItemToBoard = useMutation(api.kanban.moveItemToBoard);

	return {
		mutate: async (data: MoveItemToBoardData) => {
			if (!userId) {
				toast.error("You must be logged in to move an item");
				return;
			}
			try {
				await moveItemToBoard({
					itemId: data.itemId as Id<"kanbanItems">,
					newBoardId: data.newBoardId as Id<"kanbanBoards">,
					newColumnId: data.newColumnId as Id<"kanbanColumns">,
					newPosition: data.newPosition,
					userId,
				});
				toast.success("Item moved to another board!");
			} catch (error) {
				toast.error("Failed to move item to board", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Focus View Hooks (All Now Items)
// =====================================================

export function useAllNowItems(enabled = true) {
	const { userId } = useCurrentUser();

	const items = useQuery(
		api.kanban.getAllNowItems,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: items,
		isLoading: items === undefined && enabled && !!userId,
		error: null,
	};
}

interface CompleteItemData {
	itemId: string;
	boardId: string; // For query invalidation (not needed with Convex but keeping for compatibility)
}

export function useCompleteItem() {
	const { userId } = useCurrentUser();
	const completeItem = useMutation(api.kanban.completeItem);

	return {
		mutate: async (data: CompleteItemData) => {
			if (!userId) {
				toast.error("You must be logged in to complete an item");
				return;
			}
			try {
				await completeItem({
					itemId: data.itemId as Id<"kanbanItems">,
					userId,
				});
			} catch (error) {
				toast.error("Failed to complete item", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Helper: Ensure System Columns
// =====================================================

export function useEnsureSystemColumns() {
	const { userId } = useCurrentUser();
	const ensureSystemColumns = useMutation(api.kanban.ensureSystemColumns);

	return {
		mutate: async (boardId: string) => {
			if (!userId) return;
			try {
				await ensureSystemColumns({
					boardId: boardId as Id<"kanbanBoards">,
					userId,
				});
			} catch (error) {
				console.error("Failed to ensure system columns:", error);
			}
		},
		isPending: false,
	};
}
