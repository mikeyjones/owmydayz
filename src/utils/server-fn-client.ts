/**
 * Storage for the current user ID.
 * This is set by the AuthHeadersProvider component when the session changes.
 */
let currentUserId: string | null = null;

/**
 * Sets the current user ID. Called by AuthHeadersProvider when session changes.
 */
export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

/**
 * Gets the current user ID from memory.
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Gets headers for server function calls that include the authenticated user ID.
 * 
 * Since Convex auth runs on a separate domain, TanStack Start server functions
 * cannot access the auth cookies directly. This utility provides the X-User-Id
 * header that the server-side middleware expects.
 */
export function getAuthHeaders(): HeadersInit {
  if (!currentUserId) {
    return {};
  }

  return {
    "x-user-id": currentUserId,
  };
}
