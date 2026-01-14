import { createFileRoute } from "@tanstack/react-router";
import { TeamBoardsList } from "~/components/teams/TeamBoardsList";

export const Route = createFileRoute("/dashboard/teams/$teamId/")({
  component: TeamBoardsIndex,
});

function TeamBoardsIndex() {
  const { teamId } = Route.useParams();

  return <TeamBoardsList teamId={teamId} />;
}
