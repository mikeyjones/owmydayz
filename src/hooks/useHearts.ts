// Stub hook - hearts not yet implemented in Convex
// TODO: Implement hearts in Convex

export function usePostHeartStatus(_postId: string) {
  return {
    data: { isLiked: false, likeCount: 0 },
    isLoading: false,
    error: null,
  };
}

export function useTogglePostHeart() {
  return {
    mutate: async () => {
      console.warn("Hearts not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}
