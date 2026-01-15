import { queryOptions } from "@tanstack/react-query";
import {
  getBoardsFn,
  getBoardByIdFn,
  getBoardWithColumnsFn,
  getAllNowItemsFn,
} from "~/fn/kanban";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const boardsQueryOptions = () =>
  queryOptions({
    queryKey: ["kanban-boards"],
    queryFn: () => getBoardsFn({ headers: getAuthHeaders() }),
  });

export const boardQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["kanban-board", boardId],
    queryFn: () => getBoardByIdFn({ data: { id: boardId }, headers: getAuthHeaders() }),
  });

export const boardWithColumnsQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["kanban-board", boardId, "columns"],
    queryFn: () => getBoardWithColumnsFn({ data: { id: boardId }, headers: getAuthHeaders() }),
  });

export const allNowItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["kanban-now-items"],
    queryFn: () => getAllNowItemsFn({ headers: getAuthHeaders() }),
  });
