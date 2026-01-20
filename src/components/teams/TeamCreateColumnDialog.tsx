import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useCreateTeamColumn } from "~/hooks/useTeamBoards";

const columnFormSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(50, "Name must be less than 50 characters"),
});

type ColumnFormData = z.infer<typeof columnFormSchema>;

interface TeamCreateColumnDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	boardId: string;
}

export function TeamCreateColumnDialog({
	open,
	onOpenChange,
	boardId,
}: TeamCreateColumnDialogProps) {
	const createColumnMutation = useCreateTeamColumn();

	const form = useForm<ColumnFormData>({
		resolver: zodResolver(columnFormSchema),
		defaultValues: {
			name: "",
		},
	});

	const handleSubmit = async (data: ColumnFormData) => {
		await createColumnMutation.mutate({
			boardId,
			name: data.name,
		});
		form.reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Create New Column</DialogTitle>
					<DialogDescription>
						Add a new column to organize your items. The column will be added
						before the "Now" and "Completed" columns.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Column Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., To Do, In Progress, Done"
											disabled={createColumnMutation.isPending}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => onOpenChange(false)}
								disabled={createColumnMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={createColumnMutation.isPending}
							>
								{createColumnMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Column"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
