import { queryOptions } from "@tanstack/react-query";
import {
	getAllTeamBoardsFn,
	getAllTeamNowItemsFn,
	getTeamBoardByIdFn,
	getTeamBoardsFn,
	getTeamBoardWithColumnsFn,
} from "~/fn/team-boards";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const teamBoardsQueryOptions = (teamId: string) =>
	queryOptions({
		queryKey: ["team-boards", teamId],
		queryFn: () =>
			getTeamBoardsFn({ data: { teamId }, headers: getAuthHeaders() }),
	});

export const allTeamBoardsQueryOptions = () =>
	queryOptions({
		queryKey: ["all-team-boards"],
		queryFn: () => getAllTeamBoardsFn({ headers: getAuthHeaders() }),
	});

export const teamBoardQueryOptions = (boardId: string) =>
	queryOptions({
		queryKey: ["team-board", boardId],
		queryFn: () =>
			getTeamBoardByIdFn({ data: { id: boardId }, headers: getAuthHeaders() }),
	});

export const teamBoardWithColumnsQueryOptions = (boardId: string) =>
	queryOptions({
		queryKey: ["team-board", boardId, "columns"],
		queryFn: () =>
			getTeamBoardWithColumnsFn({
				data: { id: boardId },
				headers: getAuthHeaders(),
			}),
	});

export const allTeamNowItemsQueryOptions = () =>
	queryOptions({
		queryKey: ["team-now-items"],
		queryFn: () => getAllTeamNowItemsFn({ headers: getAuthHeaders() }),
	});
