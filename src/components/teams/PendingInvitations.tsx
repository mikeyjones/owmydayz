import { Check, Mail, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	useAcceptInvitation,
	useDeclineInvitation,
	useMyPendingInvitations,
} from "~/hooks/useTeams";

export function PendingInvitations() {
	const { data: invitations, isPending } = useMyPendingInvitations();
	const acceptMutation = useAcceptInvitation();
	const declineMutation = useDeclineInvitation();

	if (isPending || !invitations || invitations.length === 0) {
		return null;
	}

	return (
		<Card className="border-primary/20 bg-primary/5">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<Mail className="h-5 w-5" />
					Pending Invitations
				</CardTitle>
				<CardDescription>
					You have been invited to join the following teams
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{invitations.map((invitation) => (
					<div
						key={invitation.id}
						className="flex items-center justify-between p-3 bg-background rounded-lg border"
					>
						<div>
							<p className="font-medium">{invitation.teamName}</p>
							<p className="text-sm text-muted-foreground">
								Invited as {invitation.role}
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => declineMutation.mutate(invitation.id)}
								disabled={acceptMutation.isPending || declineMutation.isPending}
							>
								<X className="h-4 w-4 mr-1" />
								Decline
							</Button>
							<Button
								size="sm"
								onClick={() => acceptMutation.mutate(invitation.id)}
								disabled={acceptMutation.isPending || declineMutation.isPending}
							>
								<Check className="h-4 w-4 mr-1" />
								Accept
							</Button>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
