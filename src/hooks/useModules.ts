// Stub hook - modules not yet implemented in Convex
// TODO: Implement modules in Convex

export function useModules() {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useModule(moduleId: string) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useModuleContents(moduleId: string) {
	return {
		data: [],
		isLoading: false,
		error: null,
	};
}

export function useCreateModule() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateModule() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteModule() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useCreateContent() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useUpdateContent() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}

export function useDeleteContent() {
	return {
		mutate: async () => {
			console.warn("Modules not yet implemented in Convex");
		},
		isPending: false,
		isError: false,
	};
}
