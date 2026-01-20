import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getOptionalAuth, requireAuth, requireUserFromClientId } from "./auth";

// System column names - same as personal boards
export const SYSTEM_COLUMN_NOW = "Now";
export const SYSTEM_COLUMN_COMPLETED = "Completed";

// System column positions (Now at start, Completed at end)
export const SYSTEM_COLUMN_NOW_POSITION = 0;
export const SYSTEM_COLUMN_COMPLETED_POSITION = 999999;

// =====================================================
// Helper: Check team membership
// =====================================================

async function requireTeamMember(
	ctx: any,
	teamId: Id<"teams">,
	userId: string,
) {
	const membership = await ctx.db
		.query("teamMemberships")
		.withIndex("by_teamId_userId", (q: any) =>
			q.eq("teamId", teamId).eq("userId", userId),
		)
		.first();

	if (!membership) {
		throw new Error("Unauthorized - not a team member");
	}

	return membership;
}

async function requireTeamAdmin(ctx: any, teamId: Id<"teams">, userId: string) {
	const membership = await requireTeamMember(ctx, teamId, userId);

	if (membership.role === "member") {
		throw new Error("Unauthorized - must be admin or owner");
	}

	return membership;
}

// =====================================================
// Team Board Queries
// =====================================================

export const getTeamBoards = query({
	args: {
		teamId: v.id("teams"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		await requireTeamMember(ctx, args.teamId, userId);

		const boards = await ctx.db
			.query("teamBoards")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
			.collect();

		// Sort by createdAt descending
		return boards.sort((a, b) => b.createdAt - a.createdAt);
	},
});

export const getTeamBoardById = query({
	args: {
		id: v.id("teamBoards"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;
		const board = await ctx.db.get(args.id);

		if (!board) {
			return null;
		}

		if (userId) {
			try {
				await requireTeamMember(ctx, board.teamId, userId);
			} catch {
				return null;
			}
		}

		return board;
	},
});

export const getTeamBoardWithColumns = query({
	args: {
		id: v.id("teamBoards"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;
		const board = await ctx.db.get(args.id);

		if (!board) {
			return null;
		}

		if (userId) {
			try {
				await requireTeamMember(ctx, board.teamId, userId);
			} catch {
				return null;
			}
		}

		// Get columns sorted by position
		const columns = await ctx.db
			.query("teamColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.id))
			.collect();

		const sortedColumns = columns.sort((a, b) => a.position - b.position);

		// Get items for each column
		const columnsWithItems = await Promise.all(
			sortedColumns.map(async (column) => {
				const items = await ctx.db
					.query("teamItems")
					.withIndex("by_columnId", (q) => q.eq("columnId", column._id))
					.collect();

				const sortedItems = items.sort((a, b) => a.position - b.position);
				return { ...column, items: sortedItems };
			}),
		);

		// Get team info
		const team = await ctx.db.get(board.teamId);

		return {
			...board,
			columns: columnsWithItems,
			teamName: team?.name ?? "",
			teamSlug: team?.slug ?? "",
		};
	},
});

export const getAllTeamBoards = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Get all teams the user is a member of
		const memberships = await ctx.db
			.query("teamMemberships")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const teamBoards: Array<{
			_id: Id<"teamBoards">;
			_creationTime: number;
			teamId: Id<"teams">;
			name: string;
			description?: string;
			focusMode: boolean;
			createdBy: string;
			createdAt: number;
			updatedAt: number;
			teamName: string;
			teamSlug: string;
		}> = [];

		for (const membership of memberships) {
			const team = await ctx.db.get(membership.teamId);
			if (!team) continue;

			// Get all boards for this team
			const boards = await ctx.db
				.query("teamBoards")
				.withIndex("by_teamId", (q) => q.eq("teamId", membership.teamId))
				.collect();

			for (const board of boards) {
				teamBoards.push({
					...board,
					teamName: team.name,
					teamSlug: team.slug,
				});
			}
		}

		// Sort by team name, then by board name
		return teamBoards.sort((a, b) => {
			const teamCompare = a.teamName.localeCompare(b.teamName);
			if (teamCompare !== 0) return teamCompare;
			return a.name.localeCompare(b.name);
		});
	},
});

export const getAllTeamNowItems = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Get all teams the user is a member of
		const memberships = await ctx.db
			.query("teamMemberships")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const nowItems: Array<{
			_id: Id<"teamItems">;
			columnId: Id<"teamColumns">;
			boardId: Id<"teamBoards">;
			name: string;
			description?: string;
			importance: string;
			effort: string;
			tags: string[];
			position: number;
			completedAt?: number;
			createdBy: string;
			createdAt: number;
			updatedAt: number;
			boardName: string;
			teamName: string;
		}> = [];

		for (const membership of memberships) {
			const team = await ctx.db.get(membership.teamId);
			if (!team) continue;

			// Get all boards for this team
			const boards = await ctx.db
				.query("teamBoards")
				.withIndex("by_teamId", (q) => q.eq("teamId", membership.teamId))
				.collect();

			for (const board of boards) {
				// Find the "Now" column for this board
				const columns = await ctx.db
					.query("teamColumns")
					.withIndex("by_boardId", (q) => q.eq("boardId", board._id))
					.collect();

				const nowColumn = columns.find(
					(col) => col.isSystem && col.name === SYSTEM_COLUMN_NOW,
				);

				if (nowColumn) {
					const items = await ctx.db
						.query("teamItems")
						.withIndex("by_columnId", (q) => q.eq("columnId", nowColumn._id))
						.collect();

					for (const item of items) {
						nowItems.push({
							...item,
							boardName: board.name,
							teamName: team.name,
						});
					}
				}
			}
		}

		// Sort by team name, board name, then position
		return nowItems.sort((a, b) => {
			const teamCompare = a.teamName.localeCompare(b.teamName);
			if (teamCompare !== 0) return teamCompare;
			const boardCompare = a.boardName.localeCompare(b.boardName);
			if (boardCompare !== 0) return boardCompare;
			return a.position - b.position;
		});
	},
});

