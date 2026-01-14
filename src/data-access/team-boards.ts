import { eq, and, asc, desc } from "drizzle-orm";
import { database } from "~/db";
import {
  teamBoard,
  teamColumn,
  teamItem,
  team,
  type TeamBoard,
  type CreateTeamBoardData,
  type UpdateTeamBoardData,
  type TeamColumn,
  type CreateTeamColumnData,
  type UpdateTeamColumnData,
  type TeamItem,
  type CreateTeamItemData,
  type UpdateTeamItemData,
} from "~/db/schema";

// System column names - same as personal boards
export const SYSTEM_COLUMN_NOW = "Now";
export const SYSTEM_COLUMN_COMPLETED = "Completed";

// System columns positions
export const SYSTEM_COLUMN_NOW_POSITION = 999998;
export const SYSTEM_COLUMN_COMPLETED_POSITION = 999999;

// =====================================================
// Team Board Operations
// =====================================================

export async function createTeamBoard(
  boardData: CreateTeamBoardData
): Promise<TeamBoard> {
  const [newBoard] = await database
    .insert(teamBoard)
    .values({
      ...boardData,
      updatedAt: new Date(),
    })
    .returning();

  // Automatically create system columns ('Now' and 'Completed')
  await createSystemColumnsForTeamBoard(newBoard.id);

  return newBoard;
}

/**
 * Creates the system columns ('Now' and 'Completed') for a team board.
 */
export async function createSystemColumnsForTeamBoard(boardId: string): Promise<void> {
  const nowColumn: CreateTeamColumnData = {
    id: crypto.randomUUID(),
    boardId,
    name: SYSTEM_COLUMN_NOW,
    position: SYSTEM_COLUMN_NOW_POSITION,
    isSystem: true,
  };

  const completedColumn: CreateTeamColumnData = {
    id: crypto.randomUUID(),
    boardId,
    name: SYSTEM_COLUMN_COMPLETED,
    position: SYSTEM_COLUMN_COMPLETED_POSITION,
    isSystem: true,
  };

  await database.insert(teamColumn).values([nowColumn, completedColumn]);
}

/**
 * Ensures system columns exist for a team board. If they don't exist, creates them.
 */
export async function ensureSystemColumnsExist(boardId: string): Promise<void> {
  const columns = await findColumnsByBoardId(boardId);
  const hasNowColumn = columns.some((col) => col.isSystem && col.name === SYSTEM_COLUMN_NOW);
  const hasCompletedColumn = columns.some((col) => col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED);

  if (!hasNowColumn) {
    await database.insert(teamColumn).values({
      id: crypto.randomUUID(),
      boardId,
      name: SYSTEM_COLUMN_NOW,
      position: SYSTEM_COLUMN_NOW_POSITION,
      isSystem: true,
    });
  }

  if (!hasCompletedColumn) {
    await database.insert(teamColumn).values({
      id: crypto.randomUUID(),
      boardId,
      name: SYSTEM_COLUMN_COMPLETED,
      position: SYSTEM_COLUMN_COMPLETED_POSITION,
      isSystem: true,
    });
  }
}

export async function findTeamBoardById(id: string): Promise<TeamBoard | null> {
  const [result] = await database
    .select()
    .from(teamBoard)
    .where(eq(teamBoard.id, id))
    .limit(1);

  return result || null;
}

export async function findTeamBoardsByTeamId(
  teamId: string
): Promise<TeamBoard[]> {
  const results = await database
    .select()
    .from(teamBoard)
    .where(eq(teamBoard.teamId, teamId))
    .orderBy(desc(teamBoard.createdAt));

  return results;
}

export type TeamBoardWithTeam = TeamBoard & {
  teamName: string;
  teamSlug: string;
};

export async function findTeamBoardsByUserId(
  userId: string
): Promise<TeamBoardWithTeam[]> {
  // Find all team boards from teams the user is a member of
  const { teamMembership } = await import("~/db/schema");
  
  const results = await database
    .select({
      id: teamBoard.id,
      name: teamBoard.name,
      description: teamBoard.description,
      teamId: teamBoard.teamId,
      createdBy: teamBoard.createdBy,
      createdAt: teamBoard.createdAt,
      updatedAt: teamBoard.updatedAt,
      teamName: team.name,
      teamSlug: team.slug,
    })
    .from(teamBoard)
    .innerJoin(team, eq(teamBoard.teamId, team.id))
    .innerJoin(teamMembership, eq(team.id, teamMembership.teamId))
    .where(eq(teamMembership.userId, userId))
    .orderBy(desc(teamBoard.createdAt));

  return results;
}

export async function updateTeamBoard(
  id: string,
  boardData: UpdateTeamBoardData
): Promise<TeamBoard> {
  const [updatedBoard] = await database
    .update(teamBoard)
    .set({
      ...boardData,
      updatedAt: new Date(),
    })
    .where(eq(teamBoard.id, id))
    .returning();

  return updatedBoard;
}

export async function deleteTeamBoard(id: string): Promise<void> {
  await database.delete(teamBoard).where(eq(teamBoard.id, id));
}

// =====================================================
// Team Column Operations
// =====================================================

export async function createColumn(
  columnData: CreateTeamColumnData
): Promise<TeamColumn> {
  const [newColumn] = await database
    .insert(teamColumn)
    .values({
      ...columnData,
      updatedAt: new Date(),
    })
    .returning();

  return newColumn;
}

export async function findColumnById(
  id: string
): Promise<TeamColumn | null> {
  const [result] = await database
    .select()
    .from(teamColumn)
    .where(eq(teamColumn.id, id))
    .limit(1);

  return result || null;
}

