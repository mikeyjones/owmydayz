# Authentication System Documentation

This document explains how authentication works in this TanStack Start application using Better Auth with Convex.

## Overview

The project uses **Better Auth** for authentication with the **Convex adapter**. Authentication requests are handled by the Convex HTTP router, which stores auth data in Convex tables.

## Architecture Components

### 1. Better Auth Configuration (Convex - `convex/auth.ts`)

```typescript
import { createClient } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    secret: authSecret,
    emailAndPassword: {
      enabled: true,
    },
    // ...
  });
};
```

**Key Features:**

- Uses Convex adapter for data storage
- Email and password authentication enabled
- Auth endpoints served from Convex HTTP router

### 2. Convex HTTP Router (`convex/http.ts`)

```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: ["http://localhost:3000", /* ... */],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  },
});

export default http;
```

**Purpose:**

- Registers better-auth API endpoints on Convex HTTP
- Handles authentication requests at the Convex site URL
- Manages CORS for cross-origin requests from the frontend

### 3. Client-Side Auth (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  fetchOptions: {
    credentials: "include", // Required for cross-origin cookies
  },
});
```

**Important:** The auth client points to `VITE_CONVEX_SITE_URL`, NOT the TanStack Start URL. This ensures auth requests go to Convex.

**Usage:**

- Provides React hooks for authentication state
- Handles sign-in/sign-up operations
- Manages client-side session state

### 4. Database Schema (Convex)

The authentication system uses tables managed by the `@convex-dev/better-auth` component:

- `user` - User accounts with email, name, etc.
- `session` - Active sessions with tokens
- `account` - OAuth/email providers linked to users
- `verification` - Email verification tokens

## Authentication Flow

### 1. Email Registration

```typescript
const result = await authClient.signUp.email({
  email: data.email,
  password: data.password,
  name: data.name,
});
```

**Process:**

1. Client calls `authClient.signUp.email()`
2. Request goes to Convex HTTP (`/api/auth/sign-up/email`)
3. Better Auth creates user in Convex database
4. Session cookie is set (with `sameSite: "none"` for cross-origin)
5. User is redirected on success

### 2. Email Sign-In

```typescript
await authClient.signIn.email(
  { email, password },
  {
    onSuccess: () => router.navigate({ to: "/" }),
    onError: (error) => setAuthError(error.error.message),
  }
);
```

### 3. Session Management

Sessions are stored in Convex and validated via cookies. Since Convex runs on a different domain than the frontend, cookies use:

```typescript
defaultCookieAttributes: {
  sameSite: "none",
  secure: true,
  httpOnly: true,
}
```

## Server-Side Authentication (TanStack Start)

### The Challenge

TanStack Start server functions run on a different server than Convex. They cannot directly access Convex auth cookies. To work around this:

1. The client includes the user ID in a custom header (`X-User-Id`)
2. Server functions read this header to identify the user

### Authentication Header Utility (`src/utils/server-fn-client.ts`)

```typescript
import { authClient } from "~/lib/auth-client";

export function getAuthHeaders(): HeadersInit {
  const session = authClient.$session?.get();
  const userId = session?.user?.id;

  if (!userId) return {};
  return { "x-user-id": userId };
}
```

### Authentication Middleware (`src/fn/middleware.ts`)

```typescript
async function getAuthenticatedUserId(): Promise<string> {
  const request = getRequest();
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
  return next({ context: { userId } });
});
```

### Using Auth in Server Functions

All server function calls from hooks must include auth headers:

```typescript
// In queries (src/queries/kanban.ts)
export const boardsQueryOptions = () =>
  queryOptions({
    queryKey: ["kanban-boards"],
    queryFn: () => getBoardsFn({ headers: getAuthHeaders() }),
  });

// In mutations (src/hooks/useKanban.ts)
export function useCreateBoard() {
  return useMutation({
    mutationFn: (data) => createBoardFn({ data, headers: getAuthHeaders() }),
  });
}
```

## Client-Side Authentication State

### Session Hook

```typescript
import { authClient } from "~/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;

  return <div>Welcome {session.user.name}!</div>;
}
```

### Current User Hook (`src/hooks/useCurrentUser.ts`)

```typescript
export function useCurrentUser() {
  const session = authClient.useSession();
  
  return {
    user: session.data?.user ?? null,
    userId: session.data?.user?.id ?? null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
  };
}
```

## Environment Variables

Required environment variables:

```bash
# Convex
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
VITE_CONVEX_SITE_URL="https://your-deployment.convex.site"

# Better Auth (set in Convex environment)
BETTER_AUTH_SECRET="your-secret-key"
SITE_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Common Patterns

### 1. Protecting Routes

```typescript
const { data: session } = authClient.useSession();

if (!session) {
  return <Navigate to="/sign-in" />;
}
```

### 2. Conditional Rendering

```typescript
const { data: session } = authClient.useSession();

return session ? <UserDashboard /> : <LoginPrompt />;
```

### 3. Server Function Authorization

```typescript
export const protectedFunction = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Function logic with authenticated user
  });
```

## Security Considerations

1. **X-User-Id Header**: The middleware trusts the client-provided userId. For highly sensitive operations, implement additional verification.

2. **Cross-Origin Cookies**: Requires HTTPS in production for `sameSite: "none"` cookies to work.

3. **Session Validation**: Sessions are validated by Better Auth on the Convex side.

4. **CORS Configuration**: The Convex HTTP router explicitly lists allowed origins.

## Troubleshooting

### Common Issues

1. **"No session" errors in server functions**
   - Ensure `headers: getAuthHeaders()` is passed to server function calls
   - Check that the user is actually signed in

2. **Auth requests failing**
   - Verify `VITE_CONVEX_SITE_URL` is set correctly
   - Check browser console for CORS errors
   - Ensure Convex is deployed and running

3. **Cookies not being set**
   - In development, cookies may not work cross-origin over HTTP
   - Use the Convex site URL directly or deploy to HTTPS

4. **404 on `/api/auth/get-session` when deployed (e.g. Vercel)**
   - Auth runs on Convex HTTP, not on your app server. If `VITE_CONVEX_SITE_URL` is not set in your host’s environment, the client falls back to the app origin and requests hit your app, which has no auth routes → 404.
   - **Fix:** In your host (e.g. Vercel), set `VITE_CONVEX_SITE_URL` to your Convex HTTP URL (e.g. `https://your-deployment.convex.site`). Use the same value as in Convex Dashboard → Settings → URL (replace `.cloud` with `.site`). Rebuild and redeploy after adding the variable.

4. **Session not persisting**
   - Check that `credentials: "include"` is set in authClient
   - Verify cookie settings in `convex/auth.ts`

### Debug Tools

```typescript
// Check client session
const { data: session } = authClient.useSession();
console.log("Client session:", session);

// Check headers being sent
console.log("Auth headers:", getAuthHeaders());
```
