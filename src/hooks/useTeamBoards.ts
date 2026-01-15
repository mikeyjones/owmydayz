import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  teamBoardsQueryOptions,
  allTeamBoardsQueryOptions,
  teamBoardQueryOptions,
  teamBoardWithColumnsQueryOptions,
  allTeamNowItemsQueryOptions,
} from "~/queries/team-boards";
import {
  createTeamBoardFn,
  updateTeamBoardFn,
  deleteTeamBoardFn,
  createTeamColumnFn,
  updateTeamColumnFn,
  deleteTeamColumnFn,
  reorderTeamColumnsFn,
  createTeamItemFn,
  updateTeamItemFn,
  deleteTeamItemFn,
  moveTeamItemFn,
  completeTeamItemFn,
} from "~/fn/team-boards";
import { getErrorMessage } from "~/utils/error";
import type { KanbanImportance, KanbanEffort } from "~/db/schema";

// =====================================================
// Team Board Hooks
// =====================================================

export function useTeamBoards(teamId: string, enabled = true) {
  return useQuery({
    ...teamBoardsQueryOptions(teamId),
    enabled: enabled && !!teamId,
  });
}

export function useAllTeamBoards(enabled = true) {
  return useQuery({
    ...allTeamBoardsQueryOptions(),
    enabled,
  });
}

export function useTeamBoard(boardId: string, enabled = true) {
  return useQuery({
    ...teamBoardQueryOptions(boardId),
    enabled: enabled && !!boardId,
  });
}

export function useTeamBoardWithColumns(boardId: string, enabled = true) {
  return useQuery({
    ...teamBoardWithColumnsQueryOptions(boardId),
    enabled: enabled && !!boardId,
  });
}

interface CreateTeamBoardData {
  teamId: string;
  name: string;
  description?: string;
}

export function useCreateTeamBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamBoardData) => createTeamBoardFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Board created successfully!", {
        description: "Your new team board is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["team-boards", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["all-team-boards"] });
    },
    onError: (error) => {
      toast.error("Failed to create board", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateTeamBoardData {
  id: string;
  name: string;
  description?: string;
  focusMode?: boolean;
  teamId: string; // For query invalidation
}

export function useUpdateTeamBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamBoardData) =>
      updateTeamBoardFn({ data: { id: data.id, name: data.name, description: data.description, focusMode: data.focusMode } }),
    onSuccess: (_, variables) => {
      toast.success("Board updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-boards", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["all-team-boards"] });
    },
    onError: (error) => {
      toast.error("Failed to update board", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteTeamBoardData {
  id: string;
  teamId: string; // For query invalidation
}

export function useDeleteTeamBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteTeamBoardData) =>
      deleteTeamBoardFn({ data: { id: data.id } }),
    onSuccess: (_, variables) => {
      toast.success("Board deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-boards", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["all-team-boards"] });
    },
    onError: (error) => {
      toast.error("Failed to delete board", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Team Column Hooks
// =====================================================

interface CreateTeamColumnData {
  boardId: string;
  name: string;
}

export function useCreateTeamColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamColumnData) => createTeamColumnFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Column created successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to create column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateTeamColumnData {
  id: string;
  name: string;
  boardId: string; // For query invalidation
}

export function useUpdateTeamColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamColumnData) =>
      updateTeamColumnFn({ data: { id: data.id, name: data.name } }),
    onSuccess: (_, variables) => {
      toast.success("Column updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to update column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteTeamColumnData {
  id: string;
  boardId: string; // For query invalidation
}

export function useDeleteTeamColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteTeamColumnData) =>
      deleteTeamColumnFn({ data: { id: data.id } }),
    onSuccess: (_, variables) => {
      toast.success("Column deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to delete column", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface ReorderTeamColumnsData {
  boardId: string;
  columnOrder: Array<{ id: string; position: number }>;
}

export function useReorderTeamColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderTeamColumnsData) => reorderTeamColumnsFn({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to reorder columns", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Team Item Hooks
// =====================================================

interface CreateTeamItemData {
  columnId: string;
  boardId: string;
  name: string;
  description?: string;
  importance?: KanbanImportance;
  effort?: KanbanEffort;
  tags?: string[];
}

export function useCreateTeamItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamItemData) => createTeamItemFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Item created successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to create item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateTeamItemData {
  id: string;
  name: string;
  description?: string;
  importance?: KanbanImportance;
  effort?: KanbanEffort;
  tags?: string[];
  boardId: string; // For query invalidation
}

export function useUpdateTeamItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamItemData) =>
      updateTeamItemFn({
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          importance: data.importance,
          effort: data.effort,
          tags: data.tags,
        },
      }),
    onSuccess: (_, variables) => {
      toast.success("Item updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to update item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteTeamItemData {
  id: string;
  boardId: string; // For query invalidation
}

export function useDeleteTeamItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteTeamItemData) =>
      deleteTeamItemFn({ data: { id: data.id } }),
    onSuccess: (_, variables) => {
      toast.success("Item deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to delete item", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface MoveTeamItemData {
  itemId: string;
  newColumnId: string;
  newPosition: number;
  boardId: string; // For query invalidation
}

export function useMoveTeamItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoveTeamItemData) =>
      moveTeamItemFn({
        data: {
          itemId: data.itemId,
          newColumnId: data.newColumnId,
          newPosition: data.newPosition,
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ["team-now-items"] });
    },
    onError: (error) => {
      toast.error("Failed to move item", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Focus View Hooks (All Now Items from Team Boards)
// =====================================================

export function useAllTeamNowItems(enabled = true) {
  return useQuery({
    ...allTeamNowItemsQueryOptions(),
    enabled,
  });
}

interface CompleteTeamItemData {
  itemId: string;
  boardId: string; // For query invalidation
}

export function useCompleteTeamItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteTeamItemData) =>
      completeTeamItemFn({ data: { itemId: data.itemId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-now-items"] });
      queryClient.invalidateQueries({ queryKey: ["team-board", variables.boardId] });
    },
    onError: (error) => {
      toast.error("Failed to complete item", {
        description: getErrorMessage(error),
      });
    },
  });
}
