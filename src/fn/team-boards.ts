import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createTeamBoard,
  updateTeamBoard,
  deleteTeamBoard,
  findTeamBoardById,
  findTeamBoardsByTeamId,
  findTeamBoardsByUserId,
  findTeamBoardWithColumnsAndItems,
  createColumn,
  updateColumn,
  deleteColumn,
  findColumnById,
  getMaxColumnPosition,
  createItem,
  updateItem,
  deleteItem,
  findItemById,
  getMaxItemPosition,
  moveItem,
  ensureSystemColumnsExist,
  findAllTeamNowItems,
  findCompletedColumnForBoard,
  SYSTEM_COLUMN_COMPLETED,
} from "~/data-access/team-boards";
import { hasTeamRole, isTeamMember } from "~/data-access/teams";
import { KANBAN_IMPORTANCE_VALUES, KANBAN_EFFORT_VALUES } from "~/db/schema";

// =====================================================
// Team Board Server Functions
// =====================================================

const boardFormSchema = z.object({
  teamId: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

export const createTeamBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(boardFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Verify team membership
    const isMember = await isTeamMember(data.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized: You are not a member of this team");
    }

    const boardData = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || null,
      teamId: data.teamId,
      createdBy: context.userId,
    };

    const newBoard = await createTeamBoard(boardData);
    return newBoard;
  });

export const getTeamBoardsFn = createServerFn()
  .inputValidator(z.object({ teamId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Verify team membership
    const isMember = await isTeamMember(data.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    return await findTeamBoardsByTeamId(data.teamId);
  });

// Get all team boards for the current user (across all their teams)
export const getAllTeamBoardsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findTeamBoardsByUserId(context.userId);
  });

export const getTeamBoardByIdFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const board = await findTeamBoardById(data.id);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    return board;
  });

export const getTeamBoardWithColumnsFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const basicBoard = await findTeamBoardById(data.id);
    if (!basicBoard) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(basicBoard.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    // Ensure system columns exist
    await ensureSystemColumnsExist(data.id);

    const board = await findTeamBoardWithColumnsAndItems(data.id);
    if (!board) {
      throw new Error("Board not found");
    }

    return board;
  });

const updateBoardSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

export const updateTeamBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateBoardSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingBoard = await findTeamBoardById(data.id);
    if (!existingBoard) {
      throw new Error("Board not found");
    }

    // Check permission: owner/admin can edit any board, creator can edit their own
    const isAdminOrOwner = await hasTeamRole(existingBoard.teamId, context.userId, "admin");
    const isCreator = existingBoard.createdBy === context.userId;

    if (!isAdminOrOwner && !isCreator) {
      throw new Error("Unauthorized: Only board creator, team admin, or owner can update this board");
    }

    const updatedBoard = await updateTeamBoard(data.id, {
      name: data.name,
      description: data.description || null,
    });
    return updatedBoard;
  });

export const deleteTeamBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingBoard = await findTeamBoardById(data.id);
    if (!existingBoard) {
      throw new Error("Board not found");
    }

    // Check permission: owner/admin can delete any board, creator can delete their own
    const isAdminOrOwner = await hasTeamRole(existingBoard.teamId, context.userId, "admin");
    const isCreator = existingBoard.createdBy === context.userId;

    if (!isAdminOrOwner && !isCreator) {
      throw new Error("Unauthorized: Only board creator, team admin, or owner can delete this board");
    }

    await deleteTeamBoard(data.id);
    return { success: true };
  });

// =====================================================
// Team Column Server Functions
// =====================================================

const columnFormSchema = z.object({
  boardId: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

export const createTeamColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(columnFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const board = await findTeamBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const maxPosition = await getMaxColumnPosition(data.boardId);

    const columnData = {
      id: crypto.randomUUID(),
      boardId: data.boardId,
      name: data.name,
      position: maxPosition + 1,
    };

    const newColumn = await createColumn(columnData);
    return newColumn;
  });

const updateColumnSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

export const updateTeamColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateColumnSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const column = await findColumnById(data.id);
    if (!column) {
      throw new Error("Column not found");
    }

    if (column.isSystem) {
      throw new Error("Cannot rename system columns ('Now' and 'Completed')");
    }

    const board = await findTeamBoardById(column.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const updatedColumn = await updateColumn(data.id, {
      name: data.name,
    });
    return updatedColumn;
  });

