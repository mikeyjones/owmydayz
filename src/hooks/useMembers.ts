// Stub hook - members not yet implemented in Convex
// TODO: Implement members in Convex

export function useAllMembers() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useMember(_userId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}
