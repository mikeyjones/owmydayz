import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

// Helper to normalize Convex data (_id -> id)
function normalizeItem<T extends { _id: any }>(
	item: T | null | undefined,
): (T & { id: string }) | null | undefined {
	if (!item || typeof item !== "object") return item as null | undefined;
	return { ...item, id: item._id };
}

function normalizeArray<T extends { _id: any }>(
	items: T[] | undefined,
): (T & { id: string })[] | undefined {
	return items?.map((item) => ({ ...item, id: item._id }));
}

// =====================================================
// Team Hooks
// =====================================================

export function useTeams(enabled = true) {
	const { userId } = useCurrentUser();

	const teams = useQuery(
		api.teams.getTeams,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: normalizeArray(teams),
		isLoading: teams === undefined && enabled && !!userId,
		error: null,
	};
}

export function useTeam(teamId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const team = useQuery(
		api.teams.getTeamById,
		!enabled || !teamId || !userId
			? "skip"
			: { id: teamId as Id<"teams">, userId },
	);

	return {
		data: normalizeItem(team),
		isLoading: team === undefined && enabled && !!teamId && !!userId,
		error: null,
	};
}

interface CreateTeamData {
	name: string;
}

export function useCreateTeam() {
	const { userId } = useCurrentUser();
	const createTeam = useMutation(api.teams.createTeam);

	return {
		mutate: async (data: CreateTeamData) => {
			if (!userId) {
				toast.error("You must be logged in to create a team");
				return;
			}
			try {
				await createTeam({
					name: data.name,
					userId,
				});
				toast.success("Team created successfully!", {
					description: "Your new team is ready.",
				});
			} catch (error) {
				toast.error("Failed to create team", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		mutateAsync: async (data: CreateTeamData) => {
			if (!userId) {
				throw new Error("You must be logged in to create a team");
			}
			const result = await createTeam({
				name: data.name,
				userId,
			});
			toast.success("Team created successfully!", {
				description: "Your new team is ready.",
			});
			return result;
		},
		isPending: false,
	};
}

interface UpdateTeamData {
	id: string;
	name: string;
}

export function useUpdateTeam() {
	const { userId } = useCurrentUser();
	const updateTeam = useMutation(api.teams.updateTeam);

	return {
		mutate: async (data: UpdateTeamData) => {
			if (!userId) {
				toast.error("You must be logged in to update a team");
				return;
			}
			try {
				await updateTeam({
					id: data.id as Id<"teams">,
					name: data.name,
					userId,
				});
				toast.success("Team updated successfully!");
			} catch (error) {
				toast.error("Failed to update team", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

export function useDeleteTeam() {
	const { userId } = useCurrentUser();
	const deleteTeam = useMutation(api.teams.deleteTeam);

	return {
		mutate: async (teamId: string) => {
			if (!userId) {
				toast.error("You must be logged in to delete a team");
				return;
			}
			try {
				await deleteTeam({
					id: teamId as Id<"teams">,
					userId,
				});
				toast.success("Team deleted successfully!");
			} catch (error) {
				toast.error("Failed to delete team", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Team Members Hooks
// =====================================================

export function useTeamMembers(teamId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const members = useQuery(
		api.teams.getTeamMembers,
		!enabled || !teamId || !userId
			? "skip"
			: { teamId: teamId as Id<"teams">, userId },
	);

	return {
		data: normalizeArray(members),
		isLoading: members === undefined && enabled && !!teamId && !!userId,
		error: null,
	};
}

interface UpdateMemberRoleData {
	membershipId: string;
	role: "admin" | "member";
	teamId: string; // For context
	targetUserId: string;
}

export function useUpdateMemberRole() {
	const { userId } = useCurrentUser();
	const updateMemberRole = useMutation(api.teams.updateMemberRole);

	return {
		mutate: async (data: UpdateMemberRoleData) => {
			if (!userId) {
				toast.error("You must be logged in to update member role");
				return;
			}
			try {
				await updateMemberRole({
					teamId: data.teamId as Id<"teams">,
					targetUserId: data.targetUserId,
					role: data.role,
					currentUserId: userId,
				});
				toast.success("Member role updated!");
			} catch (error) {
				toast.error("Failed to update member role", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface RemoveMemberData {
	membershipId: string;
	teamId: string;
	targetUserId: string;
}

export function useRemoveMember() {
	const { userId } = useCurrentUser();
	const removeMember = useMutation(api.teams.removeMember);

	return {
		mutate: async (data: RemoveMemberData) => {
			if (!userId) {
				toast.error("You must be logged in to remove a member");
				return;
			}
			try {
				await removeMember({
					teamId: data.teamId as Id<"teams">,
					targetUserId: data.targetUserId,
					currentUserId: userId,
				});
				toast.success("Member removed from team!");
			} catch (error) {
				toast.error("Failed to remove member", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Team Invitations Hooks
// =====================================================

export function useTeamInvitations(teamId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const invitations = useQuery(
		api.teams.getTeamInvitations,
		!enabled || !teamId || !userId
			? "skip"
			: { teamId: teamId as Id<"teams">, userId },
	);

	return {
		data: normalizeArray(invitations),
		isLoading: invitations === undefined && enabled && !!teamId && !!userId,
		error: null,
	};
}

export function useMyPendingInvitations(enabled = true) {
	const { userId } = useCurrentUser();

	const invitations = useQuery(
		api.teams.getPendingInvitationsForUser,
		!enabled || !userId ? "skip" : { userId },
	);

	return {
		data: normalizeArray(invitations),
		isLoading: invitations === undefined && enabled && !!userId,
		error: null,
	};
}

interface InviteMemberData {
	teamId: string;
	email: string;
	role?: "admin" | "member";
}

export function useInviteMember() {
	const { userId } = useCurrentUser();
	const createInvitation = useMutation(api.teams.createInvitation);

	return {
		mutate: async (data: InviteMemberData) => {
			if (!userId) {
				toast.error("You must be logged in to invite a member");
				return;
			}
			try {
				await createInvitation({
					teamId: data.teamId as Id<"teams">,
					email: data.email,
					role: data.role,
					userId,
				});
				toast.success("Invitation sent!", {
					description: `An invitation has been sent to ${data.email}`,
				});
			} catch (error) {
				toast.error("Failed to send invitation", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

interface RevokeInvitationData {
	invitationId: string;
	teamId: string; // For context
}

export function useRevokeInvitation() {
	const { userId } = useCurrentUser();
	const deleteInvitation = useMutation(api.teams.deleteInvitation);

	return {
		mutate: async (data: RevokeInvitationData) => {
			if (!userId) {
				toast.error("You must be logged in to revoke an invitation");
				return;
			}
			try {
				await deleteInvitation({
					id: data.invitationId as Id<"teamInvitations">,
					userId,
				});
				toast.success("Invitation revoked!");
			} catch (error) {
				toast.error("Failed to revoke invitation", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

export function useAcceptInvitation() {
	const { userId } = useCurrentUser();
	const acceptInvitation = useMutation(api.teams.acceptInvitation);

	return {
		mutate: async (token: string) => {
			if (!userId) {
				toast.error("You must be logged in to accept an invitation");
				return;
			}
			try {
				await acceptInvitation({
					token,
					userId,
				});
				toast.success("You've joined the team!");
			} catch (error) {
				toast.error("Failed to accept invitation", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

export function useDeclineInvitation() {
	const { userId } = useCurrentUser();
	const deleteInvitation = useMutation(api.teams.deleteInvitation);

	return {
		mutate: async (invitationId: string) => {
			if (!userId) {
				toast.error("You must be logged in to decline an invitation");
				return;
			}
			try {
				await deleteInvitation({
					id: invitationId as Id<"teamInvitations">,
					userId,
				});
				toast.success("Invitation declined");
			} catch (error) {
				toast.error("Failed to decline invitation", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// =====================================================
// Helper Hooks
// =====================================================

export function useIsTeamMember(teamId: string, enabled = true) {
	const { userId } = useCurrentUser();

	const isMember = useQuery(
		api.teams.isTeamMember,
		!enabled || !teamId || !userId
			? "skip"
			: { teamId: teamId as Id<"teams">, userId },
	);

	return {
		data: isMember,
		isLoading: isMember === undefined && enabled && !!teamId && !!userId,
	};
}

export function useHasTeamRole(
	teamId: string,
	requiredRole: string,
	enabled = true,
) {
	const { userId } = useCurrentUser();

	const hasRole = useQuery(
		api.teams.hasTeamRole,
		!enabled || !teamId || !userId
			? "skip"
			: { teamId: teamId as Id<"teams">, requiredRole, userId },
	);

	return {
		data: hasRole,
		isLoading: hasRole === undefined && enabled && !!teamId && !!userId,
	};
}
