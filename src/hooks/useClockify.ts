import { useQuery } from "@tanstack/react-query";
import { useQuery as useConvexQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import {
	getClockifyClientsFn,
	getClockifyProjectsFn,
	getClockifyUserFn,
	getRunningTimersFn,
	startTimerFn,
	stopTimerFn,
} from "~/fn/clockify";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook to get Clockify connections for the current user.
 * Returns an array of active Clockify workspace connections.
 */
export function useClockifyConnection() {
	const { userId } = useCurrentUser();

	const connections = useConvexQuery(
		api.clockify.getConnections,
		!userId ? "skip" : { userId },
	);

	return {
		data: connections,
		isLoading: connections === undefined && !!userId,
		isConnected: connections && connections.length > 0,
		activeWorkspace: connections?.[0] ?? null,
	};
}

/**
 * Hook to get Clockify projects for a workspace.
 * Uses TanStack Query for caching.
 */
export function useClockifyProjects(workspaceId?: string, enabled = true) {
	const { userId } = useCurrentUser();

	const query = useQuery({
		queryKey: ["clockify-projects", workspaceId, userId],
		queryFn: async () => {
			if (!workspaceId) {
				throw new Error("workspaceId is required");
			}
			if (!userId) {
				throw new Error("User ID is required");
			}

			// Call server function with user ID in headers
			return await getClockifyProjectsFn({
				data: { workspaceId },
				headers: {
					"x-user-id": userId,
				},
			});
		},
		enabled: enabled && !!userId && !!workspaceId,
	});

	return {
		data: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

/**
 * Hook to get Clockify clients for a workspace.
 * Uses TanStack Query for caching.
 */
export function useClockifyClients(workspaceId?: string, enabled = true) {
	const { userId } = useCurrentUser();

	const query = useQuery({
		queryKey: ["clockify-clients", workspaceId, userId],
		queryFn: async () => {
			if (!workspaceId) {
				throw new Error("workspaceId is required");
			}
			if (!userId) {
				throw new Error("User ID is required");
			}

			return await getClockifyClientsFn({
				data: { workspaceId },
				headers: {
					"x-user-id": userId,
				},
			});
		},
		enabled: enabled && !!userId && !!workspaceId,
	});

	return {
		data: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

interface StartTimerOptions {
	itemId: string;
	description?: string;
	projectId?: string;
	workspaceId?: string;
}

interface MutationCallbacks<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

/**
 * Hook to start a Clockify timer.
 * Starts a timer in Clockify and updates the kanban item with timer info.
 * Automatically stops any other running timers before starting the new one.
 */
export function useStartTimer() {
	const { userId } = useCurrentUser();
	const updateItemTimer = useMutation(api.kanban.updateItemTimer);

	return {
		mutate: async (
			options: StartTimerOptions,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				const error = new Error("You must be logged in to start a timer");
				toast.error("You must be logged in to start a timer");
				callbacks?.onError?.(error);
				return;
			}

			try {
				// Get Clockify user info to get workspace and user IDs
				const clockifyUser = await getClockifyUserFn({
					headers: {
						"x-user-id": userId,
					},
				});
				const workspaceId = options.workspaceId ?? clockifyUser.activeWorkspace;

				// Get all running timers to clear them before starting new one
				const runningTimers = await getRunningTimersFn({
					headers: {
						"x-user-id": userId,
					},
				});

				// Clear all running timers in the database
				// (Clockify timer will be stopped automatically by ClockifyClient.startTimer)
				for (const timer of runningTimers) {
					// Calculate total time for the stopped timer
					const totalSeconds = timer.timerStartedAt
						? Math.floor((Date.now() - timer.timerStartedAt) / 1000)
						: 0;

					await updateItemTimer({
						id: timer.itemId,
						clockifyTimeEntryId: undefined,
						timerStartedAt: undefined,
						timerTotalSeconds: totalSeconds,
						lastTimerSync: Date.now(),
						userId,
					});
				}

				// Start timer in Clockify (this will also stop any running timer in Clockify)
				const timeEntry = await startTimerFn({
					data: {
						workspaceId,
						clockifyUserId: clockifyUser.id,
						description: options.description,
						projectId: options.projectId,
					},
					headers: {
						"x-user-id": userId,
					},
				});

				// Update the kanban item with timer info
				await updateItemTimer({
					id: options.itemId as Id<"kanbanItems">,
					clockifyTimeEntryId: timeEntry.id,
					timerStartedAt: Date.now(),
					lastTimerSync: Date.now(),
					userId,
				});

				toast.success("Timer started!", {
					description: options.description || "Tracking time in Clockify",
				});
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to start timer", {
					description: err.message,
				});
				callbacks?.onError?.(err);
				throw error;
			}
		},
		isPending: false,
	};
}

interface StopTimerOptions {
	itemId: string;
	workspaceId?: string;
}

/**
 * Hook to stop a Clockify timer.
 * Stops the currently running timer in Clockify and updates the kanban item.
 */
export function useStopTimer() {
	const { userId } = useCurrentUser();
	const updateItemTimer = useMutation(api.kanban.updateItemTimer);

	return {
		mutate: async (
			options: StopTimerOptions,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				const error = new Error("You must be logged in to stop a timer");
				toast.error("You must be logged in to stop a timer");
				callbacks?.onError?.(error);
				return;
			}

			try {
				// Get Clockify user info
				const clockifyUser = await getClockifyUserFn({
					headers: {
						"x-user-id": userId,
					},
				});
				const workspaceId = options.workspaceId ?? clockifyUser.activeWorkspace;

				// Stop timer in Clockify
				const timeEntry = await stopTimerFn({
					data: {
						workspaceId,
						clockifyUserId: clockifyUser.id,
					},
					headers: {
						"x-user-id": userId,
					},
				});

				// Calculate total time
				const start = new Date(timeEntry.timeInterval.start).getTime();
				const end = timeEntry.timeInterval.end
					? new Date(timeEntry.timeInterval.end).getTime()
					: Date.now();
				const totalSeconds = Math.floor((end - start) / 1000);

				// Update the kanban item to clear timer info
				await updateItemTimer({
					id: options.itemId as Id<"kanbanItems">,
					clockifyTimeEntryId: undefined,
					timerStartedAt: undefined,
					timerTotalSeconds: totalSeconds,
					lastTimerSync: Date.now(),
					userId,
				});

				toast.success("Timer stopped!", {
					description: `Tracked ${Math.floor(totalSeconds / 60)} minutes`,
				});
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to stop timer", {
					description: err.message,
				});
				callbacks?.onError?.(err);
				throw error;
			}
		},
		isPending: false,
	};
}

