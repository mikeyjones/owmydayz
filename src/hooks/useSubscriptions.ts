// Stub hook - subscriptions not yet implemented in Convex
// TODO: Implement subscriptions in Convex

export function useSubscriptionStatus() {
	return {
		data: { isSubscribed: false, plan: "free" },
		isLoading: false,
		error: null,
	};
}
