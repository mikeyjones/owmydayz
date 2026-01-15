import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  kanbanItemCommentsQueryOptions,
  kanbanItemCommentRepliesQueryOptions,
  kanbanItemCommentCountQueryOptions,
  teamItemCommentsQueryOptions,
  teamItemCommentRepliesQueryOptions,
  teamItemCommentCountQueryOptions,
} from "~/queries/item-comments";
import {
  createKanbanItemCommentFn,
  updateKanbanItemCommentFn,
  deleteKanbanItemCommentFn,
  createTeamItemCommentFn,
  updateTeamItemCommentFn,
  deleteTeamItemCommentFn,
} from "~/fn/item-comments";
import { getErrorMessage } from "~/utils/error";

// =====================================================
// Kanban Item Comment Hooks
// =====================================================

export function useKanbanItemComments(itemId: string, enabled = true) {
  return useQuery({
    ...kanbanItemCommentsQueryOptions(itemId),
    enabled: enabled && !!itemId,
  });
}

export function useKanbanItemCommentReplies(parentCommentId: string, enabled = true) {
  return useQuery({
    ...kanbanItemCommentRepliesQueryOptions(parentCommentId),
    enabled: enabled && !!parentCommentId,
  });
}

export function useKanbanItemCommentCount(itemId: string, enabled = true) {
  return useQuery({
    ...kanbanItemCommentCountQueryOptions(itemId),
    enabled: enabled && !!itemId,
  });
}

interface CreateCommentData {
  itemId: string;
  content: string;
  parentCommentId?: string;
}

export function useCreateKanbanItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => createKanbanItemCommentFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Comment added!");
      queryClient.invalidateQueries({
        queryKey: ["kanban-item-comments", variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["kanban-item-comment-count", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["kanban-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to add comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateCommentData {
  commentId: string;
  content: string;
  itemId: string; // For query invalidation
  parentCommentId?: string; // For query invalidation if it's a reply
}

export function useUpdateKanbanItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCommentData) =>
      updateKanbanItemCommentFn({
        data: { commentId: data.commentId, content: data.content },
      }),
    onSuccess: (_, variables) => {
      toast.success("Comment updated!");
      queryClient.invalidateQueries({
        queryKey: ["kanban-item-comments", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["kanban-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to update comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface DeleteCommentData {
  commentId: string;
  itemId: string; // For query invalidation
  parentCommentId?: string; // For query invalidation if it's a reply
}

export function useDeleteKanbanItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteCommentData) =>
      deleteKanbanItemCommentFn({ data: { commentId: data.commentId } }),
    onSuccess: (_, variables) => {
      toast.success("Comment deleted!");
      queryClient.invalidateQueries({
        queryKey: ["kanban-item-comments", variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["kanban-item-comment-count", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["kanban-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to delete comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Team Item Comment Hooks
// =====================================================

export function useTeamItemComments(itemId: string, enabled = true) {
  return useQuery({
    ...teamItemCommentsQueryOptions(itemId),
    enabled: enabled && !!itemId,
  });
}

export function useTeamItemCommentReplies(parentCommentId: string, enabled = true) {
  return useQuery({
    ...teamItemCommentRepliesQueryOptions(parentCommentId),
    enabled: enabled && !!parentCommentId,
  });
}

export function useTeamItemCommentCount(itemId: string, enabled = true) {
  return useQuery({
    ...teamItemCommentCountQueryOptions(itemId),
    enabled: enabled && !!itemId,
  });
}

export function useCreateTeamItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => createTeamItemCommentFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Comment added!");
      queryClient.invalidateQueries({
        queryKey: ["team-item-comments", variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-item-comment-count", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["team-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to add comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useUpdateTeamItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCommentData) =>
      updateTeamItemCommentFn({
        data: { commentId: data.commentId, content: data.content },
      }),
    onSuccess: (_, variables) => {
      toast.success("Comment updated!");
      queryClient.invalidateQueries({
        queryKey: ["team-item-comments", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["team-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to update comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeleteTeamItemComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteCommentData) =>
      deleteTeamItemCommentFn({ data: { commentId: data.commentId } }),
    onSuccess: (_, variables) => {
      toast.success("Comment deleted!");
      queryClient.invalidateQueries({
        queryKey: ["team-item-comments", variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-item-comment-count", variables.itemId],
      });
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["team-item-comment-replies", variables.parentCommentId],
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to delete comment", {
        description: getErrorMessage(error),
      });
    },
  });
}
