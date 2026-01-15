import { queryOptions } from "@tanstack/react-query";
import {
  getTeamsFn,
  getTeamByIdFn,
  getTeamMembersFn,
  getTeamInvitationsFn,
  getMyPendingInvitationsFn,
} from "~/fn/teams";
import { getAuthHeaders } from "~/utils/server-fn-client";

export const teamsQueryOptions = () =>
  queryOptions({
    queryKey: ["teams"],
    queryFn: () => getTeamsFn({ headers: getAuthHeaders() }),
  });

export const teamQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team", teamId],
    queryFn: () => getTeamByIdFn({ data: { id: teamId }, headers: getAuthHeaders() }),
  });

export const teamMembersQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team-members", teamId],
    queryFn: () => getTeamMembersFn({ data: { teamId }, headers: getAuthHeaders() }),
  });

export const teamInvitationsQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["team-invitations", teamId],
    queryFn: () => getTeamInvitationsFn({ data: { teamId }, headers: getAuthHeaders() }),
  });

export const myPendingInvitationsQueryOptions = () =>
  queryOptions({
    queryKey: ["my-pending-invitations"],
    queryFn: () => getMyPendingInvitationsFn({ headers: getAuthHeaders() }),
  });
