import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOptionalAuth, requireUserFromClientId } from "./auth";

// =====================================================
// Team Queries
// =====================================================

export const getTeams = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Get all team memberships for the user
		const memberships = await ctx.db
			.query("teamMemberships")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		// Get the teams
		const teams = await Promise.all(
			memberships.map(async (membership) => {
				const team = await ctx.db.get(membership.teamId);
				return team;
			}),
		);

		// Filter out nulls and sort by createdAt descending
		return teams
			.filter((team): team is NonNullable<typeof team> => team !== null)
			.sort((a, b) => b.createdAt - a.createdAt);
	},
});

export const getTeamById = query({
	args: {
		id: v.id("teams"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;
		const team = await ctx.db.get(args.id);

		if (!team) {
			return null;
		}

		// Check if user is a member (if we have userId)
		if (userId) {
			const membership = await ctx.db
				.query("teamMemberships")
				.withIndex("by_teamId_userId", (q) =>
					q.eq("teamId", args.id).eq("userId", userId),
				)
				.first();

			if (!membership) {
				return null;
			}
		}

		return team;
	},
});

export const getTeamBySlug = query({
	args: {
		slug: v.string(),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		const team = await ctx.db
			.query("teams")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!team) {
			return null;
		}

		// Check if user is a member (if we have userId)
		if (userId) {
			const membership = await ctx.db
				.query("teamMemberships")
				.withIndex("by_teamId_userId", (q) =>
					q.eq("teamId", team._id).eq("userId", userId),
				)
				.first();

			if (!membership) {
				return null;
			}
		}

		return team;
	},
});

export const getTeamMembers = query({
	args: {
		teamId: v.id("teams"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Verify user is a member
		const userMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", userId),
			)
			.first();

		if (!userMembership) {
			return [];
		}

		const memberships = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
			.collect();

		// Cast role field and add placeholder user data
		// TODO: Fetch actual user data from better-auth
		const membersWithUsers = memberships.map((membership) => ({
			...membership,
			role: membership.role as "owner" | "admin" | "member",
			userName: "User", // Placeholder - frontend should fetch from better-auth
			userEmail: membership.userId, // Use userId as fallback
			userImage: null,
		}));

		// Sort by joinedAt descending
		return membersWithUsers.sort((a, b) => b.joinedAt - a.joinedAt);
	},
});

export const getTeamInvitations = query({
	args: {
		teamId: v.id("teams"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Verify user is admin or owner
		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", userId),
			)
			.first();

		if (!membership || membership.role === "member") {
			return [];
		}

		const invitations = await ctx.db
			.query("teamInvitations")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
			.collect();

		// Sort by createdAt descending
		return invitations.sort((a, b) => b.createdAt - a.createdAt);
	},
});

export const getPendingInvitationsForUser = query({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) {
			return [];
		}

		// Get user's email from better-auth user
		// Note: We need the email to find invitations
		// For now, we'll return empty array - this needs to be updated
		// once we have access to the user's email from better-auth
		const invitations = await ctx.db.query("teamInvitations").collect();

		// Filter pending invitations and add team name
		const pendingInvitations = invitations.filter(
			(inv) => inv.status === "pending",
		);

		// Fetch team names for each invitation
		const invitationsWithTeamName = await Promise.all(
			pendingInvitations.map(async (invitation) => {
				const team = await ctx.db.get(invitation.teamId);
				return {
					...invitation,
					teamName: team?.name || "Unknown Team",
				};
			}),
		);

		return invitationsWithTeamName;
	},
});

// =====================================================
// Team Mutations
// =====================================================

/**
 * Generate a URL-friendly slug from a team name.
 */
function generateSlug(name: string): string {
	const baseSlug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 50);

	const randomSuffix = Math.random().toString(36).slice(2, 8);
	return `${baseSlug}-${randomSuffix}`;
}

