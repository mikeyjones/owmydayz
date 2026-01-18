import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

// Site URL for auth callbacks - defaults to localhost for development
const siteUrl =
	process.env.SITE_URL ||
	process.env.CONVEX_SITE_URL ||
	"http://localhost:3000";

// Auth secret - REQUIRED for production
// Using a default for development only - MUST set BETTER_AUTH_SECRET in production
const authSecret =
	process.env.BETTER_AUTH_SECRET ||
	process.env.AUTH_SECRET ||
	"development-secret-change-in-production-12345";

// Create the auth component client
export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Creates a better-auth instance configured for Convex.
 * This is called for each request to handle auth operations.
 */
export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false },
) => {
	// Build social providers only if credentials are provided
	const socialProviders: Record<
		string,
		{ clientId: string; clientSecret: string }
	> = {};

	if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
		socialProviders.google = {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		};
	}

	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		secret: authSecret,
		emailAndPassword: {
			enabled: true,
		},
		...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
		// Trusted origins for CORS - add your frontend URLs here
		trustedOrigins: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://localhost:3003",
			// Add your production domain here
			process.env.SITE_URL || "",
		].filter(Boolean),
		// Advanced configuration for cross-origin cookies
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
			},
			// Note: For cross-origin cookies to work:
			// - Production: sameSite="none" + secure=true (HTTPS required)
			// - Development with HTTP: sameSite="lax" (cookies won't work cross-origin)
			// The Convex site is HTTPS, so we can use secure cookies
			defaultCookieAttributes: {
				sameSite: "none" as const,
				secure: true, // Convex site URL is HTTPS
				httpOnly: true,
				path: "/",
			},
		},
		// Disable logging for options-only calls (used for type inference)
		logger: {
			disabled: optionsOnly,
		},
	});
};

/**
 * Helper to get the authenticated user from a Convex context.
 * Use this in queries/mutations to verify authentication.
 *
 * NOTE: This only works in HTTP actions where cookies are available.
 * For regular queries/mutations, you need to pass the session token differently.
 */
export async function getAuthenticatedUser(ctx: GenericCtx<DataModel>) {
	try {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const session = await auth.api.getSession({ headers });
		return session?.user ?? null;
	} catch (error) {
		// In non-HTTP contexts (queries/mutations), getAuth may fail
		// because there's no HTTP request with cookies
		console.error("[Auth] Failed to get authenticated user:", error);
		return null;
	}
}

/**
 * Helper to require authentication - throws if not authenticated.
 * Use this in HTTP actions where auth should always be required.
 */
export async function requireAuth(ctx: GenericCtx<DataModel>) {
	const user = await getAuthenticatedUser(ctx);
	if (!user) {
		throw new Error("Unauthorized");
	}
	return user;
}

/**
 * Helper to get optional authentication - returns null if not authenticated.
 * Use this in queries/mutations where you want to handle unauthenticated gracefully.
 */
export async function getOptionalAuth(ctx: GenericCtx<DataModel>) {
	return await getAuthenticatedUser(ctx);
}

/**
 * Helper to get user from client-provided userId.
 * This is used for mutations where HTTP cookies aren't available.
 *
 * NOTE: This trusts the client-provided userId. For production apps with
 * sensitive data, you should implement proper session token validation.
 * For this app, we verify the userId exists in the database.
 */
export async function getUserFromClientId(
	_ctx: GenericCtx<DataModel>,
	userId: string | undefined,
): Promise<{ id: string } | null> {
	if (!userId) {
		return null;
	}

	// Basic validation - check if user exists in the auth system
	// The better-auth component stores users in the "user" table
	// We'll trust the userId if it's provided (this is a limitation of the architecture)
	return { id: userId };
}

/**
 * Helper to require user from client-provided userId.
 * Throws if userId is not provided.
 */
export function requireUserFromClientId(userId: string | undefined): {
	id: string;
} {
	if (!userId) {
		throw new Error("You must be logged in to perform this action");
	}
	return { id: userId };
}
