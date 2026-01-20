import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getOptionalAuth, requireUserFromClientId } from "./auth";

// System column names - these are automatically created and protected
export const SYSTEM_COLUMN_NOW = "Now";
export const SYSTEM_COLUMN_COMPLETED = "Completed";

// System column positions (Now at start, Completed at end)
export const SYSTEM_COLUMN_NOW_POSITION = 0;
export const SYSTEM_COLUMN_COMPLETED_POSITION = 999999;

// =====================================================
// Board Queries
// =====================================================

export const getBoards = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Use userId from args (client-side) or try to get from auth context
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			// Return empty array if no user ID available
			return [];
		}
		const boards = await ctx.db
			.query("kanbanBoards")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		// Sort by createdAt descending
		return boards.sort((a, b) => b.createdAt - a.createdAt);
	},
});

export const getBoardById = query({
	args: {
		id: v.id("kanbanBoards"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;
		const board = await ctx.db.get(args.id);

		if (!board) {
			return null;
		}
		// Verify ownership if we have a userId
		if (userId && board.userId !== userId) {
			return null;
		}

		return board;
	},
});

export const getBoardWithColumns = query({
	args: {
		id: v.id("kanbanBoards"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;
		const board = await ctx.db.get(args.id);

		if (!board) {
			return null;
		}
		// Verify ownership if we have a userId
		if (userId && board.userId !== userId) {
			return null;
		}

		// Get columns sorted by position
		const columns = await ctx.db
			.query("kanbanColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.id))
			.collect();

		const sortedColumns = columns.sort((a, b) => a.position - b.position);

		// Get items for each column
		const columnsWithItems = await Promise.all(
			sortedColumns.map(async (column) => {
				const items = await ctx.db
					.query("kanbanItems")
					.withIndex("by_columnId", (q) => q.eq("columnId", column._id))
					.collect();

				const sortedItems = items.sort((a, b) => a.position - b.position);
				return { ...column, items: sortedItems };
			}),
		);

		return { ...board, columns: columnsWithItems };
	},
});

export const getAllNowItems = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			// Return empty array if no user ID available
			return [];
		}

		// Get all boards for the user
		const boards = await ctx.db
			.query("kanbanBoards")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const nowItems: Array<{
			_id: Id<"kanbanItems">;
			columnId: Id<"kanbanColumns">;
			boardId: Id<"kanbanBoards">;
			name: string;
			description?: string;
			importance: string;
			effort: string;
			tags: string[];
			position: number;
			completedAt?: number;
			createdAt: number;
			updatedAt: number;
			boardName: string;
		}> = [];

		for (const board of boards) {
			// Find the "Now" column for this board
			const columns = await ctx.db
				.query("kanbanColumns")
				.withIndex("by_boardId", (q) => q.eq("boardId", board._id))
				.collect();

			const nowColumn = columns.find(
				(col) => col.isSystem && col.name === SYSTEM_COLUMN_NOW,
			);

			if (nowColumn) {
				const items = await ctx.db
					.query("kanbanItems")
					.withIndex("by_columnId", (q) => q.eq("columnId", nowColumn._id))
					.collect();

				for (const item of items) {
					nowItems.push({
						...item,
						boardName: board.name,
					});
				}
			}
		}

		// Sort by board name, then position
		return nowItems.sort((a, b) => {
			const nameCompare = a.boardName.localeCompare(b.boardName);
			if (nameCompare !== 0) return nameCompare;
			return a.position - b.position;
		});
	},
});

// =====================================================
// Board Mutations
// =====================================================

