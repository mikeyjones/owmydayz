import { queryOptions } from "@tanstack/react-query";
import { getMessagesFn, getUnreadMessageCountFn } from "~/fn/messages";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const messagesQueryOptions = (
	conversationId: string,
	limit: number = 50,
	offset: number = 0,
) =>
	queryOptions({
		queryKey: ["messages", conversationId, { limit, offset }],
		queryFn: () =>
			getMessagesFn({
				data: { conversationId, limit, offset },
				headers: getAuthHeaders(),
			}),
		enabled: !!conversationId,
	});

export const unreadMessageCountQueryOptions = () =>
	queryOptions({
		queryKey: ["messages", "unread-count"],
		queryFn: () => getUnreadMessageCountFn({ headers: getAuthHeaders() }),
		refetchInterval: 30000, // Refetch every 30 seconds
	});
