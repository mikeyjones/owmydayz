import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { KanbanBoard } from "~/components/kanban/KanbanBoard";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/dashboard/kanban/$boardId")({
	component: KanbanBoardPage,
});

function KanbanBoardPage() {
	const { boardId } = Route.useParams();

	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="mb-4">
				<Link to="/dashboard/kanban">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Boards
					</Button>
				</Link>
			</div>
			<KanbanBoard boardId={boardId} />
		</div>
	);
}
