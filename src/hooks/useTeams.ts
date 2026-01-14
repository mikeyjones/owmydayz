import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  teamsQueryOptions,
  teamQueryOptions,
  teamMembersQueryOptions,
  teamInvitationsQueryOptions,
  myPendingInvitationsQueryOptions,
} from "~/queries/teams";
import {
  createTeamFn,
  updateTeamFn,
  deleteTeamFn,
  inviteMemberFn,
  revokeInvitationFn,
  acceptInvitationFn,
  declineInvitationFn,
  updateMemberRoleFn,
  removeMemberFn,
} from "~/fn/teams";
import { getErrorMessage } from "~/utils/error";

// =====================================================
// Team Hooks
// =====================================================

export function useTeams(enabled = true) {
  return useQuery({
    ...teamsQueryOptions(),
    enabled,
  });
}

export function useTeam(teamId: string, enabled = true) {
  return useQuery({
    ...teamQueryOptions(teamId),
    enabled: enabled && !!teamId,
  });
}

interface CreateTeamData {
  name: string;
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamData) => createTeamFn({ data }),
    onSuccess: () => {
      toast.success("Team created successfully!", {
        description: "Your new team is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      toast.error("Failed to create team", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface UpdateTeamData {
  id: string;
  name: string;
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamData) => updateTeamFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Team updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.id] });
    },
    onError: (error) => {
      toast.error("Failed to update team", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => deleteTeamFn({ data: { id: teamId } }),
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      toast.error("Failed to delete team", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Team Members Hooks
// =====================================================

export function useTeamMembers(teamId: string, enabled = true) {
  return useQuery({
    ...teamMembersQueryOptions(teamId),
    enabled: enabled && !!teamId,
  });
}

interface UpdateMemberRoleData {
  membershipId: string;
  role: "admin" | "member";
  teamId: string; // For query invalidation
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMemberRoleData) =>
      updateMemberRoleFn({ data: { membershipId: data.membershipId, role: data.role } }),
    onSuccess: (_, variables) => {
      toast.success("Member role updated!");
      queryClient.invalidateQueries({ queryKey: ["team-members", variables.teamId] });
    },
    onError: (error) => {
      toast.error("Failed to update member role", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface RemoveMemberData {
  membershipId: string;
  teamId: string; // For query invalidation
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveMemberData) =>
      removeMemberFn({ data: { membershipId: data.membershipId } }),
    onSuccess: (_, variables) => {
      toast.success("Member removed from team!");
      queryClient.invalidateQueries({ queryKey: ["team-members", variables.teamId] });
    },
    onError: (error) => {
      toast.error("Failed to remove member", {
        description: getErrorMessage(error),
      });
    },
  });
}

// =====================================================
// Team Invitations Hooks
// =====================================================

export function useTeamInvitations(teamId: string, enabled = true) {
  return useQuery({
    ...teamInvitationsQueryOptions(teamId),
    enabled: enabled && !!teamId,
  });
}

export function useMyPendingInvitations(enabled = true) {
  return useQuery({
    ...myPendingInvitationsQueryOptions(),
    enabled,
  });
}

interface InviteMemberData {
  teamId: string;
  email: string;
  role?: "admin" | "member";
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberData) => inviteMemberFn({ data }),
    onSuccess: (_, variables) => {
      toast.success("Invitation sent!", {
        description: `An invitation has been sent to ${variables.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["team-invitations", variables.teamId] });
    },
    onError: (error) => {
      toast.error("Failed to send invitation", {
        description: getErrorMessage(error),
      });
    },
  });
}

interface RevokeInvitationData {
  invitationId: string;
  teamId: string; // For query invalidation
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RevokeInvitationData) =>
      revokeInvitationFn({ data: { invitationId: data.invitationId } }),
    onSuccess: (_, variables) => {
      toast.success("Invitation revoked!");
      queryClient.invalidateQueries({ queryKey: ["team-invitations", variables.teamId] });
    },
    onError: (error) => {
      toast.error("Failed to revoke invitation", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      acceptInvitationFn({ data: { invitationId } }),
    onSuccess: () => {
      toast.success("You've joined the team!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-invitations"] });
    },
    onError: (error) => {
      toast.error("Failed to accept invitation", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      declineInvitationFn({ data: { invitationId } }),
    onSuccess: () => {
      toast.success("Invitation declined");
      queryClient.invalidateQueries({ queryKey: ["my-pending-invitations"] });
    },
    onError: (error) => {
      toast.error("Failed to decline invitation", {
        description: getErrorMessage(error),
      });
    },
  });
}
