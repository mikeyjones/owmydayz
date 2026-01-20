// Stub functions - hearts not yet implemented in Convex
// TODO: Implement hearts server functions

export async function getHeartCountFn(_args: any) {
	console.warn("Heart count not yet implemented");
	return 0;
}

export async function getHeartStatusFn(_args: any) {
	console.warn("Heart status not yet implemented");
	return { isHearted: false };
}
