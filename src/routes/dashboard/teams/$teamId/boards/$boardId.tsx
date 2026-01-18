import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TeamKanbanBoard } from "~/components/teams/TeamKanbanBoard";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute(
	"/dashboard/teams/$teamId/boards/$boardId",
)({
	component: TeamBoardPage,
});

function TeamBoardPage() {
	const { teamId, boardId } = Route.useParams();

	return (
		<div className="space-y-4">
			<div>
				<Link to="/dashboard/teams/$teamId" params={{ teamId }}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Team Boards
					</Button>
				</Link>
			</div>
			<TeamKanbanBoard boardId={boardId} teamId={teamId} />
		</div>
	);
}
