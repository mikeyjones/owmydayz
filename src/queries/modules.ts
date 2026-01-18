import { queryOptions } from "@tanstack/react-query";
import {
	getModuleByIdFn,
	getModuleContentsFn,
	getModulesFn,
} from "~/fn/modules";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const modulesQueryOptions = () =>
	queryOptions({
		queryKey: ["modules"],
		queryFn: () => getModulesFn({ headers: getAuthHeaders() }),
	});

export const moduleQueryOptions = (moduleId: string) =>
	queryOptions({
		queryKey: ["module", moduleId],
		queryFn: () =>
			getModuleByIdFn({ data: { id: moduleId }, headers: getAuthHeaders() }),
	});

export const moduleContentsQueryOptions = (moduleId: string) =>
	queryOptions({
		queryKey: ["module-contents", moduleId],
		queryFn: () =>
			getModuleContentsFn({ data: { moduleId }, headers: getAuthHeaders() }),
	});
