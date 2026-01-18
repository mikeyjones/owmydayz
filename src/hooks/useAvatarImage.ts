// Stub hook - avatar images not yet implemented in Convex
// TODO: Implement avatar storage in Convex

export function useAvatarImage(_userId?: string | null) {
	return {
		imageUrl: null,
		isLoading: false,
	};
}
