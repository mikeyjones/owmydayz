import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { TeamColumnWithItems, TeamItem } from "~/types";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

// Helper to normalize Convex data (_id -> id)
function normalizeTeamBoard<T extends { _id: any }>(
	board: T | null | undefined,
): (T & { id: string }) | null | undefined {
	if (!board || typeof board !== "object") return board as null | undefined;
	return { ...board, id: board._id };
}

function normalizeTeamBoards<T extends { _id: any }>(
	boards: T[] | undefined,
): (T & { id: string })[] | undefined {
	return boards?.map((board) => ({ ...board, id: board._id }));
}

function normalizeTeamBoardWithColumns(
	board: any | null | undefined,
): any | null | undefined {
	if (!board || typeof board !== "object") return board as null | undefined;
	return {
		...board,
		id: board._id,
		columns: board.columns?.map((column: any) => ({
			...column,
			id: column._id,
			items:
				column.items?.map((item: any) => ({
					...item,
					id: item._id,
					importance: item.importance as "low" | "medium" | "high",
					effort: item.effort as "small" | "medium" | "big",
				})) || [],
		})) || [],
	};
}

// =====================================================
// Optimistic Update Utilities (Team Boards)
// =====================================================

export interface PendingTeamMove {
	itemId: string;
	fromColumnId: string;
	toColumnId: string;
	newPosition: number;
	item: TeamItem;
}

/**
 * Applies optimistic moves to team board columns by moving items from their original
 * positions to their target positions before the server confirms.
 */
