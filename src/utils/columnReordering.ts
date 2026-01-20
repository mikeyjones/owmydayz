import type { KanbanColumn } from "~/types/kanban";

export const SYSTEM_COLUMN_COMPLETED = "Completed";

/**
 * Calculate new column order after drag and drop
 *
 * @param columns - All columns including system columns
 * @param draggedColumnId - ID of the column being dragged
 * @param targetColumnId - ID of the column being dropped on
 * @param dropAfter - Whether to drop after (true) or before (false) the target
 * @returns Array of column IDs in new order (excluding Completed column)
 */
export function calculateNewColumnOrder(
	columns: KanbanColumn[],
	draggedColumnId: string,
	targetColumnId: string,
	dropAfter = false,
): string[] {
	// Sort all columns by position (including Now, excluding only Completed)
	const reorderableColumns = columns
		.filter((col) => {
			// Exclude Completed column from reordering
			if (col.isSystem && col.name === SYSTEM_COLUMN_COMPLETED) {
				return false;
			}
			return true;
		})
		.sort((a, b) => a.position - b.position);

	// Handle edge cases
	if (reorderableColumns.length === 0) {
		return [];
	}

	if (reorderableColumns.length === 1) {
		return [reorderableColumns[0].id];
	}

	// Remove dragged column from the array
	const withoutDragged = reorderableColumns.filter(
		(col) => col.id !== draggedColumnId,
	);

	// Handle case where dragged column is dropped on itself
	if (draggedColumnId === targetColumnId) {
		return reorderableColumns.map((col) => col.id);
	}

	// Find target column index in the filtered array
	const targetIndex = withoutDragged.findIndex(
		(col) => col.id === targetColumnId,
	);

	// If target not found, return original order without dragged column
	if (targetIndex === -1) {
		return withoutDragged.map((col) => col.id);
	}

	// Calculate insert index
	const insertIndex = dropAfter ? targetIndex + 1 : targetIndex;

	// Insert dragged column at the calculated position
	const newOrder = [...withoutDragged];
	newOrder.splice(insertIndex, 0, { id: draggedColumnId } as KanbanColumn);

	// Return array of column IDs
	return newOrder.map((col) => col.id);
}
