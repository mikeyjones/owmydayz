import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	useClockifyClients,
	useClockifyConnection,
	useClockifyProjects,
} from "~/hooks/useClockify";
import type { ItemFormData } from "./ItemForm";

interface ClockifyFieldsProps {
	form: UseFormReturn<ItemFormData>;
	isPending?: boolean;
	selectedClientId?: string;
	onClientChange: (clientId: string) => void;
}

export function ClockifyFields({
	form,
	isPending = false,
	selectedClientId,
	onClientChange,
}: ClockifyFieldsProps) {
	const { activeWorkspace } = useClockifyConnection();
	const {
		data: projectsData,
		isLoading: isLoadingProjects,
		error: projectsError,
		refetch: refetchProjects,
	} = useClockifyProjects(activeWorkspace?.workspaceId, !!activeWorkspace);
	const projects = Array.isArray(projectsData) ? projectsData : [];

	const {
		data: clientsData,
		isLoading: isLoadingClients,
		error: _clientsError,
		refetch: refetchClients,
	} = useClockifyClients(activeWorkspace?.workspaceId, !!activeWorkspace);
	const clients = Array.isArray(clientsData) ? clientsData : [];

	// Filter projects based on selected client
	const filteredProjects = useMemo(() => {
		if (!selectedClientId || selectedClientId === "__none__") {
			return projects.filter((p) => !p.clientId && !p.archived);
		}
		return projects.filter(
			(p) => p.clientId === selectedClientId && !p.archived,
		);
	}, [projects, selectedClientId]);

	// Only show Clockify field if connected AND projects loaded successfully
	const showClockifyField =
		!!activeWorkspace && !projectsError && projects.length > 0;

	if (!activeWorkspace) {
		return (
			<div className="rounded-lg border border-muted bg-muted/50 p-6">
				<p className="text-sm text-muted-foreground text-center">
					Connect to Clockify in Settings to enable time tracking for this item.
				</p>
			</div>
		);
	}

	if (!showClockifyField) {
		return (
			<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
				<p className="text-sm text-yellow-800">
					{projectsError
						? `Error loading Clockify projects: ${projectsError instanceof Error ? projectsError.message : "Unknown error"}`
						: projects.length === 0
							? "No Clockify projects found. Create a project in Clockify first, then refresh this page."
							: "Loading Clockify projects..."}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Client Selection */}
			<FormField
				control={form.control}
				name="clockifyClientId"
				render={({ field }) => {
					const safeValue =
						field.value && field.value !== "" ? field.value : "__none__";

					return (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel className="text-base font-medium">
									Clockify Client (Optional)
								</FormLabel>
								<button
									type="button"
									onClick={() => refetchClients()}
									disabled={isPending || isLoadingClients}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									{isLoadingClients ? "Loading..." : "Refresh"}
								</button>
							</div>
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									onClientChange(value);
									// Reset project selection when client changes
									form.setValue("clockifyProjectId", "__none__");
								}}
								value={safeValue}
								disabled={isPending || isLoadingClients}
							>
								<FormControl>
									<SelectTrigger className="w-full h-11">
										<SelectValue placeholder="Select a client (optional)" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="__none__">
										<span className="text-muted-foreground">
											No client (show projects without client)
										</span>
									</SelectItem>
									{clients
										.filter((c) => !c.archived && c?.id && c.id.trim() !== "")
										.map((client) => (
											<SelectItem
												key={client.id}
												value={client.id || "__unknown__"}
											>
												<span>{client.name}</span>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<FormDescription>
								Filter projects by client. Defaults to projects without a
								client.
							</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>

			{/* Project Selection */}
			<FormField
				control={form.control}
				name="clockifyProjectId"
				render={({ field }) => {
					const safeValue =
						field.value && field.value !== "" ? field.value : "__none__";

					return (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel className="text-base font-medium">
									Clockify Project (Optional)
								</FormLabel>
								<button
									type="button"
									onClick={() => refetchProjects()}
									disabled={isPending || isLoadingProjects}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									{isLoadingProjects ? "Loading..." : "Refresh"}
								</button>
							</div>
							<Select
								onValueChange={field.onChange}
								value={safeValue}
								disabled={isPending || isLoadingProjects}
							>
								<FormControl>
									<SelectTrigger className="w-full h-11">
										<SelectValue placeholder="Select a project (optional)" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="__none__">
										<span className="text-muted-foreground">
											No project (use board default)
										</span>
									</SelectItem>
									{filteredProjects
										.filter((p) => p?.id && p.id.trim() !== "")
										.map((project) => (
											<SelectItem
												key={project.id}
												value={project.id || "__unknown__"}
											>
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{ backgroundColor: project.color }}
													/>
													<span>{project.name}</span>
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<FormDescription>
								Override the board's default Clockify project for this item
							</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>

			<div className="rounded-lg border bg-muted/50 p-4">
				<p className="text-sm text-muted-foreground">
					The selected Clockify project will be used when starting a timer for
					this task. If no project is selected, the board's default project will
					be used.
				</p>
			</div>
		</div>
	);
}
