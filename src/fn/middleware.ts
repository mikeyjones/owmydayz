import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { isUserAdmin } from "~/data-access/users";

/**
 * Get the authenticated user ID from request headers.
 * 
 * Since Convex auth runs on a separate domain, TanStack Start server functions
 * cannot access the auth cookies directly. Instead, the client must pass
 * the user ID via the X-User-Id header.
 * 
 * SECURITY NOTE: This trusts the client-provided userId. For production apps
 * with sensitive data, you should implement proper session token validation
 * by verifying the token against your auth provider.
 */
async function getAuthenticatedUserId(): Promise<string> {
  const request = getRequest();

  if (!request?.headers) {
    throw new Error("No headers");
  }

  // Get userId from custom header (set by client from better-auth session)
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    throw new Error("No session - please sign in");
  }

  return userId;
}

export const authenticatedMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const userId = await getAuthenticatedUserId();

  return next({
    context: { userId },
  });
});

export const assertAdminMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const userId = await getAuthenticatedUserId();

  const adminCheck = await isUserAdmin(userId);
  if (!adminCheck) {
    throw new Error("Unauthorized: Only admins can perform this action");
  }

  return next({
    context: { userId },
  });
});
