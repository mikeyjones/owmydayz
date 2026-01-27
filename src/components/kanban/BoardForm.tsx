import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
	useClockifyClients,
	useClockifyConnection,
	useClockifyProjects,
} from "~/hooks/useClockify";

export const boardFormSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
	description: z
		.string()
		.max(500, "Description must be less than 500 characters")
		.optional()
		.or(z.literal("")),
	focusMode: z.boolean().optional(),
	clockifyDefaultClientId: z.string().optional(),
	clockifyDefaultProjectId: z.string().optional(),
});

export type BoardFormData = z.infer<typeof boardFormSchema>;

interface BoardFormProps {
	defaultValues?: Partial<BoardFormData>;
	onSubmit: (data: BoardFormData) => void | Promise<void>;
	isPending?: boolean;
	submitLabel?: string;
	onCancel?: () => void;
	cancelLabel?: string;
}

export function BoardForm({
	defaultValues,
	onSubmit,
	isPending = false,
	submitLabel = "Create Board",
	onCancel,
	cancelLabel = "Cancel",
}: BoardFormProps) {
	const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
		defaultValues?.clockifyDefaultClientId || "__none__",
	);

	const form = useForm<BoardFormData>({
		resolver: zodResolver(boardFormSchema),
		defaultValues: {
			name: defaultValues?.name || "",
			description: defaultValues?.description || "",
			focusMode: defaultValues?.focusMode || false,
			...defaultValues,
			// Convert undefined/empty values to "__none__" for the select
			clockifyDefaultClientId:
				defaultValues?.clockifyDefaultClientId &&
				defaultValues.clockifyDefaultClientId !== ""
					? defaultValues.clockifyDefaultClientId
					: "__none__",
			clockifyDefaultProjectId:
				defaultValues?.clockifyDefaultProjectId &&
				defaultValues.clockifyDefaultProjectId !== ""
					? defaultValues.clockifyDefaultProjectId
					: "__none__",
		},
	});

	// Get Clockify connection and projects
	const { isConnected, activeWorkspace } = useClockifyConnection();
	const {
		data: projectsData,
		isLoading: isLoadingProjects,
		error: projectsError,
		refetch: refetchProjects,
	} = useClockifyProjects(activeWorkspace?.workspaceId, isConnected);
	const projects = Array.isArray(projectsData) ? projectsData : [];

	const {
		data: clientsData,
		isLoading: isLoadingClients,
		error: _clientsError,
		refetch: refetchClients,
	} = useClockifyClients(activeWorkspace?.workspaceId, isConnected);
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
		isConnected && !projectsError && projects.length > 0;

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		form.handleSubmit(onSubmit)(e);
	};

	return (
		<Form {...form}>
			<form onSubmit={handleFormSubmit} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-base font-medium">Name *</FormLabel>
							<FormControl>
								<Input
									placeholder="Board name"
									className="h-11 text-base"
									disabled={isPending}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{field.value?.length || 0}/100 characters
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-base font-medium">
								Description (Optional)
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Board description"
									className="min-h-[100px] text-base resize-none"
									disabled={isPending}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{field.value?.length || 0}/500 characters
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="focusMode"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<FormLabel className="text-base font-medium">
									Focus Mode
								</FormLabel>
								<FormDescription>
									Show only 2 columns at a time: the Now column and one other
									expandable column.
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
									disabled={isPending}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{isConnected && !showClockifyField && (
					<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-800">
							{projectsError
								? `Error loading Clockify projects: ${projectsError instanceof Error ? projectsError.message : "Unknown error"}`
								: projects.length === 0
									? "No Clockify projects found. Create a project in Clockify first, then refresh this page."
									: "Loading Clockify projects..."}
						</p>
					</div>
				)}

				{showClockifyField && (
					<>
						{/* Client Selection */}
						<FormField
							control={form.control}
							name="clockifyDefaultClientId"
							render={({ field }) => {
								const safeValue =
									field.value && field.value !== "" ? field.value : "__none__";

								return (
									<FormItem>
										<div className="flex items-center justify-between">
											<FormLabel className="text-base font-medium">
												Default Clockify Client (Optional)
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
												setSelectedClientId(value);
												// Reset project selection when client changes
												form.setValue("clockifyDefaultProjectId", "__none__");
											}}
											value={safeValue}
											disabled={isPending || isLoadingClients}
										>
											<FormControl>
												<SelectTrigger className="h-11 text-base">
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
													.filter(
														(c) => !c.archived && c?.id && c.id.trim() !== "",
													)
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
							name="clockifyDefaultProjectId"
							render={({ field }) => {
								// Ensure value is never empty string or undefined
								const safeValue =
									field.value && field.value !== "" ? field.value : "__none__";

								return (
									<FormItem>
										<div className="flex items-center justify-between">
											<FormLabel className="text-base font-medium">
												Default Clockify Project (Optional)
											</FormLabel>
											<button
												type="button"
												onClick={() => refetchProjects()}
												disabled={isLoadingProjects}
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
												<SelectTrigger className="h-11 text-base">
													<SelectValue placeholder="Select a project" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="__none__">None</SelectItem>
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
																<span>{project.name || "Unknown Project"}</span>
															</div>
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										<FormDescription>
											Automatically assign new items to this Clockify project
											for time tracking.
										</FormDescription>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
					</>
				)}

				<div className="flex flex-col gap-4 pt-4 border-t border-border">
					<div className="flex gap-3">
						{onCancel && (
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								disabled={isPending}
								onClick={onCancel}
							>
								{cancelLabel}
							</Button>
						)}
						<Button type="submit" className="flex-1" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<LayoutDashboard className="h-4 w-4 mr-2" />
									{submitLabel}
								</>
							)}
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
