import { queryOptions } from "@tanstack/react-query";
import {
  getTeamsFn,
  getTeamByIdFn,
  getTeamMembersFn,
  getTeamInvitationsFn,
  getMyPendingInvitationsFn,
} from "~/fn/teams";

export const teamsQueryOptions = () =>
  queryOptions({
    queryKey: ["teams"],
    queryFn: () => getTeamsFn(),
  });

export const teamQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team", teamId],
    queryFn: () => getTeamByIdFn({ data: { id: teamId } }),
  });

export const teamMembersQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team-members", teamId],
    queryFn: () => getTeamMembersFn({ data: { teamId } }),
  });

export const teamInvitationsQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team-invitations", teamId],
    queryFn: () => getTeamInvitationsFn({ data: { teamId } }),
  });

export const myPendingInvitationsQueryOptions = () =>
  queryOptions({
    queryKey: ["my-pending-invitations"],
    queryFn: () => getMyPendingInvitationsFn(),
  });
