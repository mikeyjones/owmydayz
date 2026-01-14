import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  findTeamById,
  findTeamsByUserId,
  findMembershipByTeamAndUser,
  findMembershipsByTeamId,
  updateMembershipRole,
  deleteMembership,
  hasTeamRole,
  isTeamMember,
  createInvitation,
  findInvitationById,
  findInvitationsByTeamId,
  findPendingInvitationByTeamAndEmail,
  deleteInvitation,
  acceptInvitation,
  generateSlug,
  generateInvitationToken,
} from "~/data-access/teams";
import { findUserByEmail } from "~/data-access/users";
import type { TeamRole } from "~/db/schema";

// =====================================================
// Team Server Functions
// =====================================================

const teamFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

export const createTeamFn = createServerFn({
  method: "POST",
})
  .inputValidator(teamFormSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const teamData = {
      id: crypto.randomUUID(),
      name: data.name,
      slug: generateSlug(data.name),
      ownerId: context.userId,
    };

    const newTeam = await createTeam(teamData);
    return newTeam;
  });

export const getTeamsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findTeamsByUserId(context.userId);
  });

export const getTeamByIdFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const team = await findTeamById(data.id);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check membership
    const isMember = await isTeamMember(team.id, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    return team;
  });

const updateTeamSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

export const updateTeamFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateTeamSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingTeam = await findTeamById(data.id);
    if (!existingTeam) {
      throw new Error("Team not found");
    }

    // Only owner or admin can update team
    const hasAccess = await hasTeamRole(data.id, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized: Only owner or admin can update team settings");
    }

    const updatedTeam = await updateTeam(data.id, {
      name: data.name,
    });
    return updatedTeam;
  });

export const deleteTeamFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const existingTeam = await findTeamById(data.id);
    if (!existingTeam) {
      throw new Error("Team not found");
    }

    // Only owner can delete team
    if (existingTeam.ownerId !== context.userId) {
      throw new Error("Unauthorized: Only the team owner can delete the team");
    }

    await deleteTeam(data.id);
    return { success: true };
  });

// =====================================================
// Team Membership Server Functions
// =====================================================

