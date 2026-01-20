import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useCreateTeam, useUpdateTeam } from "~/hooks/useTeams";
import type { Team } from "~/types";
import { TeamForm, type TeamFormData } from "./TeamForm";

interface TeamDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Team to edit. If null/undefined, dialog is in create mode */
	team?: Team | null;
}

export function TeamDialog({ open, onOpenChange, team }: TeamDialogProps) {
	const createTeamMutation = useCreateTeam();
	const updateTeamMutation = useUpdateTeam();

	const isEditMode = !!team;
	const mutation = isEditMode ? updateTeamMutation : createTeamMutation;

	const defaultValues = isEditMode
		? {
				name: team.name,
			}
		: undefined;

	const handleSubmit = async (data: TeamFormData) => {
		if (isEditMode) {
			await updateTeamMutation.mutate({ id: team.id, ...data });
		} else {
			await createTeamMutation.mutate(data);
		}
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditMode ? "Edit Team" : "Create Team"}</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the team details."
							: "Create a new team to collaborate with others."}
					</DialogDescription>
				</DialogHeader>
				<TeamForm
					key={isEditMode ? team.id : "create"}
					defaultValues={defaultValues}
					onSubmit={handleSubmit}
					isPending={mutation.isPending}
					submitLabel={isEditMode ? "Save Changes" : "Create Team"}
					onCancel={() => onOpenChange(false)}
					cancelLabel="Cancel"
				/>
			</DialogContent>
		</Dialog>
	);
}
