// Stub hook - attachments not yet implemented in Convex
// TODO: Implement attachments in Convex

export function useUploadAttachment() {
	return {
		mutate: async () => {
			console.warn("Attachments not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Attachments not yet implemented in Convex");
			return null;
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteAttachment() {
	return {
		mutate: async () => {
			console.warn("Attachments not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useCommentAttachments(commentId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useAttachmentUrls(attachments: any[]) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useAttachmentUrl(fileKey: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}
