import { queryOptions } from "@tanstack/react-query";
import {
  getKanbanItemCommentsFn,
  getKanbanItemCommentRepliesFn,
  countKanbanItemCommentsFn,
  getTeamItemCommentsFn,
  getTeamItemCommentRepliesFn,
  countTeamItemCommentsFn,
} from "~/fn/item-comments";

// =====================================================
// Kanban Item Comment Queries
// =====================================================

export const kanbanItemCommentsQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["kanban-item-comments", itemId],
    queryFn: () => getKanbanItemCommentsFn({ data: { itemId } }),
  });

export const kanbanItemCommentRepliesQueryOptions = (parentCommentId: string) =>
  queryOptions({
    queryKey: ["kanban-item-comment-replies", parentCommentId],
    queryFn: () => getKanbanItemCommentRepliesFn({ data: { parentCommentId } }),
  });

export const kanbanItemCommentCountQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["kanban-item-comment-count", itemId],
    queryFn: () => countKanbanItemCommentsFn({ data: { itemId } }),
  });

// =====================================================
// Team Item Comment Queries
// =====================================================

export const teamItemCommentsQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["team-item-comments", itemId],
    queryFn: () => getTeamItemCommentsFn({ data: { itemId } }),
  });

export const teamItemCommentRepliesQueryOptions = (parentCommentId: string) =>
  queryOptions({
    queryKey: ["team-item-comment-replies", parentCommentId],
    queryFn: () => getTeamItemCommentRepliesFn({ data: { parentCommentId } }),
  });

export const teamItemCommentCountQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["team-item-comment-count", itemId],
    queryFn: () => countTeamItemCommentsFn({ data: { itemId } }),
  });
