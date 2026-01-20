import { describe, expect, it } from "vitest";
import type { KanbanColumnWithItems, KanbanItem } from "~/types";
import { applyOptimisticColumnReorder } from "./useKanban";

describe("applyOptimisticColumnReorder", () => {
	// Helper function to create mock items
	const createItem = (
		id: string,
		columnId: string,
		position: number,
	): KanbanItem => ({
		_id: id,
		id,
		_creationTime: Date.now(),
		boardId: "board-1",
		columnId,
		name: `Item ${id}`,
		position,
		importance: "medium",
		effort: "medium",
		tags: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	// Helper function to create mock columns with items
	const createColumn = (
		id: string,
		position: number,
		isSystem = false,
		items: KanbanItem[] = [],
		name?: string,
	): KanbanColumnWithItems => ({
		_id: id,
		id,
		_creationTime: Date.now(),
		boardId: "board-1",
		name: name || `Column ${id}`,
		position,
		isSystem,
		items,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	describe("reorder columns", () => {
		it("should reorder columns based on new column order", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 0, false, [createItem("item-1", "col-1", 0)]),
				createColumn("col-2", 1, false, [createItem("item-2", "col-2", 0)]),
				createColumn("col-3", 2, false, [createItem("item-3", "col-3", 0)]),
			];

			const newColumnOrder = ["col-3", "col-1", "col-2"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Verify columns are in the new order (starting at position 0)
			expect(result[0].id).toBe("col-3");
			expect(result[0].position).toBe(0);
			expect(result[1].id).toBe("col-1");
			expect(result[1].position).toBe(1);
			expect(result[2].id).toBe("col-2");
			expect(result[2].position).toBe(2);
		});

		it("should update position values correctly", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 0, false),
				createColumn("col-2", 1, false),
				createColumn("col-3", 2, false),
				createColumn("col-4", 3, false),
			];

			const newColumnOrder = ["col-4", "col-2", "col-1", "col-3"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Positions start at 0
			expect(result[0].position).toBe(0);
			expect(result[1].position).toBe(1);
			expect(result[2].position).toBe(2);
			expect(result[3].position).toBe(3);
		});

		it("should handle moving first column to last position", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false, [createItem("item-1", "col-1", 0)]),
				createColumn("col-2", 2, false, [createItem("item-2", "col-2", 0)]),
				createColumn("col-3", 3, false, [createItem("item-3", "col-3", 0)]),
			];

			const newColumnOrder = ["col-2", "col-3", "col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result[0].id).toBe("col-2");
			expect(result[1].id).toBe("col-3");
			expect(result[2].id).toBe("col-1");
		});

		it("should handle moving last column to first position", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
				createColumn("col-3", 3, false),
			];

			const newColumnOrder = ["col-3", "col-1", "col-2"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result[0].id).toBe("col-3");
			expect(result[1].id).toBe("col-1");
			expect(result[2].id).toBe("col-2");
		});
	});

	describe("preserve Completed column", () => {
		it("should allow Now column to be reordered", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("sys-now", 0, true, [], "Now"),
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
				createColumn("sys-completed", 999999, true, [], "Completed"),
			];

			// Move Now to the end (before Completed)
			const newColumnOrder = ["col-1", "col-2", "sys-now"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Now can be reordered, Completed stays at end
			expect(result).toHaveLength(4);
			expect(result[0].id).toBe("col-1");
			expect(result[0].position).toBe(0);
			expect(result[1].id).toBe("col-2");
			expect(result[1].position).toBe(1);
			expect(result[2].id).toBe("sys-now");
			expect(result[2].position).toBe(2);
			expect(result[3].id).toBe("sys-completed");
			expect(result[3].position).toBe(999999);
		});

		it("should keep only Completed column at fixed position", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("sys-now", 0, true, [], "Now"),
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
				createColumn("sys-completed", 999999, true, [], "Completed"),
			];

			const newColumnOrder = ["col-2", "sys-now", "col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result).toHaveLength(4);
			expect(result[0].id).toBe("col-2");
			expect(result[0].position).toBe(0);
			expect(result[1].id).toBe("sys-now");
			expect(result[1].position).toBe(1);
			expect(result[2].id).toBe("col-1");
			expect(result[2].position).toBe(2);
			expect(result[3].id).toBe("sys-completed");
			expect(result[3].position).toBe(999999);
		});

		it("should handle only Now and Completed columns", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("sys-now", 0, true, [], "Now"),
				createColumn("sys-completed", 999999, true, [], "Completed"),
			];

			// Include Now in reorder
			const newColumnOrder = ["sys-now"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Now reordered, Completed at end
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("sys-now");
			expect(result[0].position).toBe(0);
			expect(result[1].id).toBe("sys-completed");
			expect(result[1].position).toBe(999999);
		});

		it("should allow Now to be at any position except after Completed", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 0, false),
				createColumn("sys-now", 1, true, [], "Now"),
				createColumn("col-2", 2, false),
				createColumn("col-3", 3, false),
				createColumn("sys-completed", 999999, true, [], "Completed"),
			];

			// Move Now between col-2 and col-3
			const newColumnOrder = ["col-1", "col-2", "sys-now", "col-3"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// All columns reordered, Completed at end
			expect(result).toHaveLength(5);
			expect(result[0].id).toBe("col-1");
			expect(result[0].position).toBe(0);
			expect(result[1].id).toBe("col-2");
			expect(result[1].position).toBe(1);
			expect(result[2].id).toBe("sys-now");
			expect(result[2].position).toBe(2);
			expect(result[3].id).toBe("col-3");
			expect(result[3].position).toBe(3);
			expect(result[4].id).toBe("sys-completed");
			expect(result[4].position).toBe(999999);
		});
	});

	describe("preserve items", () => {
		it("should preserve all items in columns after reordering", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false, [
					createItem("item-1", "col-1", 0),
					createItem("item-2", "col-1", 1),
				]),
				createColumn("col-2", 2, false, [createItem("item-3", "col-2", 0)]),
				createColumn("col-3", 3, false, [
					createItem("item-4", "col-3", 0),
					createItem("item-5", "col-3", 1),
					createItem("item-6", "col-3", 2),
				]),
			];

			const newColumnOrder = ["col-3", "col-1", "col-2"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Verify all items are preserved in their respective columns
			expect(result[0].items).toHaveLength(3);
			expect(result[0].items[0].id).toBe("item-4");
			expect(result[0].items[1].id).toBe("item-5");
			expect(result[0].items[2].id).toBe("item-6");

			expect(result[1].items).toHaveLength(2);
			expect(result[1].items[0].id).toBe("item-1");
			expect(result[1].items[1].id).toBe("item-2");

			expect(result[2].items).toHaveLength(1);
			expect(result[2].items[0].id).toBe("item-3");
		});

		it("should not modify item properties", () => {
			const items = [
				createItem("item-1", "col-1", 0),
				createItem("item-2", "col-1", 1),
			];
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false, items),
				createColumn("col-2", 2, false, [createItem("item-3", "col-2", 0)]),
			];

			const newColumnOrder = ["col-2", "col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Verify item properties are unchanged
			const col1Items = result[1].items;
			expect(col1Items[0].name).toBe("Item item-1");
			expect(col1Items[0].position).toBe(0);
			expect(col1Items[0].columnId).toBe("col-1");
			expect(col1Items[1].name).toBe("Item item-2");
			expect(col1Items[1].position).toBe(1);
			expect(col1Items[1].columnId).toBe("col-1");
		});

		it("should preserve items in system columns", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn(
					"sys-now",
					0,
					true,
					[
						createItem("sys-item-1", "sys-now", 0),
						createItem("sys-item-2", "sys-now", 1),
					],
					"Now",
				),
				createColumn("col-1", 1, false, [createItem("item-1", "col-1", 0)]),
				createColumn("sys-completed", 999999, true, [], "Completed"),
			];

			// Include Now in the reorder
			const newColumnOrder = ["col-1", "sys-now"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Now column items should be preserved
			const nowColumn = result.find((col) => col.id === "sys-now");
			expect(nowColumn?.items).toHaveLength(2);
			expect(nowColumn?.items[0].id).toBe("sys-item-1");
			expect(nowColumn?.items[1].id).toBe("sys-item-2");
		});

		it("should handle columns with empty items arrays", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false, [createItem("item-1", "col-1", 0)]),
				createColumn("col-2", 2, false, []),
				createColumn("col-3", 3, false, [createItem("item-2", "col-3", 0)]),
			];

			const newColumnOrder = ["col-2", "col-1", "col-3"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result[0].items).toHaveLength(0);
			expect(result[1].items).toHaveLength(1);
			expect(result[2].items).toHaveLength(1);
		});
	});

	describe("edge cases", () => {
		it("should handle empty columns array", () => {
			const columns: KanbanColumnWithItems[] = [];
			const newColumnOrder: string[] = [];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result).toEqual([]);
		});

		it("should handle single column", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false, [createItem("item-1", "col-1", 0)]),
			];

			const newColumnOrder = ["col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("col-1");
			expect(result[0].items).toHaveLength(1);
		});

		it("should handle columns not in new order (missing columns)", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
				createColumn("col-3", 3, false),
			];

			// Only reordering some columns
			const newColumnOrder = ["col-2", "col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Should include all columns, with unspecified ones at the end
			expect(result).toHaveLength(3);
			expect(result[0].id).toBe("col-2");
			expect(result[1].id).toBe("col-1");
		});

		it("should return original columns if new order is empty", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
			];

			const newColumnOrder: string[] = [];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Should handle empty order gracefully
			expect(result).toHaveLength(2);
		});

		it("should maintain column metadata after reordering", () => {
			const columns: KanbanColumnWithItems[] = [
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
			];

			const newColumnOrder = ["col-2", "col-1"];

			const result = applyOptimisticColumnReorder(columns, newColumnOrder);

			// Check that column properties are preserved
			expect(result[0].name).toBe("Column col-2");
			expect(result[0].boardId).toBe("board-1");
			expect(result[1].name).toBe("Column col-1");
			expect(result[1].boardId).toBe("board-1");
		});
	});
});
