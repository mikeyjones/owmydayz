import { authClient } from "~/lib/auth-client";

/**
 * Hook to get the current authenticated user from better-auth.
 * This is needed because Convex queries/mutations can't access HTTP cookies,
 * so we need to pass user info from the client.
 */
export function useCurrentUser() {
	const session = authClient.useSession();

	return {
		user: session.data?.user ?? null,
		userId: session.data?.user?.id ?? null,
		isLoading: session.isPending,
		isAuthenticated: !!session.data?.user,
	};
}

/**
 * Get the current user ID, throwing if not authenticated.
 * Use this in mutation hooks that require authentication.
 */
export function useRequireAuth() {
	const { userId, isLoading, isAuthenticated } = useCurrentUser();

	return {
		userId,
		isLoading,
		isAuthenticated,
		requireUserId: () => {
			if (!userId) {
				throw new Error("You must be logged in to perform this action");
			}
			return userId;
		},
	};
}
