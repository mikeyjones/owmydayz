import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { ColumnColor } from "~/utils/columnColors";

interface QuickAddItemProps {
	onAdd: (name: string) => void;
	columnColor?: ColumnColor;
	isPending?: boolean;
}

export function QuickAddItem({
	onAdd,
	columnColor,
	isPending = false,
}: QuickAddItemProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [itemName, setItemName] = useState("");

	const handleSubmit = () => {
		const trimmedName = itemName.trim();
		if (trimmedName) {
			onAdd(trimmedName);
			setItemName("");
			// Keep the form open for adding more items
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
		if (e.key === "Escape") {
			setIsAdding(false);
			setItemName("");
		}
	};

	const handleCancel = () => {
		setIsAdding(false);
		setItemName("");
	};

	if (!isAdding) {
		return (
			<button
				type="button"
				onClick={() => setIsAdding(true)}
				className={cn(
					"w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
					"hover:bg-accent/50 text-muted-foreground hover:text-foreground",
				)}
			>
				<Plus className="h-4 w-4" />
				<span>Add a card</span>
			</button>
		);
	}

	return (
		<div className="space-y-2">
			<Textarea
				autoFocus
				value={itemName}
				onChange={(e) => setItemName(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Enter a title for this card..."
				className={cn(
					"min-h-[60px] text-sm resize-none",
					"focus-visible:ring-2",
					columnColor?.accent && `focus-visible:ring-[${columnColor.accent}]`,
				)}
				disabled={isPending}
			/>
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					onClick={handleSubmit}
					disabled={!itemName.trim() || isPending}
					className="h-8"
				>
					Add card
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					disabled={isPending}
					className="h-8 w-8 p-0"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
