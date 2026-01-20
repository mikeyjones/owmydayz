// Stub functions - posts not yet implemented in Convex
// TODO: Implement posts server functions

export type PostCategory = "general" | "question" | "showcase" | "feedback";

export async function checkIsAdminFn(_args: any) {
	console.warn("Check is admin not yet implemented");
	return false;
}

export async function getPostByIdFn(_args: any) {
	console.warn("Post by ID not yet implemented");
	return null;
}

export async function getRecentPostsFn(_args: any) {
	console.warn("Recent posts not yet implemented");
	return [];
}

export async function getUserPostsFn(_args: any) {
	console.warn("User posts not yet implemented");
	return [];
}
