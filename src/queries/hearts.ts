import { queryOptions } from "@tanstack/react-query";
import { getHeartStatusFn, getHeartCountFn } from "~/fn/hearts";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const getHeartStatusQuery = (songId: string) =>
  queryOptions({
    queryKey: ["heart-status", songId],
    queryFn: () => getHeartStatusFn({ data: { songId }, headers: getAuthHeaders() }),
  });

export const getHeartCountQuery = (songId: string) =>
  queryOptions({
    queryKey: ["heart-count", songId],
    queryFn: () => getHeartCountFn({ data: { songId }, headers: getAuthHeaders() }),
  });