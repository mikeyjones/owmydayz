import { queryOptions } from "@tanstack/react-query";
import { getUserByIdFn } from "~/fn/users";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user", userId],
    queryFn: () => getUserByIdFn({ data: { userId }, headers: getAuthHeaders() }),
  });