/**
 * Hook to connect Clockify using an API key.
 * Fetches workspaces from Clockify and stores the API key.
 */
export function useConnectClockify() {
	const { userId } = useCurrentUser();
	const storeApiKey = useMutation(api.clockify.storeApiKey);

	return {
		mutate: async (apiKey: string, callbacks?: MutationCallbacks<void>) => {
			if (!userId) {
				const error = new Error("You must be logged in to connect Clockify");
				toast.error("You must be logged in to connect Clockify");
				callbacks?.onError?.(error);
				return;
			}

			if (!apiKey.trim()) {
				const error = new Error("API key is required");
				toast.error("API key is required");
				callbacks?.onError?.(error);
				return;
			}

			try {
				// Fetch workspaces from Clockify API to verify the key works
				const response = await fetch(
					"https://api.clockify.me/api/v1/workspaces",
					{
						headers: {
							"X-Api-Key": apiKey,
						},
					},
				);

				if (!response.ok) {
					throw new Error("Invalid API key or unable to fetch workspaces");
				}

				const workspaces = await response.json();

				if (!workspaces || workspaces.length === 0) {
					throw new Error("No workspaces found for this API key");
				}

				// Store API key for the first workspace (user can add more later if needed)
				const workspace = workspaces[0];
				await storeApiKey({
					userId,
					workspaceId: workspace.id,
					workspaceName: workspace.name,
					apiKey,
				});

				toast.success("Clockify connected!", {
					description: `Connected to workspace: ${workspace.name}`,
				});
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to connect Clockify", {
					description: err.message,
				});
				callbacks?.onError?.(err);
				throw error;
			}
		},
		isPending: false,
	};
}

/**
 * Hook to disconnect a Clockify workspace.
 * Removes the Clockify connection for the user.
 */
export function useDisconnectClockify() {
	const { userId } = useCurrentUser();
	const removeConnection = useMutation(api.clockify.removeConnection);

	return {
		mutate: async (
			workspaceId: string,
			callbacks?: MutationCallbacks<void>,
		) => {
			if (!userId) {
				const error = new Error("You must be logged in to disconnect Clockify");
				toast.error("You must be logged in to disconnect Clockify");
				callbacks?.onError?.(error);
				return;
			}

			try {
				await removeConnection({
					userId,
					workspaceId,
				});

				toast.success("Clockify disconnected", {
					description: "Your Clockify workspace has been disconnected",
				});
				callbacks?.onSuccess?.();
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				toast.error("Failed to disconnect Clockify", {
					description: err.message,
				});
				callbacks?.onError?.(err);
				throw error;
			}
		},
		isPending: false,
	};
}
