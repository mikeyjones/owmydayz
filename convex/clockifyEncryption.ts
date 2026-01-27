/**
 * Encryption utilities for Clockify OAuth tokens.
 * Uses AES-GCM for authenticated encryption with Web Crypto API.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Get the encryption key from environment variables.
 * The key must be a 32-character (256-bit) string.
 */
function getEncryptionKey(): string {
	const key = process.env.CLOCKIFY_ENCRYPTION_KEY;
	if (!key) {
		throw new Error("CLOCKIFY_ENCRYPTION_KEY environment variable is not set");
	}
	if (key.length !== 32) {
		throw new Error(
			"CLOCKIFY_ENCRYPTION_KEY must be exactly 32 characters (256 bits)",
		);
	}
	return key;
}

/**
 * Derive a CryptoKey from the encryption key string.
 */
async function deriveKey() {
	const keyString = getEncryptionKey();
	const keyData = new TextEncoder().encode(keyString);

	return await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: ALGORITHM },
		false,
		["encrypt", "decrypt"],
	);
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing IV + ciphertext.
 */
export async function encrypt(plaintext: string): Promise<string> {
	const key = await deriveKey();
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const plaintextBytes = new TextEncoder().encode(plaintext);

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		plaintextBytes,
	);

	// Combine IV + ciphertext
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(ciphertext), iv.length);

	// Return as base64
	return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt a base64-encoded encrypted string.
 * Returns the original plaintext.
 */
export async function decrypt(encryptedData: string): Promise<string> {
	const key = await deriveKey();
	const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

	// Extract IV and ciphertext
	const iv = combined.subarray(0, IV_LENGTH);
	const ciphertext = combined.subarray(IV_LENGTH);

	const plaintextBytes = await crypto.subtle.decrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		ciphertext,
	);

	return new TextDecoder().decode(plaintextBytes);
}
