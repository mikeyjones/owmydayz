// Stub hook - events not yet implemented in Convex
// TODO: Implement events in Convex

export function useEvents() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useEvent(_eventId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useCreateEvent() {
	return {
		mutate: async (_data: unknown, _options?: unknown) => {
			console.warn("Events not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateEvent() {
	return {
		mutate: async (_data: unknown, _options?: unknown) => {
			console.warn("Events not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteEvent() {
	return {
		mutate: async (_id: unknown, _options?: unknown) => {
			console.warn("Events not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
