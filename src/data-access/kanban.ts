import { eq, and, asc, desc } from "drizzle-orm";
import { database } from "~/db";
import {
  kanbanBoard,
  kanbanColumn,
  kanbanItem,
  type KanbanBoard,
  type CreateKanbanBoardData,
  type UpdateKanbanBoardData,
  type KanbanColumn,
  type CreateKanbanColumnData,
  type UpdateKanbanColumnData,
  type KanbanItem,
  type CreateKanbanItemData,
  type UpdateKanbanItemData,
} from "~/db/schema";

// System column names - these are automatically created and protected
export const SYSTEM_COLUMN_NOW = "Now";
export const SYSTEM_COLUMN_COMPLETED = "Completed";

// System columns are always at the end with high position values
// to ensure they stay at the end after user columns
export const SYSTEM_COLUMN_NOW_POSITION = 999998;
export const SYSTEM_COLUMN_COMPLETED_POSITION = 999999;

// =====================================================
// Board Operations
// =====================================================

export async function createBoard(
  boardData: CreateKanbanBoardData
): Promise<KanbanBoard> {
  const [newBoard] = await database
    .insert(kanbanBoard)
    .values({
      ...boardData,
      updatedAt: new Date(),
    })
    .returning();

  // Automatically create system columns ('Now' and 'Completed')
  await createSystemColumnsForBoard(newBoard.id);

  return newBoard;
}

/**
 * Creates the system columns ('Now' and 'Completed') for a board.
 * These columns cannot be deleted, renamed, or reordered.
 */
export async function createSystemColumnsForBoard(boardId: string): Promise<void> {
  const nowColumn: CreateKanbanColumnData = {
    id: crypto.randomUUID(),
    boardId,
    name: SYSTEM_COLUMN_NOW,
    position: SYSTEM_COLUMN_NOW_POSITION,
    isSystem: true,
  };

  const completedColumn: CreateKanbanColumnData = {
    id: crypto.randomUUID(),
    boardId,
    name: SYSTEM_COLUMN_COMPLETED,
    position: SYSTEM_COLUMN_COMPLETED_POSITION,
    isSystem: true,
  };

  await database.insert(kanbanColumn).values([nowColumn, completedColumn]);
}

/**
 * Ensures system columns exist for a board. If they don't exist, creates them.
 * This is useful for migrating existing boards.
 */
export async function ensureSystemColumnsExist(boardId: string): Promise<void> {
  const columns = await findColumnsByBoardId(boardId);
  const hasNowColumn = columns.some((col) => col.isSystem && col.name === SYSTEM_COLUMN_NOW);
  const hasCompletedColumn = columns.some((col) => col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED);

  if (!hasNowColumn) {
    await database.insert(kanbanColumn).values({
      id: crypto.randomUUID(),
      boardId,
      name: SYSTEM_COLUMN_NOW,
      position: SYSTEM_COLUMN_NOW_POSITION,
      isSystem: true,
    });
  }

  if (!hasCompletedColumn) {
    await database.insert(kanbanColumn).values({
      id: crypto.randomUUID(),
      boardId,
      name: SYSTEM_COLUMN_COMPLETED,
      position: SYSTEM_COLUMN_COMPLETED_POSITION,
      isSystem: true,
    });
  }
}

export async function findBoardById(id: string): Promise<KanbanBoard | null> {
  const [result] = await database
    .select()
    .from(kanbanBoard)
    .where(eq(kanbanBoard.id, id))
    .limit(1);

  return result || null;
}

export async function findBoardsByUserId(
  userId: string
): Promise<KanbanBoard[]> {
  const results = await database
    .select()
    .from(kanbanBoard)
    .where(eq(kanbanBoard.userId, userId))
    .orderBy(desc(kanbanBoard.createdAt));

  return results;
}

export async function updateBoard(
  id: string,
  boardData: UpdateKanbanBoardData
): Promise<KanbanBoard> {
  const [updatedBoard] = await database
    .update(kanbanBoard)
    .set({
      ...boardData,
      updatedAt: new Date(),
    })
    .where(eq(kanbanBoard.id, id))
    .returning();

  return updatedBoard;
}

