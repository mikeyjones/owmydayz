import { queryOptions } from "@tanstack/react-query";
import {
  getTeamBoardsFn,
  getAllTeamBoardsFn,
  getTeamBoardByIdFn,
  getTeamBoardWithColumnsFn,
  getAllTeamNowItemsFn,
} from "~/fn/team-boards";

export const teamBoardsQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team-boards", teamId],
    queryFn: () => getTeamBoardsFn({ data: { teamId } }),
  });

export const allTeamBoardsQueryOptions = () =>
  queryOptions({
    queryKey: ["all-team-boards"],
    queryFn: () => getAllTeamBoardsFn(),
  });

export const teamBoardQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["team-board", boardId],
    queryFn: () => getTeamBoardByIdFn({ data: { id: boardId } }),
  });

export const teamBoardWithColumnsQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["team-board", boardId, "columns"],
    queryFn: () => getTeamBoardWithColumnsFn({ data: { id: boardId } }),
  });

export const allTeamNowItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["team-now-items"],
    queryFn: () => getAllTeamNowItemsFn(),
  });
