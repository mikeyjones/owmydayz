// Stub hook - conversations not yet implemented in Convex
// TODO: Implement conversations in Convex

export function useConversations() {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

export function useConversation(conversationId: string) {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
}

export function useStartConversation() {
  return {
    mutate: async () => {
      console.warn("Conversations not yet implemented in Convex");
    },
    mutateAsync: async () => {
      console.warn("Conversations not yet implemented in Convex");
      return null;
    },
    isPending: false,
    isError: false,
  };
}
