import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useDeleteTeam, useTeam, useUpdateTeam } from "~/hooks/useTeams";

const teamSettingsSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
});

type TeamSettingsFormData = z.infer<typeof teamSettingsSchema>;

interface TeamSettingsProps {
	teamId: string;
}

export function TeamSettings({ teamId }: TeamSettingsProps) {
	const navigate = useNavigate();
	const { data: team, isPending: teamLoading } = useTeam(teamId);
	const updateTeamMutation = useUpdateTeam();
	const deleteTeamMutation = useDeleteTeam();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const form = useForm<TeamSettingsFormData>({
		resolver: zodResolver(teamSettingsSchema),
		values: {
			name: team?.name || "",
		},
	});

	const handleUpdate = (data: TeamSettingsFormData) => {
		updateTeamMutation.mutate({ id: teamId, ...data });
	};

	const handleDelete = () => {
		deleteTeamMutation.mutate(teamId, {
			onSuccess: () => {
				navigate({ to: "/dashboard/teams" });
			},
		});
	};

	if (teamLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			{/* General Settings */}
			<Card>
				<CardHeader>
					<CardTitle>General Settings</CardTitle>
					<CardDescription>
						Update your team&apos;s basic information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleUpdate)}
							className="space-y-4"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Team Name</FormLabel>
										<FormControl>
											<Input
												placeholder="My Team"
												disabled={updateTeamMutation.isPending}
												{...field}
											/>
										</FormControl>
										<FormDescription>
											This is the name that will be displayed to team members
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="pt-2">
								<FormItem>
									<FormLabel>Team Slug</FormLabel>
									<FormControl>
										<Input value={team?.slug || ""} disabled />
									</FormControl>
									<FormDescription>
										The unique identifier for your team (cannot be changed)
									</FormDescription>
								</FormItem>
							</div>

							<Button
								type="submit"
								disabled={
									updateTeamMutation.isPending || !form.formState.isDirty
								}
							>
								{updateTeamMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="text-destructive">Danger Zone</CardTitle>
					<CardDescription>
						Irreversible actions that affect your entire team
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
						<div>
							<p className="font-medium">Delete Team</p>
							<p className="text-sm text-muted-foreground">
								Permanently delete this team and all its boards
							</p>
						</div>
						<Button
							variant="destructive"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Team
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{team?.name}&quot;? This
							will permanently delete all boards, columns, and items in this
							team. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
