import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createKanbanItemComment,
  createTeamItemComment,
  findKanbanItemComments,
  findTeamItemComments,
  findKanbanItemCommentReplies,
  findTeamItemCommentReplies,
  findKanbanItemCommentById,
  findTeamItemCommentById,
  updateKanbanItemComment,
  updateTeamItemComment,
  deleteKanbanItemComment,
  deleteTeamItemComment,
  countKanbanItemComments,
  countTeamItemComments,
} from "~/data-access/item-comments";
import { findItemById as findKanbanItemById, findBoardById } from "~/data-access/kanban";
import { findItemById as findTeamItemById, findTeamBoardById } from "~/data-access/team-boards";
import { isTeamMember } from "~/data-access/teams";

// =====================================================
// Kanban Item Comment Server Functions
// =====================================================

const createCommentSchema = z.object({
  itemId: z.string(),
  content: z
    .string()
    .min(1, "Comment is required")
    .max(5000, "Comment must be less than 5000 characters"),
  parentCommentId: z.string().optional(),
});

export const createKanbanItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(createCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findKanbanItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    const commentData = {
      id: crypto.randomUUID(),
      itemId: data.itemId,
      userId: context.userId,
      content: data.content,
      // Ensure empty string is converted to null
      parentCommentId: data.parentCommentId && data.parentCommentId.trim() ? data.parentCommentId : null,
    };

    const newComment = await createKanbanItemComment(commentData);
    return newComment;
  });

const getCommentsSchema = z.object({
  itemId: z.string(),
});

export const getKanbanItemCommentsFn = createServerFn()
  .inputValidator(getCommentsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findKanbanItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    return await findKanbanItemComments(data.itemId);
  });

const getRepliesSchema = z.object({
  parentCommentId: z.string(),
});

export const getKanbanItemCommentRepliesFn = createServerFn()
  .inputValidator(getRepliesSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment to verify it exists
    const comment = await findKanbanItemCommentById(data.parentCommentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Find the item to verify board ownership
    const item = await findKanbanItemById(comment.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    return await findKanbanItemCommentReplies(data.parentCommentId);
  });

const updateCommentSchema = z.object({
  commentId: z.string(),
  content: z
    .string()
    .min(1, "Comment is required")
    .max(5000, "Comment must be less than 5000 characters"),
});

export const updateKanbanItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment
    const comment = await findKanbanItemCommentById(data.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the user owns this comment
    if (comment.userId !== context.userId) {
      throw new Error("Unauthorized - you can only edit your own comments");
    }

    const updatedComment = await updateKanbanItemComment(data.commentId, data.content);
    return updatedComment;
  });

const deleteCommentSchema = z.object({
  commentId: z.string(),
});

export const deleteKanbanItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(deleteCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment
    const comment = await findKanbanItemCommentById(data.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the user owns this comment
    if (comment.userId !== context.userId) {
      throw new Error("Unauthorized - you can only delete your own comments");
    }

    await deleteKanbanItemComment(data.commentId);
    return { success: true };
  });

const countCommentsSchema = z.object({
  itemId: z.string(),
});

export const countKanbanItemCommentsFn = createServerFn()
  .inputValidator(countCommentsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findKanbanItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify board ownership
    const board = await findBoardById(item.boardId);
    if (!board || board.userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    return await countKanbanItemComments(data.itemId);
  });

// =====================================================
// Team Item Comment Server Functions
// =====================================================

export const createTeamItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(createCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findTeamItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Find the board to get the team
    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify user is a team member
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized - you must be a team member");
    }

    const commentData = {
      id: crypto.randomUUID(),
      itemId: data.itemId,
      userId: context.userId,
      content: data.content,
      // Ensure empty string is converted to null
      parentCommentId: data.parentCommentId && data.parentCommentId.trim() ? data.parentCommentId : null,
    };

    const newComment = await createTeamItemComment(commentData);
    return newComment;
  });

export const getTeamItemCommentsFn = createServerFn()
  .inputValidator(getCommentsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findTeamItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Find the board to get the team
    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify user is a team member
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized - you must be a team member");
    }

    return await findTeamItemComments(data.itemId);
  });

export const getTeamItemCommentRepliesFn = createServerFn()
  .inputValidator(getRepliesSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment to verify it exists
    const comment = await findTeamItemCommentById(data.parentCommentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Find the item to verify team membership
    const item = await findTeamItemById(comment.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized - you must be a team member");
    }

    return await findTeamItemCommentReplies(data.parentCommentId);
  });

export const updateTeamItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment
    const comment = await findTeamItemCommentById(data.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the user owns this comment
    if (comment.userId !== context.userId) {
      throw new Error("Unauthorized - you can only edit your own comments");
    }

    const updatedComment = await updateTeamItemComment(data.commentId, data.content);
    return updatedComment;
  });

export const deleteTeamItemCommentFn = createServerFn({
  method: "POST",
})
  .inputValidator(deleteCommentSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the comment
    const comment = await findTeamItemCommentById(data.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the user owns this comment
    if (comment.userId !== context.userId) {
      throw new Error("Unauthorized - you can only delete your own comments");
    }

    await deleteTeamItemComment(data.commentId);
    return { success: true };
  });

export const countTeamItemCommentsFn = createServerFn()
  .inputValidator(countCommentsSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Find the item to verify it exists
    const item = await findTeamItemById(data.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Find the board to get the team
    const board = await findTeamBoardById(item.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Verify user is a team member
    const isMember = await isTeamMember(board.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized - you must be a team member");
    }

    return await countTeamItemComments(data.itemId);
  });
