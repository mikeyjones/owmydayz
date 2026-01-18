// Stub implementation - storage not yet implemented in Convex
// TODO: Implement storage in Convex

import { formatDuration, getVideoDuration } from "../video-duration";

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export interface UploadResult {
	videoKey: string;
	duration: string; // formatted duration like "2:34"
	durationSeconds: number; // raw duration in seconds
}

export interface ImageUploadResult {
	imageKey: string;
}

export async function uploadVideoWithPresignedUrl(
	key: string,
	file: File,
	onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
	console.warn("Storage not yet implemented in Convex");
	const durationSeconds = await getVideoDuration(file);
	const duration = formatDuration(durationSeconds);

	return {
		videoKey: key,
		duration,
		durationSeconds,
	};
}

export async function uploadImageWithPresignedUrl(
	key: string,
	file: File,
	onProgress?: (progress: UploadProgress) => void,
): Promise<ImageUploadResult> {
	console.warn("Storage not yet implemented in Convex");
	return {
		imageKey: key,
	};
}