export const createTeam = mutation({
	args: {
		name: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const now = Date.now();
		const slug = generateSlug(args.name);

		// Create the team
		const teamId = await ctx.db.insert("teams", {
			name: args.name,
			slug,
			ownerId: user.id,
			createdAt: now,
			updatedAt: now,
		});

		// Create owner membership
		await ctx.db.insert("teamMemberships", {
			teamId,
			userId: user.id,
			role: "owner",
			joinedAt: now,
		});

		return teamId;
	},
});

export const updateTeam = mutation({
	args: {
		id: v.id("teams"),
		name: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const team = await ctx.db.get(args.id);

		if (!team) {
			throw new Error("Team not found");
		}

		// Check if user is admin or owner
		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.id).eq("userId", user.id),
			)
			.first();

		if (!membership || membership.role === "member") {
			throw new Error("Unauthorized - must be admin or owner");
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const deleteTeam = mutation({
	args: { id: v.id("teams"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const team = await ctx.db.get(args.id);

		if (!team) {
			throw new Error("Team not found");
		}

		// Only owner can delete
		if (team.ownerId !== user.id) {
			throw new Error("Unauthorized - only owner can delete team");
		}

		// Delete all team boards and their content
		const boards = await ctx.db
			.query("teamBoards")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.id))
			.collect();

		for (const board of boards) {
			// Delete items
			const items = await ctx.db
				.query("teamItems")
				.withIndex("by_boardId", (q) => q.eq("boardId", board._id))
				.collect();

			for (const item of items) {
				// Delete item comments
				const comments = await ctx.db
					.query("teamItemComments")
					.withIndex("by_itemId", (q) => q.eq("itemId", item._id))
					.collect();

				for (const comment of comments) {
					await ctx.db.delete(comment._id);
				}

				await ctx.db.delete(item._id);
			}

			// Delete columns
			const columns = await ctx.db
				.query("teamColumns")
				.withIndex("by_boardId", (q) => q.eq("boardId", board._id))
				.collect();

			for (const column of columns) {
				await ctx.db.delete(column._id);
			}

			await ctx.db.delete(board._id);
		}

		// Delete invitations
		const invitations = await ctx.db
			.query("teamInvitations")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.id))
			.collect();

		for (const invitation of invitations) {
			await ctx.db.delete(invitation._id);
		}

		// Delete memberships
		const memberships = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId", (q) => q.eq("teamId", args.id))
			.collect();

		for (const membership of memberships) {
			await ctx.db.delete(membership._id);
		}

		// Delete the team
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

// =====================================================
// Team Membership Mutations
// =====================================================

export const updateMemberRole = mutation({
	args: {
		teamId: v.id("teams"),
		targetUserId: v.string(),
		role: v.string(),
		currentUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.currentUserId);

		// Check if current user is admin or owner
		const currentMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", user.id),
			)
			.first();

		if (!currentMembership || currentMembership.role === "member") {
			throw new Error("Unauthorized - must be admin or owner");
		}

		// Find the target membership
		const targetMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", args.targetUserId),
			)
			.first();

		if (!targetMembership) {
			throw new Error("Member not found");
		}

		// Can't change owner role
		if (targetMembership.role === "owner") {
			throw new Error("Cannot change owner's role");
		}

		// Only owner can promote to admin
		if (args.role === "admin" && currentMembership.role !== "owner") {
			throw new Error("Only owner can promote to admin");
		}

		await ctx.db.patch(targetMembership._id, {
			role: args.role,
		});

		return targetMembership._id;
	},
});

export const removeMember = mutation({
	args: {
		teamId: v.id("teams"),
		targetUserId: v.string(),
		currentUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.currentUserId);

		// Check if current user is admin or owner, or removing themselves
		const currentMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", user.id),
			)
			.first();

		if (!currentMembership) {
			throw new Error("Unauthorized");
		}

		const isRemovingSelf = args.targetUserId === user.id;

		if (!isRemovingSelf && currentMembership.role === "member") {
			throw new Error("Unauthorized - must be admin or owner");
		}

		// Find the target membership
		const targetMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", args.targetUserId),
			)
			.first();

		if (!targetMembership) {
			throw new Error("Member not found");
		}

		// Can't remove owner
		if (targetMembership.role === "owner") {
			throw new Error("Cannot remove team owner");
		}

		await ctx.db.delete(targetMembership._id);

		return { success: true };
	},
});