export function applyOptimisticTeamMoves(
	columns: TeamColumnWithItems[],
	pendingMoves: Map<string, PendingTeamMove>,
): TeamColumnWithItems[] {
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
 * the new column order while keeping system columns at the end.
 *
 * @param columns - All columns including system columns
 * @param newColumnOrder - Array of column IDs in the new order (excluding system columns)
 * @returns Reordered columns with updated positions
 */
export function applyOptimisticTeamColumnReorder(
	columns: TeamColumnWithItems[],
	newColumnOrder: string[],
): TeamColumnWithItems[] {
	if (columns.length === 0) {
		return [];
	}

	// Separate user columns from system columns
	const systemColumns = columns.filter((col) => col.isSystem);
	const userColumns = columns.filter((col) => !col.isSystem);

	// If no user columns, just return original columns
	if (userColumns.length === 0) {
		return columns;
	}

	// Create a map of columns for easy lookup
	const columnMap = new Map(userColumns.map((col) => [col.id, col]));

	// Reorder user columns based on newColumnOrder
	const reorderedUserColumns: TeamColumnWithItems[] = [];

	// Add columns in the new order
	newColumnOrder.forEach((columnId) => {
		const column = columnMap.get(columnId);
		if (column) {
			reorderedUserColumns.push(column);
			columnMap.delete(columnId); // Remove from map to track what's left
		}
	});

	// Add any remaining columns that weren't in newColumnOrder
	columnMap.forEach((column) => {
		reorderedUserColumns.push(column);
	});

	// Update positions for user columns
	const userColumnsWithPositions = reorderedUserColumns.map((col, index) => ({
		...col,
		position: index,
	}));

	// Add system columns at the end with updated positions
	const systemColumnsWithPositions = systemColumns.map((col, index) => ({
		...col,
		position: userColumnsWithPositions.length + index,
	}));

	// Combine user and system columns
	return [...userColumnsWithPositions, ...systemColumnsWithPositions];
}

// =====================================================
// Team Board Hooks
// =====================================================

export function useTeamBoards(teamId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const boards = useQuery(
		api.teamBoards.getTeamBoards,
		!enabled || !teamId || !userId
			? "skip"
			: { teamId: teamId as Id<"teams">, userId },
	);

	return {
		data: normalizeTeamBoards(boards),
		isLoading: boards === undefined && enabled && !!teamId && !!userId,
		error: null,
	};
}

export function useAllTeamBoards(enabled = true) {
	const { userId } = useCurrentUser();

	const boards = useQuery(
		api.teamBoards.getAllTeamBoards,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: normalizeTeamBoards(boards),
		isLoading: boards === undefined && enabled && !!userId,
		error: null,
	};
}

export function useTeamBoard(boardId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const board = useQuery(
		api.teamBoards.getTeamBoardById,
		!enabled || !boardId || !userId
			? "skip"
			: { id: boardId as Id<"teamBoards">, userId },
	);

	return {
		data: normalizeTeamBoard(board),
		isLoading: board === undefined && enabled && !!boardId && !!userId,
		error: null,
	};
}

export function useTeamBoardWithColumns(boardId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const board = useQuery(
		api.teamBoards.getTeamBoardWithColumns,
		!enabled || !boardId || !userId
			? "skip"
			: { id: boardId as Id<"teamBoards">, userId },
	);

	return {
		data: normalizeTeamBoardWithColumns(board),
		isLoading: board === undefined && enabled && !!boardId && !!userId,
		error: null,
	};
}

interface CreateTeamBoardData {
	teamId: string;
	name: string;
	description?: string;
}

export function useCreateTeamBoard() {
	const { userId } = useCurrentUser();
	const createTeamBoard = useMutation(api.teamBoards.createTeamBoard);

	return {
		mutate: async (data: CreateTeamBoardData) => {
			if (!userId) {
				toast.error("You must be logged in to create a board");
				return;
			}
			try {
				await createTeamBoard({
					teamId: data.teamId as Id<"teams">,
					name: data.name,
					description: data.description,
					userId,
				});
				toast.success("Board created successfully!", {
					description: "Your new team board is ready.",
				});
			} catch (error) {
				toast.error("Failed to create board", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface UpdateTeamBoardData {
	id: string;
	name: string;
	description?: string;
	focusMode?: boolean;
	teamId: string; // For context
}

export function useUpdateTeamBoard() {
	const updateTeamBoard = useMutation(api.teamBoards.updateTeamBoard);

	return {
		mutate: async (data: UpdateTeamBoardData) => {
			try {
				await updateTeamBoard({
					id: data.id as Id<"teamBoards">,
					name: data.name,
					description: data.description,
					focusMode: data.focusMode,
				});
				toast.success("Board updated successfully!");
			} catch (error) {
				toast.error("Failed to update board", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface DeleteTeamBoardData {
	id: string;
	teamId: string; // For context
}

export function useDeleteTeamBoard() {
	const deleteTeamBoard = useMutation(api.teamBoards.deleteTeamBoard);

	return {
		mutate: async (data: DeleteTeamBoardData) => {
			try {
				await deleteTeamBoard({
					id: data.id as Id<"teamBoards">,
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
// Team Column Hooks
// =====================================================

interface CreateTeamColumnData {
	boardId: string;
	name: string;
}

export function useCreateTeamColumn() {
	const createTeamColumn = useMutation(api.teamBoards.createTeamColumn);

	return {
		mutate: async (data: CreateTeamColumnData) => {
			try {
				await createTeamColumn({
					boardId: data.boardId as Id<"teamBoards">,
					name: data.name,
				});
				toast.success("Column created successfully!");
			} catch (error) {
				toast.error("Failed to create column", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface UpdateTeamColumnData {
	id: string;
	name: string;
	boardId: string; // For context
}

export function useUpdateTeamColumn() {
	const updateTeamColumn = useMutation(api.teamBoards.updateTeamColumn);

	return {
		mutate: async (data: UpdateTeamColumnData) => {
			try {
				await updateTeamColumn({
					id: data.id as Id<"teamColumns">,
					name: data.name,
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

interface DeleteTeamColumnData {
	id: string;
	boardId: string; // For context
}

export function useDeleteTeamColumn() {
	const deleteTeamColumn = useMutation(api.teamBoards.deleteTeamColumn);

	return {
		mutate: async (data: DeleteTeamColumnData) => {
			try {
				await deleteTeamColumn({
					id: data.id as Id<"teamColumns">,
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

interface ReorderTeamColumnsData {
	boardId: string;
	columnOrder: Array<{ id: string; position: number }>;
}

export function useReorderTeamColumns() {
	const reorderTeamColumns = useMutation(api.teamBoards.reorderTeamColumns);

	return {
		mutate: async (data: ReorderTeamColumnsData) => {
			try {
				await reorderTeamColumns({
					boardId: data.boardId as Id<"teamBoards">,
					columnOrder: data.columnOrder.map((item) => ({
						id: item.id as Id<"teamColumns">,
						position: item.position,
					})),
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
// Team Item Hooks
// =====================================================

interface CreateTeamItemData {
	columnId: string;
	boardId: string;
	name: string;
	description?: string;
	importance?: string;
	effort?: string;
	tags?: string[];
}

export function useCreateTeamItem() {
	const createTeamItem = useMutation(api.teamBoards.createTeamItem);

	return {
		mutate: async (data: CreateTeamItemData) => {
			try {
				await createTeamItem({
					columnId: data.columnId as Id<"teamColumns">,
					boardId: data.boardId as Id<"teamBoards">,
					name: data.name,
					description: data.description,
					importance: data.importance,
					effort: data.effort,
					tags: data.tags,
				});
				toast.success("Item created successfully!");
			} catch (error) {
				toast.error("Failed to create item", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface UpdateTeamItemData {
	id: string;
	name: string;
	description?: string;
	importance?: string;
	effort?: string;
	tags?: string[];
	boardId: string; // For context
}

interface MutationCallbacks<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

export function useUpdateTeamItem() {
	const updateTeamItem = useMutation(api.teamBoards.updateTeamItem);

	return {
		mutate: async (
			data: UpdateTeamItemData,
			callbacks?: MutationCallbacks<void>,
		) => {
			try {
				await updateTeamItem({
					id: data.id as Id<"teamItems">,
					name: data.name,
					description: data.description,
					importance: data.importance,
					effort: data.effort,
					tags: data.tags,
				});
				toast.success("Item updated successfully!");
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

interface DeleteTeamItemData {
	id: string;
	boardId: string; // For context
}

export function useDeleteTeamItem() {
	const deleteTeamItem = useMutation(api.teamBoards.deleteTeamItem);

	return {
		mutate: async (data: DeleteTeamItemData) => {
			try {
				await deleteTeamItem({
					id: data.id as Id<"teamItems">,
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

interface MoveTeamItemData {
	itemId: string;
	newColumnId: string;
	newPosition: number;
	boardId: string; // For context
}

export function useMoveTeamItem() {
	const moveTeamItem = useMutation(api.teamBoards.moveTeamItem);

	return {
		mutate: async (data: MoveTeamItemData) => {
			try {
				await moveTeamItem({
					itemId: data.itemId as Id<"teamItems">,
					newColumnId: data.newColumnId as Id<"teamColumns">,
					newPosition: data.newPosition,
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

// =====================================================
// Focus View Hooks (All Now Items from Team Boards)
// =====================================================

export function useAllTeamNowItems(enabled = true) {
	const { userId } = useCurrentUser();

	const items = useQuery(
		api.teamBoards.getAllTeamNowItems,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: items?.map((item) => ({ ...item, id: item._id })),
		isLoading: items === undefined && enabled && !!userId,
		error: null,
	};
}

interface CompleteTeamItemData {
	itemId: string;
	boardId: string; // For context
}

export function useCompleteTeamItem() {
	const completeTeamItem = useMutation(api.teamBoards.completeTeamItem);

	return {
		mutate: async (data: CompleteTeamItemData) => {
			try {
				await completeTeamItem({
					itemId: data.itemId as Id<"teamItems">,
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
