import { createAuthClient } from "better-auth/react";

// Use Convex HTTP URL for auth (better-auth runs on Convex, not TanStack Start)
// The Convex site URL is where the better-auth endpoints are registered
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  fetchOptions: {
    // Required for cross-origin cookies to work
    credentials: "include",
  },
});
