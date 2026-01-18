import { createFileRoute } from "@tanstack/react-router";
import { TeamSettings } from "~/components/teams/TeamSettings";

export const Route = createFileRoute("/dashboard/teams/$teamId/settings")({
	component: TeamSettingsPage,
});

function TeamSettingsPage() {
	const { teamId } = Route.useParams();

	return <TeamSettings teamId={teamId} />;
}
