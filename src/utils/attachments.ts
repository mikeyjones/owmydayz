// Stub implementation - attachments not yet implemented in Convex
// TODO: Implement attachments in Convex

import type { MediaUploadResult } from "~/utils/storage/media-helpers";

/**
 * Options for updating attachments
 */
export interface UpdateAttachmentsOptions {
	newAttachments?: MediaUploadResult[];
	deletedAttachmentIds?: string[];
}

/**
 * Updates attachments for a post (stub)
 */
export async function updatePostAttachments(
	_postId: string,
	_options: UpdateAttachmentsOptions,
): Promise<void> {
	console.warn("Attachments not yet implemented in Convex");
}

/**
 * Updates attachments for a comment (stub)
 */
export async function updateCommentAttachments(
	_commentId: string,
	_options: UpdateAttachmentsOptions,
): Promise<void> {
	console.warn("Attachments not yet implemented in Convex");
}