// =====================================================
// Team Invitation Mutations
// =====================================================

export const createInvitation = mutation({
	args: {
		teamId: v.id("teams"),
		email: v.string(),
		role: v.optional(v.string()),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);

		// Check if current user is admin or owner
		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", user.id),
			)
			.first();

		if (!membership || membership.role === "member") {
			throw new Error("Unauthorized - must be admin or owner");
		}

		// Check for existing pending invitation
		const existingInvitations = await ctx.db
			.query("teamInvitations")
			.withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
			.collect();

		const existingPending = existingInvitations.find(
			(inv) => inv.teamId === args.teamId && inv.status === "pending",
		);

		if (existingPending) {
			throw new Error("Invitation already sent to this email");
		}

		const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
		const now = Date.now();
		const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

		const invitationId = await ctx.db.insert("teamInvitations", {
			teamId: args.teamId,
			email: args.email.toLowerCase(),
			invitedBy: user.id,
			role: args.role ?? "member",
			token,
			status: "pending",
			expiresAt,
			createdAt: now,
		});

		return invitationId;
	},
});

export const acceptInvitation = mutation({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);

		const invitation = await ctx.db
			.query("teamInvitations")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!invitation) {
			throw new Error("Invitation not found");
		}

		if (invitation.status !== "pending") {
			throw new Error("Invitation is no longer valid");
		}

		if (Date.now() > invitation.expiresAt) {
			await ctx.db.patch(invitation._id, { status: "expired" });
			throw new Error("Invitation has expired");
		}

		// Check if user is already a member
		const existingMembership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", invitation.teamId).eq("userId", user.id),
			)
			.first();

		if (existingMembership) {
			throw new Error("Already a member of this team");
		}

		// Create membership
		await ctx.db.insert("teamMemberships", {
			teamId: invitation.teamId,
			userId: user.id,
			role: invitation.role,
			joinedAt: Date.now(),
		});

		// Mark invitation as accepted
		await ctx.db.patch(invitation._id, { status: "accepted" });

		return invitation.teamId;
	},
});

export const deleteInvitation = mutation({
	args: { id: v.id("teamInvitations"), userId: v.string() },
	handler: async (ctx, args) => {
		const user = requireUserFromClientId(args.userId);
		const invitation = await ctx.db.get(args.id);

		if (!invitation) {
			throw new Error("Invitation not found");
		}

		// Check if current user is admin or owner
		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", invitation.teamId).eq("userId", user.id),
			)
			.first();

		if (!membership || membership.role === "member") {
			throw new Error("Unauthorized - must be admin or owner");
		}

		await ctx.db.delete(args.id);

		return { success: true };
	},
});

// =====================================================
// Helper Queries
// =====================================================

export const hasTeamRole = query({
	args: {
		teamId: v.id("teams"),
		requiredRole: v.string(),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) return false;

		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", userId),
			)
			.first();

		if (!membership) return false;

		const roleHierarchy: Record<string, number> = {
			owner: 3,
			admin: 2,
			member: 1,
		};

		return roleHierarchy[membership.role] >= roleHierarchy[args.requiredRole];
	},
});

export const isTeamMember = query({
	args: {
		teamId: v.id("teams"),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await getOptionalAuth(ctx);
		const userId = args.userId || authUser?.id;

		if (!userId) return false;

		const membership = await ctx.db
			.query("teamMemberships")
			.withIndex("by_teamId_userId", (q) =>
				q.eq("teamId", args.teamId).eq("userId", userId),
			)
			.first();

		return membership !== null;
	},
});
