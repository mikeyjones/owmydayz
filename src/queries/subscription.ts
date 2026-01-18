import { queryOptions } from "@tanstack/react-query";
import { getUserPlanFn } from "~/fn/subscriptions";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const getUserPlanQuery = () =>
	queryOptions({
		queryKey: ["user-plan"],
		queryFn: () => getUserPlanFn({ headers: getAuthHeaders() }),
	});
