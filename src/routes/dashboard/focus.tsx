import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, Target } from "lucide-react";
import { useState } from "react";
import { FocusItem } from "~/components/FocusItem";
import { EditItemDialog } from "~/components/kanban/EditItemDialog";
import { useAllNowItems, useCompleteItem } from "~/hooks/useKanban";
import { useTimerSync } from "~/hooks/useTimerSync";
import type { KanbanItem } from "~/types";

// Convex now item type
interface NowItem {
	_id: string;
	columnId: string;
	boardId: string;
	name: string;
	description?: string;
	importance: string;
	effort: string;
	tags: string[];
	position: number;
	completedAt?: number;
	// Clockify timer integration fields
	clockifyProjectId?: string;
	clockifyClientId?: string;
	clockifyTimeEntryId?: string;
	timerStartedAt?: number;
	timerTotalSeconds?: number;
	lastTimerSync?: number;
	createdAt: number;
	updatedAt: number;
	boardName: string;
}

export const Route = createFileRoute("/dashboard/focus")({
	component: FocusPage,
});

function FocusPage() {
	const { data: items, isLoading, error } = useAllNowItems();
	const completeItemMutation = useCompleteItem();
	const [editItemDialog, setEditItemDialog] = useState<{
		open: boolean;
		item: KanbanItem | null;
		boardId: string | null;
	}>({ open: false, item: null, boardId: null });

	// Enable timer sync to persist timers across browser sessions
	useTimerSync(true);

	const handleComplete = (itemId: string, boardId: string) => {
		completeItemMutation.mutate({ itemId, boardId });
	};

	const handleEditItem = (item: NowItem) => {
		// Convert NowItem to KanbanItem for the edit dialog
		const kanbanItem: KanbanItem = {
			_id: item._id,
			id: item._id,
			_creationTime: item.createdAt,
			columnId: item.columnId,
			boardId: item.boardId,
			name: item.name,
			description: item.description,
			importance: item.importance as "low" | "medium" | "high",
			effort: item.effort as "small" | "medium" | "big",
			tags: item.tags,
			position: item.position,
			completedAt: item.completedAt,
			clockifyProjectId: item.clockifyProjectId,
			clockifyClientId: item.clockifyClientId,
			clockifyTimeEntryId: item.clockifyTimeEntryId,
			timerStartedAt: item.timerStartedAt,
			timerTotalSeconds: item.timerTotalSeconds,
			lastTimerSync: item.lastTimerSync,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
		setEditItemDialog({ open: true, item: kanbanItem, boardId: item.boardId });
	};

	// Group items by board
	const groupedItems = items?.reduce(
		(acc: Record<string, NowItem[]>, item: NowItem) => {
			if (!acc[item.boardName]) {
				acc[item.boardName] = [];
			}
			acc[item.boardName].push(item);
			return acc;
		},
		{} as Record<string, NowItem[]>,
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="flex items-center justify-center h-64">
					<p className="text-destructive">Failed to load focus items</p>
				</div>
			</div>
		);
	}

	const totalItems = items?.length || 0;

	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
						<Target className="h-6 w-6 text-violet-400" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
						Focus
					</h1>
				</div>
				<p className="text-muted-foreground">
					{totalItems === 0
						? "You're all caught up! No items need your attention right now."
						: `${totalItems} item${totalItems === 1 ? "" : "s"} across all your boards need attention.`}
				</p>
			</div>

			{/* Empty State */}
			{totalItems === 0 && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
						<CheckCircle2 className="h-12 w-12 text-emerald-400" />
					</div>
					<h2 className="text-xl font-semibold text-foreground mb-2">
						All Clear!
					</h2>
					<p className="text-muted-foreground text-center max-w-md">
						You don't have any items in your "Now" columns. Add items to a
						board's "Now" column to see them here.
					</p>
				</div>
			)}

			{/* Items grouped by board */}
			{groupedItems && Object.keys(groupedItems).length > 0 && (
				<div className="space-y-8">
					{Object.entries(groupedItems).map(([boardName, boardItems]) => {
						const firstItem = (boardItems as NowItem[])[0];
						const boardId = firstItem?.boardId;

						return (
							<div key={boardName}>
								<Link
									to="/dashboard/kanban/$boardId"
									params={{ boardId }}
									className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 hover:text-foreground transition-colors group w-fit"
								>
									<span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
									{boardName}
									<span className="text-muted-foreground/50">
										({(boardItems as NowItem[]).length})
									</span>
									<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
								</Link>
								<div className="space-y-2">
									{(boardItems as NowItem[]).map((item: NowItem) => (
										<FocusItem
											key={item._id}
											item={item}
											onComplete={handleComplete}
											onEdit={handleEditItem}
											isCompleting={completeItemMutation.isPending}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Edit Item Dialog */}
			<EditItemDialog
				open={editItemDialog.open}
				onOpenChange={(open) =>
					setEditItemDialog((prev) => ({ ...prev, open }))
				}
				item={editItemDialog.item}
				boardId={editItemDialog.boardId || ""}
			/>
		</div>
	);
}
