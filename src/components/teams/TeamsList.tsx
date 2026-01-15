import { useState } from "react";
import { Plus, Users, Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
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
import { TeamCard } from "./TeamCard";
import { TeamDialog } from "./TeamDialog";
import { PendingInvitations } from "./PendingInvitations";
import { useTeams, useDeleteTeam } from "~/hooks/useTeams";
import type { Team } from "~/types";

export function TeamsList() {
  const { data: teams, isPending, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
  };

  const handleDelete = (team: Team) => {
    setDeletingTeam(team);
  };

  const confirmDelete = () => {
    if (deletingTeam) {
      deleteTeamMutation.mutate(deletingTeam.id, {
        onSettled: () => setDeletingTeam(null),
      });
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load teams</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      <PendingInvitations />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Collaborate with others on shared boards
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {/* Team Grid */}
      {teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No teams yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first team to collaborate with others
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <TeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Dialog */}
      <TeamDialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
        team={editingTeam}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingTeam}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTeam?.name}"? This will
              also delete all boards and items in this team. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