export const getTeamMembersFn = createServerFn()
  .inputValidator(z.object({ teamId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Check membership
    const isMember = await isTeamMember(data.teamId, context.userId);
    if (!isMember) {
      throw new Error("Unauthorized");
    }

    return await findMembershipsByTeamId(data.teamId);
  });

const updateMemberRoleSchema = z.object({
  membershipId: z.string(),
  role: z.enum(["admin", "member"]), // Can't set owner via this endpoint
});

export const updateMemberRoleFn = createServerFn({
  method: "POST",
})
  .inputValidator(updateMemberRoleSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Get the membership to find the team
    const { teamMembership } = await import("~/db/schema");
    const { database } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    
    const [membership] = await database
      .select()
      .from(teamMembership)
      .where(eq(teamMembership.id, data.membershipId))
      .limit(1);

    if (!membership) {
      throw new Error("Membership not found");
    }

    // Can't change owner's role
    if (membership.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    // Only owner or admin can update roles
    const hasAccess = await hasTeamRole(membership.teamId, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized: Only owner or admin can change roles");
    }

    // Get the team to check if current user is owner
    const team = await findTeamById(membership.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Only owner can promote to admin
    if (data.role === "admin" && team.ownerId !== context.userId) {
      throw new Error("Unauthorized: Only the team owner can promote to admin");
    }

    const updatedMembership = await updateMembershipRole(
      data.membershipId,
      data.role as TeamRole
    );
    return updatedMembership;
  });

const removeMemberSchema = z.object({
  membershipId: z.string(),
});

export const removeMemberFn = createServerFn({
  method: "POST",
})
  .inputValidator(removeMemberSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { teamMembership } = await import("~/db/schema");
    const { database } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    
    const [membership] = await database
      .select()
      .from(teamMembership)
      .where(eq(teamMembership.id, data.membershipId))
      .limit(1);

    if (!membership) {
      throw new Error("Membership not found");
    }

    // Can't remove the owner
    if (membership.role === "owner") {
      throw new Error("Cannot remove the team owner");
    }

    const team = await findTeamById(membership.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Users can remove themselves
    if (membership.userId === context.userId) {
      await deleteMembership(data.membershipId);
      return { success: true };
    }

    // Only owner or admin can remove others
    const hasAccess = await hasTeamRole(membership.teamId, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized: Only owner or admin can remove members");
    }

    // Admin can't remove other admins (only owner can)
    if (membership.role === "admin" && team.ownerId !== context.userId) {
      throw new Error("Unauthorized: Only the team owner can remove admins");
    }

    await deleteMembership(data.membershipId);
    return { success: true };
  });

// =====================================================
// Team Invitation Server Functions
// =====================================================

const inviteMemberSchema = z.object({
  teamId: z.string(),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

export const inviteMemberFn = createServerFn({
  method: "POST",
})
  .inputValidator(inviteMemberSchema)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const team = await findTeamById(data.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Only owner or admin can invite
    const hasAccess = await hasTeamRole(data.teamId, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized: Only owner or admin can invite members");
    }

    // Only owner can invite as admin
    if (data.role === "admin" && team.ownerId !== context.userId) {
      throw new Error("Unauthorized: Only the team owner can invite admins");
    }

    const normalizedEmail = data.email.toLowerCase();

    // Check if user is already a member
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      const existingMembership = await findMembershipByTeamAndUser(
        data.teamId,
        existingUser.id
      );
      if (existingMembership) {
        throw new Error("User is already a member of this team");
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await findPendingInvitationByTeamAndEmail(
      data.teamId,
      normalizedEmail
    );
    if (existingInvitation) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await createInvitation({
      id: crypto.randomUUID(),
      teamId: data.teamId,
      email: normalizedEmail,
      invitedBy: context.userId,
      role: data.role,
      token: generateInvitationToken(),
      status: "pending",
      expiresAt,
    });

    // TODO: Send invitation email here
    // For now, the invitation can be accepted by logging in with the invited email

    return invitation;
  });

export const getTeamInvitationsFn = createServerFn()
  .inputValidator(z.object({ teamId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Only owner or admin can view invitations
    const hasAccess = await hasTeamRole(data.teamId, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    return await findInvitationsByTeamId(data.teamId);
  });

export const revokeInvitationFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ invitationId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const invitation = await findInvitationById(data.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Only owner or admin can revoke
    const hasAccess = await hasTeamRole(invitation.teamId, context.userId, "admin");
    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    await deleteInvitation(data.invitationId);
    return { success: true };
  });

// Get pending invitations for the current user
export const getMyPendingInvitationsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { user } = await import("~/db/schema");
    const { database } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    
    const [currentUser] = await database
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, context.userId))
      .limit(1);

    if (!currentUser) {
      throw new Error("User not found");
    }

    return await findPendingInvitationsByEmail(currentUser.email);
  });

export const acceptInvitationFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ invitationId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const invitation = await findInvitationById(data.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify the invitation is for this user's email
    const { user } = await import("~/db/schema");
    const { database } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    
    const [currentUser] = await database
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, context.userId))
      .limit(1);

    if (!currentUser) {
      throw new Error("User not found");
    }

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("This invitation is for a different email address");
    }

    const membership = await acceptInvitation(data.invitationId, context.userId);
    return membership;
  });

export const declineInvitationFn = createServerFn({
  method: "POST",
})
  .inputValidator(z.object({ invitationId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const invitation = await findInvitationById(data.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify the invitation is for this user's email
    const { user } = await import("~/db/schema");
    const { database } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    
    const [currentUser] = await database
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, context.userId))
      .limit(1);

    if (!currentUser) {
      throw new Error("User not found");
    }

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("This invitation is for a different email address");
    }

    await deleteInvitation(data.invitationId);
    return { success: true };
  });