// =====================================================
// Team Board Mutations
// =====================================================

export const createTeamBoard = mutation({
	args: {
		teamId: v.id("teams"),
		name: v.string(),
		description: v.optional(v.string()),
		focusMode: v.optional(v.boolean()),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		await requireTeamMember(ctx, args.teamId, user.id);

		const now = Date.now();

		// Create the board
		const boardId = await ctx.db.insert("teamBoards", {
			name: args.name,
			description: args.description,
			teamId: args.teamId,
			createdBy: user.id,
			focusMode: args.focusMode ?? false,
			createdAt: now,
			updatedAt: now,
		});

		// Create system columns
		await ctx.db.insert("teamColumns", {
			boardId,
			name: SYSTEM_COLUMN_NOW,
			position: SYSTEM_COLUMN_NOW_POSITION,
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("teamColumns", {
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

export const updateTeamBoard = mutation({
	args: {
		id: v.id("teamBoards"),
		name: v.string(),
		description: v.optional(v.string()),
		focusMode: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const board = await ctx.db.get(args.id);

		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			focusMode: args.focusMode ?? board.focusMode,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteTeamBoard = mutation({
	args: { id: v.id("teamBoards") },
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const board = await ctx.db.get(args.id);

		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamAdmin(ctx, board.teamId, user.id);

		// Delete all items in the board
		const items = await ctx.db
			.query("teamItems")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.id))
			.collect();

		for (const item of items) {
			// Delete item comments
			const comments = await ctx.db
				.query("teamItemComments")
				.withIndex("by_itemId", (q) => q.eq("itemId", item._id))
				.collect();

			for (const comment of comments) {
				await ctx.db.delete(comment._id);
			}

			await ctx.db.delete(item._id);
		}

		// Delete all columns
		const columns = await ctx.db
			.query("teamColumns")
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
// Team Column Mutations
// =====================================================

export const createTeamColumn = mutation({
	args: {
		boardId: v.id("teamBoards"),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		// Get max position of non-system columns
		const columns = await ctx.db
			.query("teamColumns")
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
		const columnId = await ctx.db.insert("teamColumns", {
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

export const updateTeamColumn = mutation({
	args: {
		id: v.id("teamColumns"),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const column = await ctx.db.get(args.id);

		if (!column) {
			throw new Error("Column not found");
		}

		if (column.isSystem) {
			throw new Error("Cannot rename system columns");
		}

		const board = await ctx.db.get(column.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		await ctx.db.patch(args.id, {
			name: args.name,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteTeamColumn = mutation({
	args: { id: v.id("teamColumns") },
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const column = await ctx.db.get(args.id);

		if (!column) {
			throw new Error("Column not found");
		}

		if (column.isSystem) {
			throw new Error("Cannot delete system columns");
		}

		const board = await ctx.db.get(column.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		// Delete all items in the column
		const items = await ctx.db
			.query("teamItems")
			.withIndex("by_columnId", (q) => q.eq("columnId", args.id))
			.collect();

		for (const item of items) {
			const comments = await ctx.db
				.query("teamItemComments")
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

export const reorderTeamColumns = mutation({
	args: {
		boardId: v.id("teamBoards"),
		columnOrder: v.array(
			v.object({
				id: v.id("teamColumns"),
				position: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

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
// Team Item Mutations
// =====================================================

export const createTeamItem = mutation({
	args: {
		columnId: v.id("teamColumns"),
		boardId: v.id("teamBoards"),
		name: v.string(),
		description: v.optional(v.string()),
		importance: v.optional(v.string()),
		effort: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const board = await ctx.db.get(args.boardId);

		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		const column = await ctx.db.get(args.columnId);
		if (!column || column.boardId !== args.boardId) {
			throw new Error("Column not found");
		}

		// Get max position in the column
		const items = await ctx.db
			.query("teamItems")
			.withIndex("by_columnId", (q) => q.eq("columnId", args.columnId))
			.collect();

		const maxPosition =
			items.length > 0 ? Math.max(...items.map((item) => item.position)) : 0;

		const now = Date.now();
		const itemId = await ctx.db.insert("teamItems", {
			columnId: args.columnId,
			boardId: args.boardId,
			name: args.name,
			description: args.description,
			importance: args.importance ?? "medium",
			effort: args.effort ?? "medium",
			tags: args.tags ?? [],
			position: maxPosition + 1,
			createdBy: user.id,
			createdAt: now,
			updatedAt: now,
		});

		return itemId;
	},
});

export const updateTeamItem = mutation({
	args: {
		id: v.id("teamItems"),
		name: v.string(),
		description: v.optional(v.string()),
		importance: v.optional(v.string()),
		effort: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const item = await ctx.db.get(args.id);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

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

export const deleteTeamItem = mutation({
	args: { id: v.id("teamItems") },
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const item = await ctx.db.get(args.id);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		// Delete item comments
		const comments = await ctx.db
			.query("teamItemComments")
			.withIndex("by_itemId", (q) => q.eq("itemId", args.id))
			.collect();

		for (const comment of comments) {
			await ctx.db.delete(comment._id);
		}

		await ctx.db.delete(args.id);

		return { success: true };
	},
});

export const moveTeamItem = mutation({
	args: {
		itemId: v.id("teamItems"),
		newColumnId: v.id("teamColumns"),
		newPosition: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const item = await ctx.db.get(args.itemId);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

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
			columnId: Id<"teamColumns">;
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

export const completeTeamItem = mutation({
	args: { itemId: v.id("teamItems") },
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const item = await ctx.db.get(args.itemId);

		if (!item) {
			throw new Error("Item not found");
		}

		const board = await ctx.db.get(item.boardId);
		if (!board) {
			throw new Error("Board not found");
		}

		await requireTeamMember(ctx, board.teamId, user.id);

		// Find the "Completed" column
		const columns = await ctx.db
			.query("teamColumns")
			.withIndex("by_boardId", (q) => q.eq("boardId", item.boardId))
			.collect();

		const completedColumn = columns.find(
			(col) => col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED,
		);

		if (!completedColumn) {
			throw new Error("Completed column not found");
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
