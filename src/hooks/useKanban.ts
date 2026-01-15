import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  boardsQueryOptions,
  boardQueryOptions,
  boardWithColumnsQueryOptions,
  allNowItemsQueryOptions,
} from "~/queries/kanban";
import {
  createBoardFn,
  updateBoardFn,
  deleteBoardFn,
  createColumnFn,
  updateColumnFn,
  deleteColumnFn,
  reorderColumnsFn,
  createItemFn,
  updateItemFn,
  deleteItemFn,
  moveItemFn,
  moveItemToBoardFn,
  completeItemFn,
} from "~/fn/kanban";
import { getErrorMessage } from "~/utils/error";
import { getAuthHeaders } from "~/utils/server-fn-client";
import type { KanbanImportance, KanbanEffort } from "~/db/schema";

// =====================================================
// Board Hooks
// =====================================================

export function useBoards(enabled = true) {
  return useQuery({
    ...boardsQueryOptions(),
    enabled,
  });
}

export function useBoard(boardId: string, enabled = true) {
  return useQuery({
    ...boardQueryOptions(boardId),
    enabled: enabled && !!boardId,
  });
}

export function useBoardWithColumns(boardId: string, enabled = true) {
  return useQuery({
    ...boardWithColumnsQueryOptions(boardId),
    enabled: enabled && !!boardId,
  });
}

interface CreateBoardData {
  name: string;
  description?: string;
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardData) => createBoardFn({ data, headers: getAuthHeaders() }),
    onSuccess: () => {
      toast.success("Board created successfully!", {
        description: "Your new board is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
    },
    onError: (error) => {
      toast.error("Failed to create board", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateBoardData {
  id: string;
  name: string;
  description?: string;
  focusMode?: boolean;
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBoardData) => updateBoardFn({ data, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Board updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.id] });
    },
    onError: (error) => {
      toast.error("Failed to update board", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => deleteBoardFn({ data: { id: boardId }, headers: getAuthHeaders() }),
    onSuccess: () => {
      toast.success("Board deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
    },
    onError: (error) => {
      toast.error("Failed to delete board", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Column Hooks
// =====================================================

interface CreateColumnData {
  boardId: string;
  name: string;
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateColumnData) => createColumnFn({ data, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Column created successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to create column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateColumnData {
  id: string;
  name: string;
  boardId: string; // For query invalidation
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateColumnData) =>
      updateColumnFn({ data: { id: data.id, name: data.name }, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Column updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to update column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteColumnData {
  id: string;
  boardId: string; // For query invalidation
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteColumnData) => deleteColumnFn({ data: { id: data.id }, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Column deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to delete column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface ReorderColumnsData {
  boardId: string;
  columnOrder: Array<{ id: string; position: number }>;
}

export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderColumnsData) => reorderColumnsFn({ data, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to reorder columns", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Item Hooks
// =====================================================

interface CreateItemData {
  columnId: string;
  boardId: string;
  name: string;
  description?: string;
  importance?: KanbanImportance;
  effort?: KanbanEffort;
  tags?: string[];
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemData) => createItemFn({ data, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Item created successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to create item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateItemData {
  id: string;
  name: string;
  description?: string;
  importance?: KanbanImportance;
  effort?: KanbanEffort;
  tags?: string[];
  boardId: string; // For query invalidation
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateItemData) =>
      updateItemFn({
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          importance: data.importance,
          effort: data.effort,
          tags: data.tags,
        },
        headers: getAuthHeaders(),
      }),
    onSuccess: (_, variables) => {
      toast.success("Item updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to update item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteItemData {
  id: string;
  boardId: string; // For query invalidation
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteItemData) => deleteItemFn({ data: { id: data.id }, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      toast.success("Item deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to delete item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface MoveItemData {
  itemId: string;
  newColumnId: string;
  newPosition: number;
  boardId: string; // For query invalidation
}

export function useMoveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoveItemData) =>
      moveItemFn({
        data: {
          itemId: data.itemId,
          newColumnId: data.newColumnId,
          newPosition: data.newPosition,
        },
        headers: getAuthHeaders(),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
      // Also invalidate review data in case item moved to/from Completed column
      queryClient.invalidateQueries({ queryKey: ["review-completed-items"] });
      queryClient.invalidateQueries({ queryKey: ["review-stats"] });
    },
    onError: (error) => {
      toast.error("Failed to move item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface MoveItemToBoardData {
  itemId: string;
  newBoardId: string;
  newColumnId: string;
  newPosition: number;
  sourceBoardId: string; // For query invalidation
}

export function useMoveItemToBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoveItemToBoardData) =>
      moveItemToBoardFn({
        data: {
          itemId: data.itemId,
          newBoardId: data.newBoardId,
          newColumnId: data.newColumnId,
          newPosition: data.newPosition,
        },
        headers: getAuthHeaders(),
      }),
    onSuccess: (_, variables) => {
      toast.success("Item moved to another board!");
      // Invalidate both source and target boards
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.sourceBoardId] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.newBoardId] });
    },
    onError: (error) => {
      toast.error("Failed to move item to board", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Focus View Hooks (All Now Items)
// =====================================================

export function useAllNowItems(enabled = true) {
  return useQuery({
    ...allNowItemsQueryOptions(),
    enabled,
  });
}

interface CompleteItemData {
  itemId: string;
  boardId: string; // For query invalidation
}

export function useCompleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteItemData) =>
      completeItemFn({ data: { itemId: data.itemId }, headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      // Invalidate the now items list, specific board, and review data
      queryClient.invalidateQueries({ queryKey: ["kanban-now-items"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board", variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ["review-completed-items"] });
      queryClient.invalidateQueries({ queryKey: ["review-stats"] });
    },
    onError: (error) => {
      toast.error("Failed to complete item", {
        description: getErrorMessage(error),
      });
    },
  });
}
