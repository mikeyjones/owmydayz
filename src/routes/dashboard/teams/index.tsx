import { createFileRoute } from "@tanstack/react-router";
import { TeamsList } from "~/components/teams/TeamsList";

export const Route = createFileRoute("/dashboard/teams/")({
	component: TeamsIndex,
});

function TeamsIndex() {
	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<TeamsList />
		</div>
	);
}
