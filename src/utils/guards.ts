import { redirect } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";

/**
 * Check if user is authenticated.
 * This is a client-side check that verifies the session.
 */
export async function assertAuthenticated(): Promise<void> {
	// Get the current session
	const session = await authClient.getSession();

	if (!session?.data?.user) {
		throw redirect({ to: "/unauthenticated" });
	}
}

/**
 * Alias for assertAuthenticated for backward compatibility
 */
export const assertAuthenticatedFn = assertAuthenticated;
