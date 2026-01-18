import { queryOptions } from "@tanstack/react-query";
import {
	countKanbanItemCommentsFn,
	countTeamItemCommentsFn,
	getKanbanItemCommentRepliesFn,
	getKanbanItemCommentsFn,
	getTeamItemCommentRepliesFn,
	getTeamItemCommentsFn,
} from "~/fn/item-comments";
import { getAuthHeaders } from "~/utils/server-fn-client";

// =====================================================
// Kanban Item Comment Queries
// =====================================================

export const kanbanItemCommentsQueryOptions = (itemId: string) =>
	queryOptions({
		queryKey: ["kanban-item-comments", itemId],
		queryFn: () =>
			getKanbanItemCommentsFn({ data: { itemId }, headers: getAuthHeaders() }),
	});

export const kanbanItemCommentRepliesQueryOptions = (parentCommentId: string) =>
	queryOptions({
		queryKey: ["kanban-item-comment-replies", parentCommentId],
		queryFn: () =>
			getKanbanItemCommentRepliesFn({
				data: { parentCommentId },
				headers: getAuthHeaders(),
			}),
	});

export const kanbanItemCommentCountQueryOptions = (itemId: string) =>
	queryOptions({
		queryKey: ["kanban-item-comment-count", itemId],
		queryFn: () =>
			countKanbanItemCommentsFn({
				data: { itemId },
				headers: getAuthHeaders(),
			}),
	});

// =====================================================
// Team Item Comment Queries
// =====================================================

export const teamItemCommentsQueryOptions = (itemId: string) =>
	queryOptions({
		queryKey: ["team-item-comments", itemId],
		queryFn: () =>
			getTeamItemCommentsFn({ data: { itemId }, headers: getAuthHeaders() }),
	});

export const teamItemCommentRepliesQueryOptions = (parentCommentId: string) =>
	queryOptions({
		queryKey: ["team-item-comment-replies", parentCommentId],
		queryFn: () =>
			getTeamItemCommentRepliesFn({
				data: { parentCommentId },
				headers: getAuthHeaders(),
			}),
	});

export const teamItemCommentCountQueryOptions = (itemId: string) =>
	queryOptions({
		queryKey: ["team-item-comment-count", itemId],
		queryFn: () =>
			countTeamItemCommentsFn({ data: { itemId }, headers: getAuthHeaders() }),
	});
