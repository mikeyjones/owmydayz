import {
	MoreHorizontal,
	Plus,
	Shield,
	ShieldCheck,
	Trash2,
	User,
	UserCog,
} from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	useRemoveMember,
	useRevokeInvitation,
	useTeamInvitations,
	useTeamMembers,
	useUpdateMemberRole,
} from "~/hooks/useTeams";
import type { TeamMemberWithUser } from "~/types";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface TeamMembersListProps {
	teamId: string;
}

export function TeamMembersList({ teamId }: TeamMembersListProps) {
	const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
	const { data: invitations, isLoading: invitationsLoading } =
		useTeamInvitations(teamId);
	const updateRoleMutation = useUpdateMemberRole();
	const removeMemberMutation = useRemoveMember();
	const revokeInvitationMutation = useRevokeInvitation();

	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [removingMember, setRemovingMember] =
		useState<TeamMemberWithUser | null>(null);

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "owner":
				return (
					<Badge
						variant="default"
						className="bg-amber-500/20 text-amber-500 border-amber-500/30"
					>
						<ShieldCheck className="h-3 w-3 mr-1" />
						Owner
					</Badge>
				);
			case "admin":
				return (
					<Badge
						variant="default"
						className="bg-blue-500/20 text-blue-500 border-blue-500/30"
					>
						<Shield className="h-3 w-3 mr-1" />
						Admin
					</Badge>
				);
			default:
				return (
					<Badge variant="secondary">
						<User className="h-3 w-3 mr-1" />
						Member
					</Badge>
				);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleUpdateRole = (
		membershipId: string,
		role: "admin" | "member",
		targetUserId: string,
	) => {
		updateRoleMutation.mutate({ membershipId, role, teamId, targetUserId });
	};

	const handleRemoveMember = async () => {
		if (removingMember) {
			await removeMemberMutation.mutate({
				membershipId: removingMember.id,
				teamId,
				targetUserId: removingMember.userId,
			});
			setRemovingMember(null);
		}
	};

	const handleRevokeInvitation = (invitationId: string) => {
		revokeInvitationMutation.mutate({ invitationId, teamId });
	};

	const isPending = membersLoading || invitationsLoading;
	const pendingInvitations =
		invitations?.filter((i: { status: string }) => i.status === "pending") ||
		[];

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Members</h2>
					<p className="text-sm text-muted-foreground">
						Manage team members and their roles
					</p>
				</div>
				<Button onClick={() => setInviteDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Invite Member
				</Button>
			</div>

			{/* Members List */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Team Members</CardTitle>
					<CardDescription>
						{members?.length || 0} member{members?.length !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{members?.map((member) => (
						<div
							key={member.id}
							className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
						>
							<div className="flex items-center gap-3">
								<Avatar>
									<AvatarImage src={member.userImage || undefined} />
									<AvatarFallback>
										{getInitials(member.userName)}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium">{member.userName}</p>
									<p className="text-sm text-muted-foreground">
										{member.userEmail}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{getRoleBadge(member.role as "member" | "owner" | "admin")}
								{member.role !== "owner" && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{member.role === "member" && (
												<DropdownMenuItem
													onClick={() =>
														handleUpdateRole(member.id, "admin", member.userId)
													}
												>
													<Shield className="mr-2 h-4 w-4" />
													Promote to Admin
												</DropdownMenuItem>
											)}
											{member.role === "admin" && (
												<DropdownMenuItem
													onClick={() =>
														handleUpdateRole(member.id, "member", member.userId)
													}
												>
													<UserCog className="mr-2 h-4 w-4" />
													Demote to Member
												</DropdownMenuItem>
											)}
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => setRemovingMember(member)}
												className="text-destructive focus:text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Remove
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Pending Invitations */}
			{pendingInvitations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Pending Invitations</CardTitle>
						<CardDescription>
							{pendingInvitations.length} pending invitation
							{pendingInvitations.length !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{pendingInvitations.map((invitation) => (
							<div
								key={invitation.id}
								className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
							>
								<div>
									<p className="font-medium">{invitation.email}</p>
									<p className="text-sm text-muted-foreground">
										Invited as {invitation.role} • Expires{" "}
										{new Date(invitation.expiresAt).toLocaleDateString()}
									</p>
								</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRevokeInvitation(invitation.id)}
										disabled={revokeInvitationMutation.isPending}
									>
										Revoke
									</Button>
								</div>
							)
						)}
					</CardContent>
				</Card>
			)}

			{/* Invite Dialog */}
			<InviteMemberDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
				teamId={teamId}
			/>

			{/* Remove Member Confirmation */}
			<AlertDialog
				open={!!removingMember}
				onOpenChange={(open) => !open && setRemovingMember(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove {removingMember?.userName} from
							the team? They will no longer have access to team boards.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveMember}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{removeMemberMutation.isPending ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
