import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { decrypt, encrypt } from "./clockifyEncryption";

/**
 * Store or update Clockify API key for a user's workspace.
 */
export const storeApiKey = mutation({
	args: {
		userId: v.string(),
		workspaceId: v.string(),
		workspaceName: v.string(),
		apiKey: v.string(),
	},
	handler: async (ctx, args) => {
		// Encrypt API key before storing
		const encryptedApiKey = await encrypt(args.apiKey);

		// Check if connection already exists
		const existing = await ctx.db
			.query("clockifyConnections")
			.withIndex("by_userId_workspaceId", (q) =>
				q.eq("userId", args.userId).eq("workspaceId", args.workspaceId),
			)
			.first();

		if (existing) {
			// Update existing connection
			await ctx.db.patch(existing._id, {
				workspaceName: args.workspaceName,
				apiKey: encryptedApiKey,
				isActive: true,
				updatedAt: Date.now(),
			});
			return existing._id;
		}

		// Create new connection
		return await ctx.db.insert("clockifyConnections", {
			userId: args.userId,
			workspaceId: args.workspaceId,
			workspaceName: args.workspaceName,
			apiKey: encryptedApiKey,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Get Clockify connections for a user.
 */
export const getConnections = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const connections = await ctx.db
			.query("clockifyConnections")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.collect();

		// Return without decrypting API key (frontend doesn't need it)
		return connections.map((conn) => ({
			_id: conn._id,
			workspaceId: conn.workspaceId,
			workspaceName: conn.workspaceName,
			isActive: conn.isActive,
			createdAt: conn.createdAt,
			updatedAt: conn.updatedAt,
		}));
	},
});

/**
 * Get decrypted API key for a user's workspace.
 * Used internally by backend functions.
 */
export const getApiKey = query({
	args: {
		userId: v.string(),
		workspaceId: v.string(),
	},
	handler: async (ctx, args) => {
		const connection = await ctx.db
			.query("clockifyConnections")
			.withIndex("by_userId_workspaceId", (q) =>
				q.eq("userId", args.userId).eq("workspaceId", args.workspaceId),
			)
			.first();

		if (!connection || !connection.isActive) {
			return null;
		}

		// Decrypt and return API key
		const apiKey = await decrypt(connection.apiKey);
		return {
			apiKey,
		};
	},
});

/**
 * Remove a Clockify connection.
 */
export const removeConnection = mutation({
	args: {
		userId: v.string(),
		workspaceId: v.string(),
	},
	handler: async (ctx, args) => {
		const connection = await ctx.db
			.query("clockifyConnections")
			.withIndex("by_userId_workspaceId", (q) =>
				q.eq("userId", args.userId).eq("workspaceId", args.workspaceId),
			)
			.first();

		if (!connection) {
			throw new Error("Connection not found");
		}

		// Delete the connection entirely
		await ctx.db.delete(connection._id);
	},
});
