import { queryOptions } from "@tanstack/react-query";
import {
  getMyProfileFn,
  getPublicProfileFn,
} from "~/fn/profiles";
import { getAuthHeaders } from "~/utils/server-fn-client";

/**
 * Query for current user's profile
 */
export const myProfileQueryOptions = () =>
  queryOptions({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfileFn({ headers: getAuthHeaders() }),
  });

/**
 * Query for a public profile by user ID
 */
export const publicProfileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfileFn({ data: { userId }, headers: getAuthHeaders() }),
  });
