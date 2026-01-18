// Stub hook - messages not yet implemented in Convex
// TODO: Implement messages in Convex

export function useMessages(conversationId: string) {
	return {
		data: { messages: [] },
		isLoading: false,
		error: null,
	};
}

export function useSendMessage() {
	return {
		mutate: async () => {
			console.warn("Messages not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useMarkMessagesAsRead() {
	return {
		mutate: async () => {
			console.warn("Messages not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