export const createBoard = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const now = Date.now();

		// Create the board
		const boardId = await ctx.db.insert("kanbanBoards", {
			name: args.name,
			description: args.description,
			userId: user.id,
			focusMode: false,
			createdAt: now,
			updatedAt: now,
		});

		// Create system columns
		await ctx.db.insert("kanbanColumns", {
			boardId,
			name: SYSTEM_COLUMN_NOW,
			position: SYSTEM_COLUMN_NOW_POSITION,
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("kanbanColumns", {
			boardId,
			name: SYSTEM_COLUMN_COMPLETED,
			position: SYSTEM_COLUMN_COMPLETED_POSITION,
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		return boardId;
	},
});

export const updateBoard = mutation({
	args: {
		id: v.id("kanbanBoards"),
		name: v.string(),
		description: v.optional(v.string()),
		focusMode: v.optional(v.boolean()),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.id);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			focusMode: args.focusMode ?? board.focusMode,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteBoard = mutation({
	args: { id: v.id("kanbanBoards"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.id);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Delete all items in the board
		const items = await ctx.db
			.query("kanbanItems")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.id))
			.collect();

		for (const item of items) {
			// Delete item comments
			const comments = await ctx.db
				.query("kanbanItemComments")
				.withIndex("by_itemId", (q) => q.eq("itemId", item._id))
				.collect();

			for (const comment of comments) {
				await ctx.db.delete(comment._id);
			}

			await ctx.db.delete(item._id);
		}

		// Delete all columns in the board
		const columns = await ctx.db
			.query("kanbanColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.id))
			.collect();

		for (const column of columns) {
			await ctx.db.delete(column._id);
		}

		// Delete the board
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

// =====================================================
// Column Mutations
// =====================================================

export const createColumn = mutation({
	args: {
		boardId: v.id("kanbanBoards"),
		name: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Get max position of non-system columns
		const columns = await ctx.db
			.query("kanbanColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
			.collect();

		const userColumns = columns.filter((col) => !col.isSystem);
		// Ensure new columns are positioned between Now (0) and Completed (999999)
		// Start at position 1 if no user columns exist
		const maxPosition =
			userColumns.length > 0
				? Math.max(...userColumns.map((col) => col.position))
				: 0;

		const now = Date.now();
		const columnId = await ctx.db.insert("kanbanColumns", {
			boardId: args.boardId,
			name: args.name,
			position: Math.max(maxPosition + 1, 1),
			isSystem: false,
			createdAt: now,
			updatedAt: now,
		});

		return columnId;
	},
});

export const updateColumn = mutation({
	args: {
		id: v.id("kanbanColumns"),
		name: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const column = await ctx.db.get(args.id);

		if (!column) {
			throw new Error("Column not found");
		}

		if (column.isSystem) {
			throw new Error("Cannot rename system columns ('Now' and 'Completed')");
		}

		const board = await ctx.db.get(column.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteColumn = mutation({
	args: { id: v.id("kanbanColumns"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const column = await ctx.db.get(args.id);

		if (!column) {
			throw new Error("Column not found");
		}

		if (column.isSystem) {
			throw new Error("Cannot delete system columns ('Now' and 'Completed')");
		}

		const board = await ctx.db.get(column.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Delete all items in the column
		const items = await ctx.db
			.query("kanbanItems")
			.withIndex("by_columnId", (q) => q.eq("columnId", args.id))
			.collect();

		for (const item of items) {
			// Delete item comments
			const comments = await ctx.db
				.query("kanbanItemComments")
				.withIndex("by_itemId", (q) => q.eq("itemId", item._id))
				.collect();

			for (const comment of comments) {
				await ctx.db.delete(comment._id);
			}

			await ctx.db.delete(item._id);
		}

		await ctx.db.delete(args.id);

		return { success: true };
	},
});

export const reorderColumns = mutation({
	args: {
		boardId: v.id("kanbanBoards"),
		columnOrder: v.array(
			v.object({
				id: v.id("kanbanColumns"),
				position: v.number(),
			}),
		),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Verify Completed column is not being reordered
		for (const item of args.columnOrder) {
			const column = await ctx.db.get(item.id);
			if (!column) {
				throw new Error(`Column ${item.id} not found`);
			}

			// Only Completed column cannot be reordered
			if (column.isSystem && column.name === SYSTEM_COLUMN_COMPLETED) {
				throw new Error(
					"Cannot reorder Completed column - it must stay at the end",
				);
			}
		}

		// Update positions
		const now = Date.now();
		for (const item of args.columnOrder) {
			await ctx.db.patch(item.id, {
				position: item.position,
				updatedAt: now,
			});
		}

		return { success: true };
	},
});

// =====================================================
// Item Mutations
// =====================================================

export const createItem = mutation({
	args: {
		columnId: v.id("kanbanColumns"),
		boardId: v.id("kanbanBoards"),
		name: v.string(),
		description: v.optional(v.string()),
		importance: v.optional(v.string()),
		effort: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		const column = await ctx.db.get(args.columnId);
		if (!column || column.boardId !== args.boardId) {
			throw new Error("Column not found");
		}

		// Get max position in the column
		const items = await ctx.db
			.query("kanbanItems")
			.withIndex("by_columnId", (q) => q.eq("columnId", args.columnId))
			.collect();

		const maxPosition =
			items.length > 0 ? Math.max(...items.map((item) => item.position)) : 0;

		const now = Date.now();
		const itemId = await ctx.db.insert("kanbanItems", {
			columnId: args.columnId,
			boardId: args.boardId,
			name: args.name,
			description: args.description,
			importance: args.importance ?? "medium",
			effort: args.effort ?? "medium",
			tags: args.tags ?? [],
			position: maxPosition + 1,
			createdAt: now,
			updatedAt: now,
		});

		return itemId;
	},
});

export const updateItem = mutation({
	args: {
		id: v.id("kanbanItems"),
		name: v.string(),
		description: v.optional(v.string()),
		importance: v.optional(v.string()),
		effort: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const item = await ctx.db.get(args.id);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			importance: args.importance ?? item.importance,
			effort: args.effort ?? item.effort,
			tags: args.tags ?? item.tags,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteItem = mutation({
	args: { id: v.id("kanbanItems"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const item = await ctx.db.get(args.id);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Delete item comments
		const comments = await ctx.db
			.query("kanbanItemComments")
			.withIndex("by_itemId", (q) => q.eq("itemId", args.id))
			.collect();

		for (const comment of comments) {
			await ctx.db.delete(comment._id);
		}

		await ctx.db.delete(args.id);

		return { success: true };
	},
});

export const moveItem = mutation({
	args: {
		itemId: v.id("kanbanItems"),
		newColumnId: v.id("kanbanColumns"),
		newPosition: v.number(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const item = await ctx.db.get(args.itemId);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		const newColumn = await ctx.db.get(args.newColumnId);
		if (!newColumn || newColumn.boardId !== item.boardId) {
			throw new Error("Invalid target column");
		}

		// Check if moving to/from Completed column
		const currentColumn = await ctx.db.get(item.columnId);
		const isMovingToCompleted =
			newColumn.isSystem && newColumn.name === SYSTEM_COLUMN_COMPLETED;
		const isMovingFromCompleted =
			currentColumn?.isSystem && currentColumn.name === SYSTEM_COLUMN_COMPLETED;

		const updateData: {
			columnId: Id<"kanbanColumns">;
			position: number;
			updatedAt: number;
			completedAt?: number;
		} = {
			columnId: args.newColumnId,
			position: args.newPosition,
			updatedAt: Date.now(),
		};

		if (isMovingToCompleted && !item.completedAt) {
			updateData.completedAt = Date.now();
		} else if (isMovingFromCompleted && !isMovingToCompleted) {
			// Clear completedAt by setting to undefined (Convex will remove the field)
			await ctx.db.patch(args.itemId, {
				columnId: args.newColumnId,
				position: args.newPosition,
				updatedAt: Date.now(),
				completedAt: undefined,
			});
			return args.itemId;
		}

		await ctx.db.patch(args.itemId, updateData);

		return args.itemId;
	},
});

export const moveItemToBoard = mutation({
	args: {
		itemId: v.id("kanbanItems"),
		newBoardId: v.id("kanbanBoards"),
		newColumnId: v.id("kanbanColumns"),
		newPosition: v.number(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const item = await ctx.db.get(args.itemId);

		if (!item) {
			throw new Error("Item not found");
		}

		// Verify source board ownership
		const sourceBoard = await ctx.db.get(item.boardId);
		if (!sourceBoard || sourceBoard.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Verify target board ownership
		const targetBoard = await ctx.db.get(args.newBoardId);
		if (!targetBoard || targetBoard.userId !== user.id) {
			throw new Error("Unauthorized - cannot move to target board");
		}

		const column = await ctx.db.get(args.newColumnId);
		if (!column || column.boardId !== args.newBoardId) {
			throw new Error("Invalid target column");
		}

		await ctx.db.patch(args.itemId, {
			boardId: args.newBoardId,
			columnId: args.newColumnId,
			position: args.newPosition,
			updatedAt: Date.now(),
		});

		return args.itemId;
	},
});

export const completeItem = mutation({
	args: { itemId: v.id("kanbanItems"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const item = await ctx.db.get(args.itemId);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board || board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		// Find the "Completed" column for this board
		const columns = await ctx.db
			.query("kanbanColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", item.boardId))
			.collect();

		const completedColumn = columns.find(
			(col) => col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED,
		);

		if (!completedColumn) {
			throw new Error("Completed column not found for this board");
		}

		await ctx.db.patch(args.itemId, {
			columnId: completedColumn._id,
			position: 0,
			completedAt: Date.now(),
			updatedAt: Date.now(),
		});

		return args.itemId;
	},
});

// =====================================================
// Helper: Ensure system columns exist
// =====================================================

export const ensureSystemColumns = mutation({
	args: { boardId: v.id("kanbanBoards"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}
		if (board.userId !== user.id) {
			throw new Error("Unauthorized");
		}

		const columns = await ctx.db
			.query("kanbanColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
			.collect();

		const hasNowColumn = columns.some(
			(col) => col.isSystem && col.name === SYSTEM_COLUMN_NOW,
		);
		const hasCompletedColumn = columns.some(
			(col) => col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED,
		);

		const now = Date.now();

		if (!hasNowColumn) {
			await ctx.db.insert("kanbanColumns", {
				boardId: args.boardId,
				name: SYSTEM_COLUMN_NOW,
				position: SYSTEM_COLUMN_NOW_POSITION,
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			});
		}

		if (!hasCompletedColumn) {
			await ctx.db.insert("kanbanColumns", {
				boardId: args.boardId,
				name: SYSTEM_COLUMN_COMPLETED,
				position: SYSTEM_COLUMN_COMPLETED_POSITION,
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			});
		}

		return { success: true };
	},
});

// =====================================================
// Migration: Move "Now" columns to position 0
// =====================================================

export const migrateNowColumnPositions = mutation({
	args: {},
	handler: async (ctx) => {
		// Migrate personal kanban boards
		const kanbanColumns = await ctx.db.query("kanbanColumns").collect();
		let kanbanUpdated = 0;

		for (const column of kanbanColumns) {
			if (
				column.isSystem &&
				column.name === SYSTEM_COLUMN_NOW &&
				column.position === 999998
			) {
				await ctx.db.patch(column._id, {
					position: SYSTEM_COLUMN_NOW_POSITION,
					updatedAt: Date.now(),
				});
				kanbanUpdated++;
			}
		}

		// Migrate team boards
		const teamColumns = await ctx.db.query("teamColumns").collect();
		let teamUpdated = 0;

		for (const column of teamColumns) {
			if (
				column.isSystem &&
				column.name === SYSTEM_COLUMN_NOW &&
				column.position === 999998
			) {
				await ctx.db.patch(column._id, {
					position: SYSTEM_COLUMN_NOW_POSITION,
					updatedAt: Date.now(),
				});
				teamUpdated++;
			}
		}

		return {
			success: true,
			kanbanColumnsUpdated: kanbanUpdated,
			teamColumnsUpdated: teamUpdated,
		};
	},
});
