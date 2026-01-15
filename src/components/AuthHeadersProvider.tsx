"use client";

import { useEffect, type ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import { setCurrentUserId } from "~/utils/server-fn-client";

/**
 * Provider component that syncs the auth session to the server-fn-client utility.
 * 
 * This enables server function calls to automatically include the X-User-Id header
 * for authentication with TanStack Start server functions.
 * 
 * Place this component high in the component tree, wrapping any components that
 * may call authenticated server functions.
 */
export function AuthHeadersProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      setCurrentUserId(session?.user?.id ?? null);
    }
  }, [session?.user?.id, isPending]);

  return <>{children}</>;
}
