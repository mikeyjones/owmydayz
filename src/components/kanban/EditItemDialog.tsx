import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, FileText, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ItemCommentList } from "~/components/comments";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Form } from "~/components/ui/form";
import { useDebouncedCallback } from "~/hooks/useDebouncedCallback";
import {
	useCreateKanbanItemComment,
	useDeleteKanbanItemComment,
	useKanbanItemComments,
	useUpdateKanbanItemComment,
} from "~/hooks/useItemComments";
import { useUpdateItem } from "~/hooks/useKanban";
// TODO: Implement comment replies in Convex
import { authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";
import type { ItemCommentWithUser, KanbanItem } from "~/types";
import { ClockifyFields } from "./ClockifyFields";
import { ItemForm, type ItemFormData, itemFormSchema } from "./ItemForm";

interface EditItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: KanbanItem | null;
	boardId: string;
}

type Tab = "details" | "clockify" | "comments";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function EditItemDialog({
	open,
	onOpenChange,
	item,
	boardId,
}: EditItemDialogProps) {
	const [activeTab, setActiveTab] = useState<Tab>("details");
	const [repliesCache, _setRepliesCache] = useState<
		Record<string, ItemCommentWithUser[]>
	>({});
	const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
		{},
	);
	const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
		item?.clockifyClientId || "__none__",
	);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const isInitialMount = useRef(true);

	const { data: session } = authClient.useSession();
	const updateItemMutation = useUpdateItem();

	// Form for the item data (shared across Details and Clockify tabs)
	const form = useForm<ItemFormData>({
		resolver: zodResolver(itemFormSchema),
		defaultValues: {
			name: item?.name || "",
			description: item?.description || "",
			importance: (item?.importance as "low" | "medium" | "high") || "medium",
			effort: (item?.effort as "small" | "medium" | "big") || "medium",
			tags: item?.tags || [],
			clockifyClientId:
				item?.clockifyClientId && item.clockifyClientId !== ""
					? item.clockifyClientId
					: "__none__",
			clockifyProjectId:
				item?.clockifyProjectId && item.clockifyProjectId !== ""
					? item.clockifyProjectId
					: "__none__",
		},
	});

	// Comments hooks (stubs - not yet implemented)
	const { data: comments = [], isLoading: isLoadingComments } =
		useKanbanItemComments(item?.id || "");

	const createCommentMutation = useCreateKanbanItemComment();
	const updateCommentMutation = useUpdateKanbanItemComment();
	const deleteCommentMutation = useDeleteKanbanItemComment();

	// Auto-save function
	const performSave = useCallback(() => {
		if (!item) return;

		const data = form.getValues();

		// Validate form before saving
		const validation = itemFormSchema.safeParse(data);
		if (!validation.success) {
			setSaveStatus("error");
			return;
		}

		setSaveStatus("saving");

		updateItemMutation.mutate(
			{
				id: item.id,
				name: data.name,
				description: data.description || undefined,
				importance: data.importance,
				effort: data.effort,
				tags: data.tags,
				clockifyClientId:
					!data.clockifyClientId || data.clockifyClientId === "__none__"
						? undefined
						: data.clockifyClientId,
				clockifyProjectId:
					!data.clockifyProjectId || data.clockifyProjectId === "__none__"
						? undefined
						: data.clockifyProjectId,
				boardId,
			},
			{
				silent: true, // Don't show success toast for auto-save
				onSuccess: () => {
					setSaveStatus("saved");
					// Reset to idle after showing "saved" for 2 seconds
					setTimeout(() => setSaveStatus("idle"), 2000);
				},
				onError: () => {
					setSaveStatus("error");
				},
			},
		);
	}, [item, form, boardId, updateItemMutation]);

	// Debounced save (1 second delay)
	const debouncedSave = useDebouncedCallback(performSave, 1000);

	// Watch form changes and trigger auto-save
	useEffect(() => {
		const subscription = form.watch(() => {
			// Skip auto-save on initial mount
			if (isInitialMount.current) {
				isInitialMount.current = false;
				return;
			}
			debouncedSave();
		});

		return () => subscription.unsubscribe();
	}, [form, debouncedSave]);

	// Handle dialog close - flush any pending saves
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) {
				// Dialog is closing - flush any pending saves immediately
				debouncedSave.flush();
			}
			onOpenChange(newOpen);
		},
		[onOpenChange, debouncedSave],
	);

	// Reset form when item changes
	useEffect(() => {
		if (item) {
			// Set BEFORE reset so the watch callback that fires during reset is skipped
			isInitialMount.current = true;
			form.reset({
				name: item.name || "",
				description: item.description || "",
				importance: (item.importance as "low" | "medium" | "high") || "medium",
				effort: (item.effort as "small" | "medium" | "big") || "medium",
				tags: item.tags || [],
				clockifyClientId:
					item.clockifyClientId && item.clockifyClientId !== ""
						? item.clockifyClientId
						: "__none__",
				clockifyProjectId:
					item.clockifyProjectId && item.clockifyProjectId !== ""
						? item.clockifyProjectId
						: "__none__",
			});
			setSelectedClientId(item.clockifyClientId || "__none__");
		}
	}, [item, form]);

	const handleLoadReplies = useCallback(async (parentCommentId: string) => {
		// TODO: Implement comment replies in Convex
		console.warn("Comment replies not yet implemented in Convex");
		setLoadingReplies((prev) => ({ ...prev, [parentCommentId]: false }));
	}, []);

	const handleCreateComment = useCallback(
		(_content: string, _parentCommentId?: string) => {
			// TODO: Implement when comments are available in Convex
			console.warn("Item comments not yet implemented");
		},
		[],
	);

	const handleUpdateComment = useCallback(
		(_commentId: string, _content: string) => {
			// TODO: Implement when comments are available in Convex
			console.warn("Item comments not yet implemented");
		},
		[],
	);

	const handleDeleteComment = useCallback((_commentId: string) => {
		// TODO: Implement when comments are available in Convex
		console.warn("Item comments not yet implemented");
	}, []);

	const getReplies = useCallback(
		(parentCommentId: string) => {
			return repliesCache[parentCommentId] || [];
		},
		[repliesCache],
	);

	const isLoadingRepliesFor = useCallback(
		(parentCommentId: string) => {
			return loadingReplies[parentCommentId] || false;
		},
		[loadingReplies],
	);

	if (!item) return null;

	const currentUserId = session?.user?.id || "";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>{item.name}</DialogTitle>
						{saveStatus !== "idle" && (
							<div className="flex items-center gap-2 text-sm">
								{saveStatus === "saving" && (
									<>
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										<span className="text-muted-foreground">Saving...</span>
									</>
								)}
								{saveStatus === "saved" && (
									<>
										<Check className="h-4 w-4 text-green-600" />
										<span className="text-green-600">Saved</span>
									</>
								)}
								{saveStatus === "error" && (
									<span className="text-destructive">Error saving</span>
								)}
							</div>
						)}
					</div>
					<DialogDescription>
						View and edit item details, configure Clockify tracking, or add
						comments. Changes are saved automatically.
					</DialogDescription>
				</DialogHeader>

				{/* Tab buttons */}
				<div className="flex border-b">
					<Button
						variant="ghost"
						className={cn(
							"flex-1 rounded-none border-b-2 border-transparent",
							activeTab === "details" && "border-primary text-primary",
						)}
						onClick={() => setActiveTab("details")}
					>
						<FileText className="h-4 w-4 mr-2" />
						Details
					</Button>
					<Button
						variant="ghost"
						className={cn(
							"flex-1 rounded-none border-b-2 border-transparent",
							activeTab === "clockify" && "border-primary text-primary",
						)}
						onClick={() => setActiveTab("clockify")}
					>
						<Clock className="h-4 w-4 mr-2" />
						Clockify
					</Button>
					<Button
						variant="ghost"
						className={cn(
							"flex-1 rounded-none border-b-2 border-transparent",
							activeTab === "comments" && "border-primary text-primary",
						)}
						onClick={() => setActiveTab("comments")}
					>
						<MessageSquare className="h-4 w-4 mr-2" />
						Comments
					</Button>
				</div>

				{/* Tab content */}
				<Form {...form}>
					<div className="flex-1 overflow-y-auto min-h-0">
						{activeTab === "details" && (
							<div className="pt-4">
								<ItemForm
									form={form}
									isPending={updateItemMutation.isPending}
								/>
							</div>
						)}
						{activeTab === "clockify" && (
							<div className="pt-4">
								<ClockifyFields
									form={form}
									isPending={updateItemMutation.isPending}
									selectedClientId={selectedClientId}
									onClientChange={setSelectedClientId}
								/>
							</div>
						)}
						{activeTab === "comments" && (
							<div className="pt-4">
								<ItemCommentList
									comments={comments}
									currentUserId={currentUserId}
									itemId={item.id}
									isLoading={isLoadingComments}
									onCreateComment={handleCreateComment}
									onUpdateComment={handleUpdateComment}
									onDeleteComment={handleDeleteComment}
									onLoadReplies={handleLoadReplies}
									getReplies={getReplies}
									isLoadingReplies={isLoadingRepliesFor}
									isCreating={createCommentMutation.isPending}
									isUpdating={updateCommentMutation.isPending}
									isDeleting={deleteCommentMutation.isPending}
								/>
							</div>
						)}
					</div>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
