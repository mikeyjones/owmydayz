import { eq, and, desc } from "drizzle-orm";
import { database } from "~/db";
import {
  team,
  teamMembership,
  teamInvitation,
  user,
  type Team,
  type CreateTeamData,
  type UpdateTeamData,
  type TeamMembership,
  type CreateTeamMembershipData,
  type TeamInvitation,
  type CreateTeamInvitationData,
  type TeamRole,
} from "~/db/schema";

// =====================================================
// Team Operations
// =====================================================

/**
 * Generates a URL-friendly slug from a team name.
 * Adds random suffix if needed for uniqueness.
 */
export function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

export async function createTeam(teamData: CreateTeamData): Promise<Team> {
  const [newTeam] = await database
    .insert(team)
    .values({
      ...teamData,
      updatedAt: new Date(),
    })
    .returning();

  // Automatically create owner membership
  await createMembership({
    id: crypto.randomUUID(),
    teamId: newTeam.id,
    userId: newTeam.ownerId,
    role: "owner",
  });

  return newTeam;
}

export async function findTeamById(id: string): Promise<Team | null> {
  const [result] = await database
    .select()
    .from(team)
    .where(eq(team.id, id))
    .limit(1);

  return result || null;
}

export async function findTeamBySlug(slug: string): Promise<Team | null> {
  const [result] = await database
    .select()
    .from(team)
    .where(eq(team.slug, slug))
    .limit(1);

  return result || null;
}

export async function findTeamsByUserId(userId: string): Promise<Team[]> {
  const results = await database
    .select({
      id: team.id,
      name: team.name,
      slug: team.slug,
      ownerId: team.ownerId,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .from(team)
    .innerJoin(teamMembership, eq(team.id, teamMembership.teamId))
    .where(eq(teamMembership.userId, userId))
    .orderBy(desc(team.createdAt));

  return results;
}

export async function updateTeam(
  id: string,
  teamData: UpdateTeamData
): Promise<Team> {
  const [updatedTeam] = await database
    .update(team)
    .set({
      ...teamData,
      updatedAt: new Date(),
    })
    .where(eq(team.id, id))
    .returning();

  return updatedTeam;
}

export async function deleteTeam(id: string): Promise<void> {
  await database.delete(team).where(eq(team.id, id));
}

// =====================================================
// Team Membership Operations
// =====================================================

export async function createMembership(
  membershipData: CreateTeamMembershipData
): Promise<TeamMembership> {
  const [newMembership] = await database
    .insert(teamMembership)
    .values(membershipData)
    .returning();

  return newMembership;
}

export async function findMembershipByTeamAndUser(
  teamId: string,
  userId: string
): Promise<TeamMembership | null> {
  const [result] = await database
    .select()
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.userId, userId)
      )
    )
    .limit(1);

  return result || null;
}

export type TeamMemberWithUser = TeamMembership & {
  userName: string;
  userEmail: string;
  userImage: string | null;
};

export async function findMembershipsByTeamId(
  teamId: string
): Promise<TeamMemberWithUser[]> {
  const results = await database
    .select({
      id: teamMembership.id,
      teamId: teamMembership.teamId,
      userId: teamMembership.userId,
      role: teamMembership.role,
      joinedAt: teamMembership.joinedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMembership)
    .innerJoin(user, eq(teamMembership.userId, user.id))
    .where(eq(teamMembership.teamId, teamId))
    .orderBy(desc(teamMembership.joinedAt));

  return results;
}

export async function updateMembershipRole(
  membershipId: string,
  role: TeamRole
): Promise<TeamMembership> {
  const [updatedMembership] = await database
    .update(teamMembership)
    .set({ role })
    .where(eq(teamMembership.id, membershipId))
    .returning();

  return updatedMembership;
}

export async function deleteMembership(membershipId: string): Promise<void> {
  await database.delete(teamMembership).where(eq(teamMembership.id, membershipId));
}

export async function deleteMembershipByTeamAndUser(
  teamId: string,
  userId: string
): Promise<void> {
  await database
    .delete(teamMembership)
    .where(
      and(
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.userId, userId)
      )
    );
}

/**
 * Check if a user has a specific role (or higher) in a team.
 * Role hierarchy: owner > admin > member
 */
export async function hasTeamRole(
  teamId: string,
  userId: string,
  requiredRole: TeamRole
): Promise<boolean> {
  const membership = await findMembershipByTeamAndUser(teamId, userId);
  if (!membership) return false;

  const roleHierarchy: Record<TeamRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[membership.role as TeamRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if a user is a member of a team (any role).
 */
export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const membership = await findMembershipByTeamAndUser(teamId, userId);
  return membership !== null;
}

// =====================================================
// Team Invitation Operations
// =====================================================

/**
 * Generate a secure random token for invitations.
 */
export function generateInvitationToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}

export async function createInvitation(
  invitationData: CreateTeamInvitationData
): Promise<TeamInvitation> {
  const [newInvitation] = await database
    .insert(teamInvitation)
    .values(invitationData)
    .returning();

  return newInvitation;
}

export async function findInvitationById(
  id: string
): Promise<TeamInvitation | null> {
  const [result] = await database
    .select()
    .from(teamInvitation)
    .where(eq(teamInvitation.id, id))
    .limit(1);

  return result || null;
}

export async function findInvitationByToken(
  token: string
): Promise<TeamInvitation | null> {
  const [result] = await database
    .select()
    .from(teamInvitation)
    .where(eq(teamInvitation.token, token))
    .limit(1);

  return result || null;
}

export async function findPendingInvitationsByEmail(
  email: string
): Promise<(TeamInvitation & { teamName: string })[]> {
  const results = await database
    .select({
      id: teamInvitation.id,
      teamId: teamInvitation.teamId,
      email: teamInvitation.email,
      invitedBy: teamInvitation.invitedBy,
      role: teamInvitation.role,
      token: teamInvitation.token,
      status: teamInvitation.status,
      expiresAt: teamInvitation.expiresAt,
      createdAt: teamInvitation.createdAt,
      teamName: team.name,
    })
    .from(teamInvitation)
    .innerJoin(team, eq(teamInvitation.teamId, team.id))
    .where(
      and(
        eq(teamInvitation.email, email.toLowerCase()),
        eq(teamInvitation.status, "pending")
      )
    )
    .orderBy(desc(teamInvitation.createdAt));

  return results;
}

export async function findInvitationsByTeamId(
  teamId: string
): Promise<TeamInvitation[]> {
  const results = await database
    .select()
    .from(teamInvitation)
    .where(eq(teamInvitation.teamId, teamId))
    .orderBy(desc(teamInvitation.createdAt));

  return results;
}

export async function findPendingInvitationByTeamAndEmail(
  teamId: string,
  email: string
): Promise<TeamInvitation | null> {
  const [result] = await database
    .select()
    .from(teamInvitation)
    .where(
      and(
        eq(teamInvitation.teamId, teamId),
        eq(teamInvitation.email, email.toLowerCase()),
        eq(teamInvitation.status, "pending")
      )
    )
    .limit(1);

  return result || null;
}

export async function updateInvitationStatus(
  id: string,
  status: "pending" | "accepted" | "expired"
): Promise<TeamInvitation> {
  const [updatedInvitation] = await database
    .update(teamInvitation)
    .set({ status })
    .where(eq(teamInvitation.id, id))
    .returning();

  return updatedInvitation;
}

export async function deleteInvitation(id: string): Promise<void> {
  await database.delete(teamInvitation).where(eq(teamInvitation.id, id));
}

/**
 * Accept an invitation - creates membership and marks invitation as accepted.
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<TeamMembership> {
  const invitation = await findInvitationById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation is no longer valid");
  }

  if (new Date() > invitation.expiresAt) {
    await updateInvitationStatus(invitationId, "expired");
    throw new Error("Invitation has expired");
  }

  // Check if user is already a member
  const existingMembership = await findMembershipByTeamAndUser(
    invitation.teamId,
    userId
  );
  if (existingMembership) {
    throw new Error("User is already a member of this team");
  }

  // Create membership
  const membership = await createMembership({
    id: crypto.randomUUID(),
    teamId: invitation.teamId,
    userId,
    role: invitation.role,
  });

  // Mark invitation as accepted
  await updateInvitationStatus(invitationId, "accepted");

  return membership;
}
