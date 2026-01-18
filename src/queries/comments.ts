import { queryOptions } from "@tanstack/react-query";
import {
	getCommentRepliesFn,
	getPostCommentCountFn,
	getPostCommentsFn,
} from "~/fn/comments";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const postCommentsQueryOptions = (
	postId: string,
	limit: number = 50,
	offset: number = 0,
) =>
	queryOptions({
		queryKey: ["post-comments", postId, { limit, offset }],
		queryFn: () =>
			getPostCommentsFn({
				data: { postId, limit, offset },
				headers: getAuthHeaders(),
			}),
	});

export const commentRepliesQueryOptions = (commentId: string) =>
	queryOptions({
		queryKey: ["comment-replies", commentId],
		queryFn: () =>
			getCommentRepliesFn({ data: { commentId }, headers: getAuthHeaders() }),
	});

export const postCommentCountQueryOptions = (postId: string) =>
	queryOptions({
		queryKey: ["post-comment-count", postId],
		queryFn: () =>
			getPostCommentCountFn({ data: { postId }, headers: getAuthHeaders() }),
	});
