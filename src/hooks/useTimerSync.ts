import { useQuery as useConvexQuery, useMutation } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { getClockifyUserFn, syncTimerStateFn } from "~/fn/clockify";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook to sync timer state from Clockify every 30 seconds.
 * This ensures timers persist across browser sessions by:
 * 1. Polling for items with active timers
 * 2. Syncing each timer's state from Clockify
 * 3. Updating the database with the latest state
 */
export function useTimerSync(enabled = true) {
	const { userId } = useCurrentUser();
	const lastSyncRef = useRef<number>(0);
	const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Get all running timers from the database
	const runningTimers = useConvexQuery(
		api.kanban.getRunningTimers,
		enabled && userId ? { userId } : "skip",
	);

	// Mutation to update timer state
	const updateItemTimer = useMutation(api.kanban.updateItemTimer);

	// Sync a single timer with Clockify
	const syncTimer = useCallback(
		async (timer: {
			itemId: Id<"kanbanItems">;
			clockifyTimeEntryId?: string;
			timerStartedAt?: number;
			lastTimerSync?: number;
		}) => {
			if (!userId) return;

			try {
				// Get Clockify user info
				const clockifyUser = await getClockifyUserFn({
					headers: {
						"x-user-id": userId,
					},
				});
				const workspaceId = clockifyUser.activeWorkspace;

				// Sync timer state from Clockify
				const timerState = await syncTimerStateFn({
					data: {
						workspaceId,
						clockifyUserId: clockifyUser.id,
					},
					headers: {
						"x-user-id": userId,
					},
				});

				// If timer is running in Clockify and matches our timer
				if (
					timerState.isRunning &&
					timerState.timeEntryId === timer.clockifyTimeEntryId
				) {
					// Update the database with synced state
					await updateItemTimer({
						id: timer.itemId,
						clockifyTimeEntryId: timerState.timeEntryId,
						timerStartedAt: timerState.startedAt,
						lastTimerSync: Date.now(),
						userId,
					});
				} else if (!timerState.isRunning && timer.clockifyTimeEntryId) {
					// Timer was stopped in Clockify but not in our database
					// Calculate total time
					const totalSeconds = timer.timerStartedAt
						? Math.floor((Date.now() - timer.timerStartedAt) / 1000)
						: 0;

					// Clear timer state
					await updateItemTimer({
						id: timer.itemId,
						clockifyTimeEntryId: undefined,
						timerStartedAt: undefined,
						timerTotalSeconds: totalSeconds,
						lastTimerSync: Date.now(),
						userId,
					});
				}
			} catch (error) {
				console.error("Error syncing timer:", error);
				// Don't throw - we'll retry on next sync
			}
		},
		[userId, updateItemTimer],
	);

	// Sync all running timers
	const syncAllTimers = useCallback(async () => {
		if (!runningTimers || runningTimers.length === 0) {
			return;
		}

		const now = Date.now();
		const SYNC_COOLDOWN = 25000; // 25 seconds cooldown to avoid too frequent syncs

		// Don't sync if we synced recently
		if (now - lastSyncRef.current < SYNC_COOLDOWN) {
			return;
		}

		lastSyncRef.current = now;

		// Sync each timer sequentially to avoid overwhelming the API
		for (const timer of runningTimers) {
			await syncTimer(timer);
		}
	}, [runningTimers, syncTimer]);

	// Set up polling interval
	useEffect(() => {
		if (!enabled || !userId) {
			return;
		}

		// Sync immediately on mount
		syncAllTimers();

		// Set up 30-second polling
		syncIntervalRef.current = setInterval(() => {
			syncAllTimers();
		}, 30000); // 30 seconds

		return () => {
			if (syncIntervalRef.current) {
				clearInterval(syncIntervalRef.current);
			}
		};
	}, [enabled, userId, syncAllTimers]);

	return {
		isEnabled: enabled && !!userId,
		runningTimersCount: runningTimers?.length ?? 0,
	};
}
