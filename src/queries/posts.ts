import { queryOptions } from "@tanstack/react-query";
import {
  getRecentPostsFn,
  getPostByIdFn,
  getUserPostsFn,
  checkIsAdminFn,
  type PostCategory,
} from "~/fn/posts";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const recentPostsQueryOptions = (category?: PostCategory) =>
  queryOptions({
    queryKey: ["community-posts", "recent", category ?? "all"],
    queryFn: () => getRecentPostsFn({ data: category ? { category } : undefined, headers: getAuthHeaders() }),
  });

export const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ["community-post", postId],
    queryFn: () => getPostByIdFn({ data: { id: postId }, headers: getAuthHeaders() }),
  });

export const userPostsQueryOptions = () =>
  queryOptions({
    queryKey: ["community-posts", "user"],
    queryFn: () => getUserPostsFn({ headers: getAuthHeaders() }),
  });

export const isAdminQueryOptions = () =>
  queryOptions({
    queryKey: ["user", "isAdmin"],
    queryFn: () => checkIsAdminFn({ headers: getAuthHeaders() }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });