// =====================================================
// Team Types
// =====================================================

export type TeamId = string;

export type Team = {
	_id: TeamId;
	id: TeamId; // Alias for _id
	_creationTime: number;
	name: string;
	slug: string;
	description?: string;
	ownerId: string;
	createdAt: number;
	updatedAt: number;
};

export type TeamMembership = {
	_id: string;
	id: string; // Alias for _id
	_creationTime: number;
	teamId: TeamId;
	userId: string;
	role: TeamRole;
	joinedAt: number;
};

export type TeamInvitation = {
	_id: string;
	id: string; // Alias for _id
	_creationTime: number;
	teamId: TeamId;
	email: string;
	role: TeamRole;
	token: string;
	status: TeamInvitationStatus;
	invitedBy: string;
	expiresAt: number;
	createdAt: number;
};

export type TeamMemberWithUser = TeamMembership & {
	userName: string;
	userEmail: string;
	userImage: string | null;
};

// =====================================================
// Team Role Types
// =====================================================

export const TEAM_ROLE_VALUES = ["owner", "admin", "member"] as const;
export type TeamRole = (typeof TEAM_ROLE_VALUES)[number];

export const TEAM_INVITATION_STATUS_VALUES = [
	"pending",
	"accepted",
	"expired",
] as const;
export type TeamInvitationStatus =
	(typeof TEAM_INVITATION_STATUS_VALUES)[number];
