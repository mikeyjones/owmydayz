// Stub functions - review not yet implemented in Convex
// TODO: Implement review server functions

export async function getCompletedItemsFn(_args: any) {
	console.warn("Completed items not yet implemented");
	return [];
}

export async function getCompletionStatsFn(_args: any) {
	console.warn("Completion stats not yet implemented");
	return {
		today: 0,
		thisWeek: 0,
		thisMonth: 0,
		thisYear: 0,
	};
}

export async function getMonthlyBreakdownFn(_args: any) {
	console.warn("Monthly breakdown not yet implemented");
	return [];
}
