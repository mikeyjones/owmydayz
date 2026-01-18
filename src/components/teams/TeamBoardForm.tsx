import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Loader2 } from "lucide-react";
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
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

export const teamBoardFormSchema = z.object({
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
});

export type TeamBoardFormData = z.infer<typeof teamBoardFormSchema>;

interface TeamBoardFormProps {
	defaultValues?: Partial<TeamBoardFormData>;
	onSubmit: (data: TeamBoardFormData) => void | Promise<void>;
	isPending?: boolean;
	submitLabel?: string;
	onCancel?: () => void;
	cancelLabel?: string;
}

export function TeamBoardForm({
	defaultValues,
	onSubmit,
	isPending = false,
	submitLabel = "Create Board",
	onCancel,
	cancelLabel = "Cancel",
}: TeamBoardFormProps) {
	const form = useForm<TeamBoardFormData>({
		resolver: zodResolver(teamBoardFormSchema),
		defaultValues: {
			name: "",
			description: "",
			focusMode: false,
			...defaultValues,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