export async function deleteBoard(id: string): Promise<void> {
  await database.delete(kanbanBoard).where(eq(kanbanBoard.id, id));
}

// =====================================================
// Column Operations
// =====================================================

export async function createColumn(
  columnData: CreateKanbanColumnData
): Promise<KanbanColumn> {
  const [newColumn] = await database
    .insert(kanbanColumn)
    .values({
      ...columnData,
      updatedAt: new Date(),
    })
    .returning();

  return newColumn;
}

export async function findColumnById(
  id: string
): Promise<KanbanColumn | null> {
  const [result] = await database
    .select()
    .from(kanbanColumn)
    .where(eq(kanbanColumn.id, id))
    .limit(1);

  return result || null;
}

export async function findColumnsByBoardId(
  boardId: string
): Promise<KanbanColumn[]> {
  const results = await database
    .select()
    .from(kanbanColumn)
    .where(eq(kanbanColumn.boardId, boardId))
    .orderBy(asc(kanbanColumn.position));

  return results;
}

export async function updateColumn(
  id: string,
  columnData: UpdateKanbanColumnData
): Promise<KanbanColumn> {
  const [updatedColumn] = await database
    .update(kanbanColumn)
    .set({
      ...columnData,
      updatedAt: new Date(),
    })
    .where(eq(kanbanColumn.id, id))
    .returning();

  return updatedColumn;
}

export async function deleteColumn(id: string): Promise<void> {
  await database.delete(kanbanColumn).where(eq(kanbanColumn.id, id));
}

/**
 * Gets the maximum position of non-system columns in a board.
 * System columns ('Now' and 'Completed') are excluded to ensure
 * user columns are always added before them.
 */
export async function getMaxColumnPosition(boardId: string): Promise<number> {
  const columns = await findColumnsByBoardId(boardId);
  // Filter out system columns to get max position of user columns
  const userColumns = columns.filter((col) => !col.isSystem);
  if (userColumns.length === 0) return 0;
  return Math.max(...userColumns.map((col) => col.position));
}

/**
 * Checks if a column is a system column (cannot be deleted, renamed, or reordered).
 */
export async function isSystemColumn(columnId: string): Promise<boolean> {
  const column = await findColumnById(columnId);
  return column?.isSystem ?? false;
}

// =====================================================
// Item Operations
// =====================================================

export async function createItem(
  itemData: CreateKanbanItemData
): Promise<KanbanItem> {
  const [newItem] = await database
    .insert(kanbanItem)
    .values({
      ...itemData,
      updatedAt: new Date(),
    })
    .returning();

  return newItem;
}

export async function findItemById(id: string): Promise<KanbanItem | null> {
  const [result] = await database
    .select()
    .from(kanbanItem)
    .where(eq(kanbanItem.id, id))
    .limit(1);

  return result || null;
}

export async function findItemsByColumnId(
  columnId: string
): Promise<KanbanItem[]> {
  const results = await database
    .select()
    .from(kanbanItem)
    .where(eq(kanbanItem.columnId, columnId))
    .orderBy(asc(kanbanItem.position));

  return results;
}

export async function findItemsByBoardId(
  boardId: string
): Promise<KanbanItem[]> {
  const results = await database
    .select()
    .from(kanbanItem)
    .where(eq(kanbanItem.boardId, boardId))
    .orderBy(asc(kanbanItem.position));

  return results;
}

export async function updateItem(
  id: string,
  itemData: UpdateKanbanItemData
): Promise<KanbanItem> {
  const [updatedItem] = await database
    .update(kanbanItem)
    .set({
      ...itemData,
      updatedAt: new Date(),
    })
    .where(eq(kanbanItem.id, id))
    .returning();

  return updatedItem;
}

export async function deleteItem(id: string): Promise<void> {
  await database.delete(kanbanItem).where(eq(kanbanItem.id, id));
}

