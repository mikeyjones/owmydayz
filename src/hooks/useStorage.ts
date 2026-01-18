// Stub hook - storage not yet implemented in Convex
// TODO: Implement storage in Convex

export function useUploadImage() {
	return {
		mutate: async () => {
			console.warn("Storage not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Storage not yet implemented in Convex");
			return null;
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteImage() {
	return {
		mutate: async () => {
			console.warn("Storage not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useGetUploadUrl() {
	return {
		mutate: async () => {
			console.warn("Storage not yet implemented in Convex");
			return { presignedUrl: "", fileKey: "" };
		},
		mutateAsync: async () => {
			console.warn("Storage not yet implemented in Convex");
			return { presignedUrl: "", fileKey: "" };
		},
		isPending: false,
		isError: false,
	};
}

export function useConfirmUpload() {
	return {
		mutate: async () => {
			console.warn("Storage not yet implemented in Convex");
		},
		mutateAsync: async () => {
			console.warn("Storage not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
