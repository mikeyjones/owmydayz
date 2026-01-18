import { createFileRoute } from "@tanstack/react-router";
import { TeamMembersList } from "~/components/teams/TeamMembersList";

export const Route = createFileRoute("/dashboard/teams/$teamId/members")({
	component: TeamMembersPage,
});

function TeamMembersPage() {
	const { teamId } = Route.useParams();

	return <TeamMembersList teamId={teamId} />;
}