export async function findColumnsByBoardId(
  boardId: string
): Promise<TeamColumn[]> {
  const results = await database
    .select()
    .from(teamColumn)
    .where(eq(teamColumn.boardId, boardId))
    .orderBy(asc(teamColumn.position));

  return results;
}

export async function updateColumn(
  id: string,
  columnData: UpdateTeamColumnData
): Promise<TeamColumn> {
  const [updatedColumn] = await database
    .update(teamColumn)
    .set({
      ...columnData,
      updatedAt: new Date(),
    })
    .where(eq(teamColumn.id, id))
    .returning();

  return updatedColumn;
}

export async function deleteColumn(id: string): Promise<void> {
  await database.delete(teamColumn).where(eq(teamColumn.id, id));
}

export async function getMaxColumnPosition(boardId: string): Promise<number> {
  const columns = await findColumnsByBoardId(boardId);
  const userColumns = columns.filter((col) => !col.isSystem);
  if (userColumns.length === 0) return 0;
  return Math.max(...userColumns.map((col) => col.position));
}

export async function isSystemColumn(columnId: string): Promise<boolean> {
  const column = await findColumnById(columnId);
  return column?.isSystem ?? false;
}

// =====================================================
// Team Item Operations
// =====================================================

export async function createItem(
  itemData: CreateTeamItemData
): Promise<TeamItem> {
  const [newItem] = await database
    .insert(teamItem)
    .values({
      ...itemData,
      updatedAt: new Date(),
    })
    .returning();

  return newItem;
}

export async function findItemById(id: string): Promise<TeamItem | null> {
  const [result] = await database
    .select()
    .from(teamItem)
    .where(eq(teamItem.id, id))
    .limit(1);

  return result || null;
}

export async function findItemsByColumnId(
  columnId: string
): Promise<TeamItem[]> {
  const results = await database
    .select()
    .from(teamItem)
    .where(eq(teamItem.columnId, columnId))
    .orderBy(asc(teamItem.position));

  return results;
}

export async function findItemsByBoardId(
  boardId: string
): Promise<TeamItem[]> {
  const results = await database
    .select()
    .from(teamItem)
    .where(eq(teamItem.boardId, boardId))
    .orderBy(asc(teamItem.position));

  return results;
}

export async function updateItem(
  id: string,
  itemData: UpdateTeamItemData
): Promise<TeamItem> {
  const [updatedItem] = await database
    .update(teamItem)
    .set({
      ...itemData,
      updatedAt: new Date(),
    })
    .where(eq(teamItem.id, id))
    .returning();

  return updatedItem;
}

export async function deleteItem(id: string): Promise<void> {
  await database.delete(teamItem).where(eq(teamItem.id, id));
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
): Promise<TeamItem> {
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

  if (completedAt !== undefined) {
    updateData.completedAt = completedAt;
  }

  const [updatedItem] = await database
    .update(teamItem)
    .set(updateData)
    .where(eq(teamItem.id, itemId))
    .returning();

  return updatedItem;
}

// =====================================================
// Team Board with full data (columns + items)
// =====================================================

export type TeamColumnWithItems = TeamColumn & {
  items: TeamItem[];
};

export type TeamBoardWithColumns = TeamBoard & {
  columns: TeamColumnWithItems[];
};

export async function findTeamBoardWithColumnsAndItems(
  boardId: string
): Promise<TeamBoardWithColumns | null> {
  const board = await findTeamBoardById(boardId);
  if (!board) return null;

  const columns = await findColumnsByBoardId(boardId);

  const columnsWithItems: TeamColumnWithItems[] = await Promise.all(
    columns.map(async (column) => {
      const items = await findItemsByColumnId(column.id);
      return { ...column, items };
    })
  );

  return { ...board, columns: columnsWithItems };
}

// =====================================================
// Focus View Operations (Now Items across all team boards)
// =====================================================

export type TeamNowItemWithBoard = TeamItem & {
  boardName: string;
  teamName: string;
};

/**
 * Finds all items in "Now" columns across all team boards for a user's teams.
 */
export async function findAllTeamNowItems(userId: string): Promise<TeamNowItemWithBoard[]> {
  const { teamMembership } = await import("~/db/schema");

  const results = await database
    .select({
      id: teamItem.id,
      columnId: teamItem.columnId,
      boardId: teamItem.boardId,
      name: teamItem.name,
      description: teamItem.description,
      importance: teamItem.importance,
      effort: teamItem.effort,
      tags: teamItem.tags,
      position: teamItem.position,
      completedAt: teamItem.completedAt,
      createdBy: teamItem.createdBy,
      createdAt: teamItem.createdAt,
      updatedAt: teamItem.updatedAt,
      boardName: teamBoard.name,
      teamName: team.name,
    })
    .from(teamItem)
    .innerJoin(teamColumn, eq(teamItem.columnId, teamColumn.id))
    .innerJoin(teamBoard, eq(teamItem.boardId, teamBoard.id))
    .innerJoin(team, eq(teamBoard.teamId, team.id))
    .innerJoin(teamMembership, eq(team.id, teamMembership.teamId))
    .where(
      and(
        eq(teamMembership.userId, userId),
        eq(teamColumn.isSystem, true),
        eq(teamColumn.name, SYSTEM_COLUMN_NOW)
      )
    )
    .orderBy(asc(team.name), asc(teamBoard.name), asc(teamItem.position));

  return results;
}

/**
 * Finds the "Completed" column for a given team board.
 */
export async function findCompletedColumnForBoard(
  boardId: string
): Promise<TeamColumn | null> {
  const [result] = await database
    .select()
    .from(teamColumn)
    .where(
      and(
        eq(teamColumn.boardId, boardId),
        eq(teamColumn.isSystem, true),
        eq(teamColumn.name, SYSTEM_COLUMN_COMPLETED)
      )
    )
    .limit(1);

  return result || null;
}