export const deleteTeamColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const column = await findColumnById(data.id);
    if (!column) {
      throw new Error("Column not found");
    }

    if (column.isSystem) {
      throw new Error("Cannot delete system columns ('Now' and 'Completed')");
    }

    const board = await findTeamBoardById(column.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    await deleteColumn(data.id);
    return { success: true };
  });

const reorderColumnsSchema = z.object({
  boardId: z.string(),
  columnOrder: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});

export const reorderTeamColumnsFn = createServerFn({
  method: "POST",
})
  .inputValidator(reorderColumnsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const board = await findTeamBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    // Check if any system columns are being reordered
    for (const item of data.columnOrder) {
      const column = await findColumnById(item.id);
      if (!column) {
        throw new Error(`Column ${item.id} not found`);
      }
      if (column.isSystem) {
        throw new Error("Cannot reorder system columns ('Now' and 'Completed')");
      }
    }

    // Update positions for each column
    for (const item of data.columnOrder) {
      await updateColumn(item.id, { position: item.position });
    }

    return { success: true };
  });

// =====================================================
// Team Item Server Functions
// =====================================================

const itemFormSchema = z.object({
  columnId: z.string(),
  boardId: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  importance: z.enum(KANBAN_IMPORTANCE_VALUES).optional().default("medium"),
  effort: z.enum(KANBAN_EFFORT_VALUES).optional().default("medium"),
  tags: z.array(z.string()).optional().default([]),
});

export const createTeamItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(itemFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const board = await findTeamBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const column = await findColumnById(data.columnId);
    if (!column || column.boardId !== data.boardId) {
      throw new Error("Column not found");
    }

    const maxPosition = await getMaxItemPosition(data.columnId);

    const itemData = {
      id: crypto.randomUUID(),
      columnId: data.columnId,
      boardId: data.boardId,
      name: data.name,
      description: data.description || null,
      importance: data.importance,
      effort: data.effort,
      tags: data.tags,
      position: maxPosition + 1,
      createdBy: context.userId,
    };

    const newItem = await createItem(itemData);
    return newItem;
  });

const updateItemSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  importance: z.enum(KANBAN_IMPORTANCE_VALUES).optional(),
  effort: z.enum(KANBAN_EFFORT_VALUES).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTeamItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateItemSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.id);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const updatedItem = await updateItem(data.id, {
      name: data.name,
      description: data.description || null,
      importance: data.importance,
      effort: data.effort,
      tags: data.tags,
    });
    return updatedItem;
  });

export const deleteTeamItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.id);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    await deleteItem(data.id);
    return { success: true };
  });

const moveItemSchema = z.object({
  itemId: z.string(),
  newColumnId: z.string(),
  newPosition: z.number().int().min(0),
});

export const moveTeamItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(moveItemSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const newColumn = await findColumnById(data.newColumnId);
    if (!newColumn || newColumn.boardId !== item.boardId) {
      throw new Error("Invalid target column");
    }

    // Check if moving to/from Completed column to set completedAt
    const currentColumn = await findColumnById(item.columnId);
    const isMovingToCompleted = newColumn.isSystem && newColumn.name === SYSTEM_COLUMN_COMPLETED;
    const isMovingFromCompleted = currentColumn?.isSystem && currentColumn.name === SYSTEM_COLUMN_COMPLETED;

    let completedAt: Date | null | undefined;
    if (isMovingToCompleted && !item.completedAt) {
      completedAt = new Date();
    } else if (isMovingFromCompleted && !isMovingToCompleted) {
      completedAt = null;
    }

    const updatedItem = await moveItem(
      data.itemId,
      data.newColumnId,
      data.newPosition,
      completedAt
    );
    return updatedItem;
  });

// =====================================================
// Focus View Server Functions (All Now Items from Team Boards)
// =====================================================

export const getAllTeamNowItemsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findAllTeamNowItems(context.userId);
  });

export const completeTeamItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ itemId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify team membership
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    const completedColumn = await findCompletedColumnForBoard(item.boardId);
    if (!completedColumn) {
      throw new Error("Completed column not found for this board");
    }

    const updatedItem = await moveItem(
      data.itemId,
      completedColumn.id,
      0,
      new Date()
    );
    return updatedItem;
  });
