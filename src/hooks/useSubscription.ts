// Stub hook - subscriptions not yet implemented in Convex
// TODO: Implement subscriptions in Convex

export function useSubscription() {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
}

export function useCreateCheckoutSession() {
  return {
    mutate: async () => {
      console.warn("Subscriptions not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}

export function useCancelSubscription() {
  return {
    mutate: async () => {
      console.warn("Subscriptions not yet implemented in Convex");
    },
    isPending: false,
    isError: false,
  };
}

export function useUserPlan() {
  return {
    data: { plan: "free" },
    isLoading: false,
    error: null,
  };
}
