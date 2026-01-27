import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { ClockifyClient } from "~/lib/clockify";
import { api } from "../../convex/_generated/api";

/**
 * Create a Convex HTTP client for server-side queries
 */
function getConvexClient(): ConvexHttpClient {
	const convexUrl = process.env.VITE_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("VITE_CONVEX_URL environment variable is not set");
	}
	return new ConvexHttpClient(convexUrl);
}

/**
 * Get authenticated user ID from request headers
 */
function getAuthenticatedUserId(): string {
	const headers = getRequest().headers;
	const userId = headers.get("x-user-id");
	if (!userId) {
		throw new Error("Unauthorized - no user ID in request");
	}
	return userId;
}

/**
 * Get a ClockifyClient instance for the authenticated user and workspace
 */
async function getClockifyClient(
	userId: string,
	workspaceId: string,
): Promise<ClockifyClient> {
	const convex = getConvexClient();

	// Get the API key from Convex
	const apiKeyData = await convex.query(api.clockify.getApiKey, {
		userId,
		workspaceId,
	});

	if (!apiKeyData || !apiKeyData.apiKey) {
		throw new Error(
			"No valid Clockify API key found. Please connect your Clockify account.",
		);
	}

	return new ClockifyClient(apiKeyData.apiKey);
}

/**
 * Get Clockify user info for the authenticated user
 */
export const getClockifyUserFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const userId = getAuthenticatedUserId();

	// Get first workspace connection
	const convex = getConvexClient();
	const connections = await convex.query(api.clockify.getConnections, {
		userId,
	});

	if (!connections || connections.length === 0) {
		throw new Error(
			"No Clockify connections found. Please connect your Clockify account.",
		);
	}

	const workspaceId = connections[0].workspaceId;
	const client = await getClockifyClient(userId, workspaceId);
	return await client.getCurrentUser();
});

/**
 * Get projects for a workspace
 */
export const getClockifyProjectsFn = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ workspaceId: z.string() }))
	.handler(async ({ data }) => {
		const userId = getAuthenticatedUserId();
		const client = await getClockifyClient(userId, data.workspaceId);
		return await client.getProjects(data.workspaceId);
	});

/**
 * Get clients for a workspace
 */
export const getClockifyClientsFn = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ workspaceId: z.string() }))
	.handler(async ({ data }) => {
		const userId = getAuthenticatedUserId();
		const client = await getClockifyClient(userId, data.workspaceId);
		return await client.getClients(data.workspaceId);
	});

/**
 * Get current running timer
 */
export const getCurrentTimerFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const userId = getAuthenticatedUserId();
	const request = getRequest();
	const url = new URL(request.url);
	const workspaceId = url.searchParams.get("workspaceId");
	const clockifyUserId = url.searchParams.get("clockifyUserId");

	if (!workspaceId || !clockifyUserId) {
		throw new Error("workspaceId and clockifyUserId are required");
	}

	const client = await getClockifyClient(userId, workspaceId);
	return await client.getCurrentTimer(workspaceId, clockifyUserId);
});

/**
 * Start a timer
 */
export const startTimerFn = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			workspaceId: z.string(),
			clockifyUserId: z.string(),
			description: z.string().optional(),
			projectId: z.string().optional(),
			taskId: z.string().optional(),
			billable: z.boolean().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const userId = getAuthenticatedUserId();
		const client = await getClockifyClient(userId, data.workspaceId);
		return await client.startTimer(data.workspaceId, data.clockifyUserId, {
			description: data.description,
			projectId: data.projectId,
			taskId: data.taskId,
			billable: data.billable,
		});
	});

/**
 * Stop the current timer
 */
export const stopTimerFn = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			workspaceId: z.string(),
			clockifyUserId: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const userId = getAuthenticatedUserId();
		const client = await getClockifyClient(userId, data.workspaceId);
		return await client.stopTimer(data.workspaceId, data.clockifyUserId);
	});

/**
 * Sync timer state from Clockify.
 * Checks the current running timer in Clockify and returns the state.
 */
export const syncTimerStateFn = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			workspaceId: z.string(),
			clockifyUserId: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const userId = getAuthenticatedUserId();
		const client = await getClockifyClient(userId, data.workspaceId);

		try {
			// Get current timer from Clockify
			const currentTimer = await client.getCurrentTimer(
				data.workspaceId,
				data.clockifyUserId,
			);

			if (!currentTimer) {
				return {
					isRunning: false,
					timeEntryId: null,
					startedAt: null,
					elapsedSeconds: 0,
				};
			}

			// Calculate elapsed time
			const startTime = new Date(currentTimer.timeInterval.start).getTime();
			const now = Date.now();
			const elapsedSeconds = Math.floor((now - startTime) / 1000);

			return {
				isRunning: true,
				timeEntryId: currentTimer.id,
				startedAt: startTime,
				elapsedSeconds,
			};
		} catch (error) {
			console.error("Error syncing timer state:", error);
			// Return no timer if there's an error
			return {
				isRunning: false,
				timeEntryId: null,
				startedAt: null,
				elapsedSeconds: 0,
			};
		}
	});

/**
 * Get all running timers for the authenticated user
 */
export const getRunningTimersFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const userId = getAuthenticatedUserId();
	const convex = getConvexClient();

	return await convex.query(api.kanban.getRunningTimers, {
		userId,
	});
});
