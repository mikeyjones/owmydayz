import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Server function to check if the user is authenticated.
 * Uses the X-User-Id header set by the client from the better-auth session.
 */
export const assertAuthenticatedFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequest().headers;
    const userId = headers.get("x-user-id");
    if (!userId) {
      throw redirect({ to: "/unauthenticated" });
    }
  }
);
