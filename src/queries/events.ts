import { queryOptions } from "@tanstack/react-query";
import { getEventByIdFn, getEventsFn, getUpcomingEventsFn } from "~/fn/events";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const eventQueryOptions = (eventId: string) =>
	queryOptions({
		queryKey: ["event", eventId],
		queryFn: () =>
			getEventByIdFn({ data: { id: eventId }, headers: getAuthHeaders() }),
	});

export const eventsQueryOptions = (start: Date, end: Date) =>
	queryOptions({
		queryKey: ["events", start.toISOString(), end.toISOString()],
		queryFn: () =>
			getEventsFn({
				data: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				headers: getAuthHeaders(),
			}),
	});

export const upcomingEventsQueryOptions = (limit: number = 10) =>
	queryOptions({
		queryKey: ["events", "upcoming", limit],
		queryFn: () =>
			getUpcomingEventsFn({
				data: { limit },
				headers: getAuthHeaders(),
			}),
	});

export const createEventMutationOptions = () =>
	queryOptions({
		queryKey: ["events", "create"],
	});
