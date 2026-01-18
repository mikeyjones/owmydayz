// Stub hook - notifications not yet implemented in Convex
// TODO: Implement notifications in Convex

export function useNotifications() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useUnreadNotificationCount() {
	return {
		data: 0,
		isLoading: false,
		error: null,
	};
}

export function useMarkNotificationAsRead() {
	return {
		mutate: async () => {
			console.warn("Notifications not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useMarkAllNotificationsAsRead() {
	return {
		mutate: async () => {
			console.warn("Notifications not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
