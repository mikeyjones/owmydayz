// Stub hook - reactions not yet implemented in Convex
// TODO: Implement reactions in Convex

export function useReactions(targetId: string, targetType: string) {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

export function useToggleReaction() {
  return {
    mutate: async () => {
      console.warn("Reactions not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}

export function useCommentReactionStatus(_commentId: string) {
  return {
    data: { isLiked: false, likeCount: 0 },
    isLoading: false,
    error: null,
  };
}

export function useToggleCommentReaction() {
  return {
    mutate: async () => {
      console.warn("Reactions not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}

export function usePostReactionStatus(_postId: string) {
  return {
    data: { isLiked: false, likeCount: 0 },
    isLoading: false,
    error: null,
  };
}

export function useTogglePostReaction() {
  return {
    mutate: async () => {
      console.warn("Reactions not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}
