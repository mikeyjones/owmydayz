import { eq, desc, isNull, and } from "drizzle-orm";
import { database } from "~/db";
import {
  kanbanItemComment,
  teamItemComment,
  user,
  type KanbanItemComment,
  type CreateKanbanItemCommentData,
  type TeamItemComment,
  type CreateTeamItemCommentData,
  type User,
} from "~/db/schema";

// =====================================================
// Common Types
// =====================================================

export type ItemCommentWithUser = {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user: Pick<User, "id" | "name" | "image">;
};

// =====================================================
// Kanban Item Comment Operations
// =====================================================

export async function createKanbanItemComment(
  commentData: CreateKanbanItemCommentData
): Promise<KanbanItemComment> {
  const now = new Date();
  const [newComment] = await database
    .insert(kanbanItemComment)
    .values({
      ...commentData,
      // Ensure parentCommentId is null if empty/undefined
      parentCommentId: commentData.parentCommentId || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return newComment;
}

export async function findKanbanItemCommentById(
  id: string
): Promise<KanbanItemComment | null> {
  const [result] = await database
    .select()
    .from(kanbanItemComment)
    .where(eq(kanbanItemComment.id, id))
    .limit(1);

  return result || null;
}

export async function findKanbanItemCommentByIdWithUser(
  id: string
): Promise<ItemCommentWithUser | null> {
  const [result] = await database
    .select({
      id: kanbanItemComment.id,
      itemId: kanbanItemComment.itemId,
      userId: kanbanItemComment.userId,
      content: kanbanItemComment.content,
      parentCommentId: kanbanItemComment.parentCommentId,
      createdAt: kanbanItemComment.createdAt,
      updatedAt: kanbanItemComment.updatedAt,
      deletedAt: kanbanItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(kanbanItemComment)
    .innerJoin(user, eq(kanbanItemComment.userId, user.id))
    .where(eq(kanbanItemComment.id, id))
    .limit(1);

  return result || null;
}

export async function findKanbanItemComments(
  itemId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ItemCommentWithUser[]> {
  const results = await database
    .select({
      id: kanbanItemComment.id,
      itemId: kanbanItemComment.itemId,
      userId: kanbanItemComment.userId,
      content: kanbanItemComment.content,
      parentCommentId: kanbanItemComment.parentCommentId,
      createdAt: kanbanItemComment.createdAt,
      updatedAt: kanbanItemComment.updatedAt,
      deletedAt: kanbanItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(kanbanItemComment)
    .innerJoin(user, eq(kanbanItemComment.userId, user.id))
    .where(
      and(
        eq(kanbanItemComment.itemId, itemId),
        isNull(kanbanItemComment.deletedAt),
        isNull(kanbanItemComment.parentCommentId)
      )
    )
    .orderBy(desc(kanbanItemComment.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function findKanbanItemCommentReplies(
  parentCommentId: string
): Promise<ItemCommentWithUser[]> {
  const results = await database
    .select({
      id: kanbanItemComment.id,
      itemId: kanbanItemComment.itemId,
      userId: kanbanItemComment.userId,
      content: kanbanItemComment.content,
      parentCommentId: kanbanItemComment.parentCommentId,
      createdAt: kanbanItemComment.createdAt,
      updatedAt: kanbanItemComment.updatedAt,
      deletedAt: kanbanItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(kanbanItemComment)
    .innerJoin(user, eq(kanbanItemComment.userId, user.id))
    .where(
      and(
        eq(kanbanItemComment.parentCommentId, parentCommentId),
        isNull(kanbanItemComment.deletedAt)
      )
    )
    .orderBy(desc(kanbanItemComment.createdAt));

  return results;
}

export async function updateKanbanItemComment(
  commentId: string,
  content: string
): Promise<KanbanItemComment | null> {
  const [updated] = await database
    .update(kanbanItemComment)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(kanbanItemComment.id, commentId))
    .returning();

  return updated || null;
}

export async function deleteKanbanItemComment(commentId: string): Promise<boolean> {
  const [updated] = await database
    .update(kanbanItemComment)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(kanbanItemComment.id, commentId))
    .returning();

  return updated !== undefined;
}

export async function countKanbanItemComments(itemId: string): Promise<number> {
  const results = await database
    .select({ id: kanbanItemComment.id })
    .from(kanbanItemComment)
    .where(
      and(
        eq(kanbanItemComment.itemId, itemId),
        isNull(kanbanItemComment.deletedAt)
      )
    );

  return results.length;
}

// =====================================================
// Team Item Comment Operations
// =====================================================

export async function createTeamItemComment(
  commentData: CreateTeamItemCommentData
): Promise<TeamItemComment> {
  const now = new Date();
  const [newComment] = await database
    .insert(teamItemComment)
    .values({
      ...commentData,
      // Ensure parentCommentId is null if empty/undefined
      parentCommentId: commentData.parentCommentId || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return newComment;
}

export async function findTeamItemCommentById(
  id: string
): Promise<TeamItemComment | null> {
  const [result] = await database
    .select()
    .from(teamItemComment)
    .where(eq(teamItemComment.id, id))
    .limit(1);

  return result || null;
}

export async function findTeamItemCommentByIdWithUser(
  id: string
): Promise<ItemCommentWithUser | null> {
  const [result] = await database
    .select({
      id: teamItemComment.id,
      itemId: teamItemComment.itemId,
      userId: teamItemComment.userId,
      content: teamItemComment.content,
      parentCommentId: teamItemComment.parentCommentId,
      createdAt: teamItemComment.createdAt,
      updatedAt: teamItemComment.updatedAt,
      deletedAt: teamItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(teamItemComment)
    .innerJoin(user, eq(teamItemComment.userId, user.id))
    .where(eq(teamItemComment.id, id))
    .limit(1);

  return result || null;
}

export async function findTeamItemComments(
  itemId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ItemCommentWithUser[]> {
  const results = await database
    .select({
      id: teamItemComment.id,
      itemId: teamItemComment.itemId,
      userId: teamItemComment.userId,
      content: teamItemComment.content,
      parentCommentId: teamItemComment.parentCommentId,
      createdAt: teamItemComment.createdAt,
      updatedAt: teamItemComment.updatedAt,
      deletedAt: teamItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(teamItemComment)
    .innerJoin(user, eq(teamItemComment.userId, user.id))
    .where(
      and(
        eq(teamItemComment.itemId, itemId),
        isNull(teamItemComment.deletedAt),
        isNull(teamItemComment.parentCommentId)
      )
    )
    .orderBy(desc(teamItemComment.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function findTeamItemCommentReplies(
  parentCommentId: string
): Promise<ItemCommentWithUser[]> {
  const results = await database
    .select({
      id: teamItemComment.id,
      itemId: teamItemComment.itemId,
      userId: teamItemComment.userId,
      content: teamItemComment.content,
      parentCommentId: teamItemComment.parentCommentId,
      createdAt: teamItemComment.createdAt,
      updatedAt: teamItemComment.updatedAt,
      deletedAt: teamItemComment.deletedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(teamItemComment)
    .innerJoin(user, eq(teamItemComment.userId, user.id))
    .where(
      and(
        eq(teamItemComment.parentCommentId, parentCommentId),
        isNull(teamItemComment.deletedAt)
      )
    )
    .orderBy(desc(teamItemComment.createdAt));

  return results;
}

export async function updateTeamItemComment(
  commentId: string,
  content: string
): Promise<TeamItemComment | null> {
  const [updated] = await database
    .update(teamItemComment)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(teamItemComment.id, commentId))
    .returning();

  return updated || null;
}

export async function deleteTeamItemComment(commentId: string): Promise<boolean> {
  const [updated] = await database
    .update(teamItemComment)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(teamItemComment.id, commentId))
    .returning();

  return updated !== undefined;
}

export async function countTeamItemComments(itemId: string): Promise<number> {
  const results = await database
    .select({ id: teamItemComment.id })
    .from(teamItemComment)
    .where(
      and(
        eq(teamItemComment.itemId, itemId),
        isNull(teamItemComment.deletedAt)
      )
    );

  return results.length;
}
