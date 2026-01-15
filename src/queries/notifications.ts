import { queryOptions } from "@tanstack/react-query";
import {
  getNotificationsFn,
  getRecentNotificationsFn,
  getUnreadCountFn,
} from "~/fn/notifications";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const notificationsQueryOptions = (
  limit: number = 20,
  offset: number = 0
) =>
  queryOptions({
    queryKey: ["notifications", { limit, offset }],
    queryFn: () => getNotificationsFn({ data: { limit, offset }, headers: getAuthHeaders() }),
  });

export const recentNotificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "recent"],
    queryFn: () => getRecentNotificationsFn({ headers: getAuthHeaders() }),
  });

export const unreadCountQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCountFn({ headers: getAuthHeaders() }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