export async function getMaxItemPosition(columnId: string): Promise<number> {
  const items = await findItemsByColumnId(columnId);
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.position));
}

export async function moveItem(
  itemId: string,
  newColumnId: string,
  newPosition: number,
  completedAt?: Date | null
): Promise<KanbanItem> {
  const updateData: {
    columnId: string;
    position: number;
    updatedAt: Date;
    completedAt?: Date | null;
  } = {
    columnId: newColumnId,
    position: newPosition,
    updatedAt: new Date(),
  };

  // Set completedAt if provided (when moving to Completed column)
  // Pass null to clear completedAt (when moving out of Completed column)
  if (completedAt !== undefined) {
    updateData.completedAt = completedAt;
  }

  const [updatedItem] = await database
    .update(kanbanItem)
    .set(updateData)
    .where(eq(kanbanItem.id, itemId))
    .returning();

  return updatedItem;
}

export async function moveItemToBoard(
  itemId: string,
  newBoardId: string,
  newColumnId: string,
  newPosition: number
): Promise<KanbanItem> {
  const [updatedItem] = await database
    .update(kanbanItem)
    .set({
      boardId: newBoardId,
      columnId: newColumnId,
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(kanbanItem.id, itemId))
    .returning();

  return updatedItem;
}

// =====================================================
// Board with full data (columns + items)
// =====================================================

export type KanbanColumnWithItems = KanbanColumn & {
  items: KanbanItem[];
};

export type KanbanBoardWithColumns = KanbanBoard & {
  columns: KanbanColumnWithItems[];
};

export async function findBoardWithColumnsAndItems(
  boardId: string
): Promise<KanbanBoardWithColumns | null> {
  const board = await findBoardById(boardId);
  if (!board) return null;

  const columns = await findColumnsByBoardId(boardId);

  const columnsWithItems: KanbanColumnWithItems[] = await Promise.all(
    columns.map(async (column) => {
      const items = await findItemsByColumnId(column.id);
      return { ...column, items };
    })
  );

  return { ...board, columns: columnsWithItems };
}

// =====================================================
// Focus View Operations (Now Items across all boards)
// =====================================================

export type NowItemWithBoard = KanbanItem & {
  boardName: string;
};

/**
 * Finds all items in "Now" columns across all boards for a user.
 * Returns items with their board name for context.
 */
export async function findAllNowItems(userId: string): Promise<NowItemWithBoard[]> {
  const results = await database
    .select({
      id: kanbanItem.id,
      columnId: kanbanItem.columnId,
      boardId: kanbanItem.boardId,
      name: kanbanItem.name,
      description: kanbanItem.description,
      importance: kanbanItem.importance,
      effort: kanbanItem.effort,
      tags: kanbanItem.tags,
      position: kanbanItem.position,
      createdAt: kanbanItem.createdAt,
      updatedAt: kanbanItem.updatedAt,
      boardName: kanbanBoard.name,
    })
    .from(kanbanItem)
    .innerJoin(kanbanColumn, eq(kanbanItem.columnId, kanbanColumn.id))
    .innerJoin(kanbanBoard, eq(kanbanItem.boardId, kanbanBoard.id))
    .where(
      and(
        eq(kanbanBoard.userId, userId),
        eq(kanbanColumn.isSystem, true),
        eq(kanbanColumn.name, SYSTEM_COLUMN_NOW)
      )
    )
    .orderBy(asc(kanbanBoard.name), asc(kanbanItem.position));

  return results;
}

/**
 * Finds the "Completed" column for a given board.
 */
export async function findCompletedColumnForBoard(
  boardId: string
): Promise<KanbanColumn | null> {
  const [result] = await database
    .select()
    .from(kanbanColumn)
    .where(
      and(
        eq(kanbanColumn.boardId, boardId),
        eq(kanbanColumn.isSystem, true),
        eq(kanbanColumn.name, SYSTEM_COLUMN_COMPLETED)
      )
    )
    .limit(1);

  return result || null;
}
