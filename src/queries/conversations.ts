import { queryOptions } from "@tanstack/react-query";
import {
  getConversationsFn,
  getConversationByIdFn,
} from "~/fn/conversations";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const conversationsQueryOptions = () =>
  queryOptions({
    queryKey: ["conversations"],
    queryFn: () => getConversationsFn({ headers: getAuthHeaders() }),
  });

export const conversationQueryOptions = (conversationId: string) =>
  queryOptions({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversationByIdFn({ data: { conversationId }, headers: getAuthHeaders() }),
    enabled: !!conversationId,
  });
