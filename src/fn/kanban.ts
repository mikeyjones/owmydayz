import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createBoard,
  updateBoard,
  deleteBoard,
  findBoardById,
  findBoardsByUserId,
  findBoardWithColumnsAndItems,
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
  moveItemToBoard,
  ensureSystemColumnsExist,
  findAllNowItems,
  findCompletedColumnForBoard,
  SYSTEM_COLUMN_COMPLETED,
} from "~/data-access/kanban";
import { KANBAN_IMPORTANCE_VALUES, KANBAN_EFFORT_VALUES } from "~/db/schema";

// =====================================================
// Board Server Functions
// =====================================================

const boardFormSchema = z.object({
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

export const createBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(boardFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const boardData = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || null,
      userId: context.userId,
    };

    const newBoard = await createBoard(boardData);
    return newBoard;
  });

export const getBoardsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findBoardsByUserId(context.userId);
  });

export const getBoardByIdFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const board = await findBoardById(data.id);
    if (!board) {
      throw new Error("Board not found");
    }
    // Check ownership
    if (board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }
    return board;
  });

export const getBoardWithColumnsFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // First check basic board ownership
    const basicBoard = await findBoardById(data.id);
    if (!basicBoard) {
      throw new Error("Board not found");
    }
    if (basicBoard.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    // Ensure system columns ('Now' and 'Completed') exist for this board
    // This handles migration for existing boards that don't have them
    await ensureSystemColumnsExist(data.id);

    // Now get the full board with columns and items
    const board = await findBoardWithColumnsAndItems(data.id);
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
  focusMode: z.boolean().optional(),
});

export const updateBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateBoardSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingBoard = await findBoardById(data.id);
    if (!existingBoard) {
      throw new Error("Board not found");
    }
    if (existingBoard.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    const updatedBoard = await updateBoard(data.id, {
      name: data.name,
      description: data.description || null,
      focusMode: data.focusMode,
    });
    return updatedBoard;
  });

export const deleteBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingBoard = await findBoardById(data.id);
    if (!existingBoard) {
      throw new Error("Board not found");
    }
    if (existingBoard.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    await deleteBoard(data.id);
    return { success: true };
  });

// =====================================================
// Column Server Functions
// =====================================================

const columnFormSchema = z.object({
  boardId: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

export const createColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(columnFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Verify board ownership
    const board = await findBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    if (board.userId !== context.userId) {
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

export const updateColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateColumnSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const column = await findColumnById(data.id);
    if (!column) {
      throw new Error("Column not found");
    }

    // Prevent renaming system columns ('Now' and 'Completed')
    if (column.isSystem) {
      throw new Error("Cannot rename system columns ('Now' and 'Completed')");
    }

    // Verify board ownership
    const board = await findBoardById(column.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    const updatedColumn = await updateColumn(data.id, {
      name: data.name,
    });
    return updatedColumn;
  });

export const deleteColumnFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const column = await findColumnById(data.id);
    if (!column) {
      throw new Error("Column not found");
    }

    // Prevent deleting system columns ('Now' and 'Completed')
    if (column.isSystem) {
      throw new Error("Cannot delete system columns ('Now' and 'Completed')");
    }

    // Verify board ownership
    const board = await findBoardById(column.boardId);
    if (!board || board.userId !== context.userId) {
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

export const reorderColumnsFn = createServerFn({
  method: "POST",
})
  .inputValidator(reorderColumnsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Verify board ownership
    const board = await findBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    if (board.userId !== context.userId) {
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
// Item Server Functions
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

export const createItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(itemFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Verify board ownership
    const board = await findBoardById(data.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    if (board.userId !== context.userId) {
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

export const updateItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateItemSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.id);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
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

export const deleteItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.id);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
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

export const moveItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(moveItemSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
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
      // Moving to Completed column - set completedAt
      completedAt = new Date();
    } else if (isMovingFromCompleted && !isMovingToCompleted) {
      // Moving out of Completed column - clear completedAt
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

const moveItemToBoardSchema = z.object({
  itemId: z.string(),
  newBoardId: z.string(),
  newColumnId: z.string(),
  newPosition: z.number().int().min(0),
});

export const moveItemToBoardFn = createServerFn({
  method: "POST",
})
  .inputValidator(moveItemToBoardSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify source board ownership
    const sourceBoard = await findBoardById(item.boardId);
    if (!sourceBoard || sourceBoard.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    // Verify target board ownership
    const targetBoard = await findBoardById(data.newBoardId);
    if (!targetBoard || targetBoard.userId !== context.userId) {
      throw new Error("Unauthorized - cannot move to target board");
    }

    const column = await findColumnById(data.newColumnId);
    if (!column || column.boardId !== data.newBoardId) {
      throw new Error("Invalid target column");
    }

    const updatedItem = await moveItemToBoard(
      data.itemId,
      data.newBoardId,
      data.newColumnId,
      data.newPosition
    );
    return updatedItem;
  });

// =====================================================
// Focus View Server Functions (All Now Items)
// =====================================================

/**
 * Gets all items from "Now" columns across all boards for the current user.
 */
export const getAllNowItemsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findAllNowItems(context.userId);
  });

/**
 * Marks an item as complete by moving it to the "Completed" column of its board.
 */
export const completeItemFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ itemId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const item = await findItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    // Find the "Completed" column for this board
    const completedColumn = await findCompletedColumnForBoard(item.boardId);
    if (!completedColumn) {
      throw new Error("Completed column not found for this board");
    }

    // Move the item to the "Completed" column at position 0 (top) and set completedAt
    const updatedItem = await moveItem(
      data.itemId,
      completedColumn.id,
      0,
      new Date() // Set completedAt timestamp
    );
    return updatedItem;
  });
