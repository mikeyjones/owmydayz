import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, LayoutDashboard } from "lucide-react";
import { BoardList } from "~/components/kanban/BoardList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAllTeamBoards } from "~/hooks/useTeamBoards";

export const Route = createFileRoute("/dashboard/kanban/")({
  component: KanbanIndex,
});

function KanbanIndex() {
  const { data: teamBoards, isPending: teamBoardsLoading } = useAllTeamBoards();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Personal Boards */}
      <BoardList />

      {/* Team Boards Section */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Boards
            </h2>
            <p className="text-sm text-muted-foreground">
              Boards shared with your teams
            </p>
          </div>
          <Link to="/dashboard/teams">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Teams
            </Button>
          </Link>
        </div>

        {teamBoardsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : teamBoards && teamBoards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamBoards.map((board) => (
              <Card key={board.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    {board.teamName}
                  </div>
                  <CardTitle className="text-lg font-semibold truncate">
                    {board.name}
                  </CardTitle>
                  {board.description && (
                    <CardDescription className="line-clamp-2">
                      {board.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Link
                    to="/dashboard/teams/$teamId/boards/$boardId"
                    params={{ teamId: board.teamId, boardId: board.id }}
                  >
                    <Button variant="outline" className="w-full">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Open Board
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">
              No team boards yet. Join or create a team to collaborate with others.
            </p>
            <Link to="/dashboard/teams">
              <Button variant="outline" className="mt-4">
                <Users className="h-4 w-4 mr-2" />
                Go to Teams
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
