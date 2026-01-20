// Stub functions - notifications not yet implemented in Convex
// TODO: Implement notifications server functions

export async function getNotificationsFn(_args: any) {
	console.warn("Notifications not yet implemented");
	return [];
}

export async function getRecentNotificationsFn(_args: any) {
	console.warn("Recent notifications not yet implemented");
	return [];
}

export async function getUnreadCountFn(_args: any) {
	console.warn("Unread count not yet implemented");
	return 0;
}
