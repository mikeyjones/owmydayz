import { queryOptions } from "@tanstack/react-query";
import {
  getBoardsFn,
  getBoardByIdFn,
  getBoardWithColumnsFn,
  getAllNowItemsFn,
} from "~/fn/kanban";

export const boardsQueryOptions = () =>
  queryOptions({
    queryKey: ["kanban-boards"],
    queryFn: () => getBoardsFn(),
  });

export const boardQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["kanban-board", boardId],
    queryFn: () => getBoardByIdFn({ data: { id: boardId } }),
  });

export const boardWithColumnsQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ["kanban-board", boardId, "columns"],
    queryFn: () => getBoardWithColumnsFn({ data: { id: boardId } }),
  });

export const allNowItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["kanban-now-items"],
    queryFn: () => getAllNowItemsFn(),
  });
