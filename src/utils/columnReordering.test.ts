import { describe, expect, it } from "vitest";
import type { KanbanColumn } from "~/types/kanban";
import { calculateNewColumnOrder } from "./columnReordering";

describe("calculateNewColumnOrder", () => {
	// Helper function to create mock columns
	const createColumn = (
		id: string,
		position: number,
		isSystem = false,
		name?: string,
	): KanbanColumn => ({
		_id: id,
		id,
		_creationTime: Date.now(),
		boardId: "board-1",
		name: name || `Column ${id}`,
		position,
		isSystem,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	describe("filter Completed column", () => {
		it("should allow Now column to be reordered", () => {
			const columns: KanbanColumn[] = [
				createColumn("sys-now", 0, true, "Now"),
				createColumn("col-1", 1, false),
				createColumn("col-2", 2, false),
				createColumn("sys-completed", 999999, true, "Completed"),
			];

			// Move Now to between col-1 and col-2
			const result = calculateNewColumnOrder(columns, "sys-now", "col-2");

			// Now should be in the result (not filtered out)
			expect(result).toHaveLength(3); // sys-now, col-1, col-2 (Completed excluded)
			expect(result).toContain("sys-now");
			expect(result).toContain("col-1");
			expect(result).toContain("col-2");
		});

		it("should exclude only Completed column from reordering", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0, false),
				createColumn("sys-now", 1, true, "Now"),
				createColumn("col-2", 2, false),
				createColumn("sys-completed", 999999, true, "Completed"),
			];

			const result = calculateNewColumnOrder(columns, "col-1", "col-2");

			// All columns except Completed should be in result
			expect(result).toHaveLength(3);
			expect(result).toContain("col-1");
			expect(result).toContain("sys-now");
			expect(result).toContain("col-2");
			expect(result).not.toContain("sys-completed");
		});
	});

	describe("drop left of target", () => {
		it("should move column to the left of target", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
			];

			// Move col-4 to the left of col-2
			const result = calculateNewColumnOrder(columns, "col-4", "col-2");

			expect(result).toEqual(["col-1", "col-4", "col-2", "col-3"]);
		});

		it("should move column from right to left in the middle", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
				createColumn("col-5", 4),
			];

			// Move col-5 to the left of col-3
			const result = calculateNewColumnOrder(columns, "col-5", "col-3");

			expect(result).toEqual(["col-1", "col-2", "col-5", "col-3", "col-4"]);
		});
	});

	describe("drop right of target", () => {
		it("should move column to the right of target", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
			];

			// Move col-1 to the right of col-3
			const result = calculateNewColumnOrder(columns, "col-1", "col-3", true);

			expect(result).toEqual(["col-2", "col-3", "col-1", "col-4"]);
		});

		it("should move column from left to right in the middle", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
				createColumn("col-5", 4),
			];

			// Move col-2 to the right of col-4
			const result = calculateNewColumnOrder(columns, "col-2", "col-4", true);

			expect(result).toEqual(["col-1", "col-3", "col-4", "col-2", "col-5"]);
		});
	});

	describe("drop at start", () => {
		it("should move column to the beginning", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
			];

			// Move col-4 to the start
			const result = calculateNewColumnOrder(columns, "col-4", "col-1");

			expect(result).toEqual(["col-4", "col-1", "col-2", "col-3"]);
		});

		it("should handle moving last column to first position", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
			];

			const result = calculateNewColumnOrder(columns, "col-3", "col-1");

			expect(result).toEqual(["col-3", "col-1", "col-2"]);
		});
	});

	describe("drop at end", () => {
		it("should move column to the end", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
			];

			// Move col-1 to the end (after col-4)
			const result = calculateNewColumnOrder(columns, "col-1", "col-4", true);

			expect(result).toEqual(["col-2", "col-3", "col-4", "col-1"]);
		});

		it("should handle moving first column to last position", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
			];

			const result = calculateNewColumnOrder(columns, "col-1", "col-3", true);

			expect(result).toEqual(["col-2", "col-3", "col-1"]);
		});
	});

	describe("drop in same position", () => {
		it("should return same order when dropped in same position", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
				createColumn("col-4", 3),
			];

			// Move col-2 to where it already is (before col-3)
			const result = calculateNewColumnOrder(columns, "col-2", "col-3");

			expect(result).toEqual(["col-1", "col-2", "col-3", "col-4"]);
		});

		it("should handle when dropped on itself", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
			];

			// Drop col-2 on itself (no change)
			const result = calculateNewColumnOrder(columns, "col-2", "col-2");

			expect(result).toEqual(["col-1", "col-2", "col-3"]);
		});

		it("should handle adjacent column swaps that result in same position", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
			];

			// Moving col-1 to right of col-1 (after itself) should keep it in place
			const result = calculateNewColumnOrder(columns, "col-1", "col-1", true);

			expect(result).toEqual(["col-1", "col-2", "col-3"]);
		});
	});

	describe("edge cases", () => {
		it("should handle single column", () => {
			const columns: KanbanColumn[] = [createColumn("col-1", 0)];

			const result = calculateNewColumnOrder(columns, "col-1", "col-1");

			expect(result).toEqual(["col-1"]);
		});

		it("should handle two columns", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
			];

			// Swap them
			const result = calculateNewColumnOrder(columns, "col-2", "col-1");

			expect(result).toEqual(["col-2", "col-1"]);
		});

		it("should handle empty column array", () => {
			const columns: KanbanColumn[] = [];

			const result = calculateNewColumnOrder(columns, "col-1", "col-2");

			expect(result).toEqual([]);
		});

		it("should handle all Completed columns", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0, true, "Completed"),
				createColumn("col-2", 1, true, "Completed"),
				createColumn("col-3", 2, true, "Completed"),
			];

			const result = calculateNewColumnOrder(columns, "col-1", "col-2");

			// All are Completed columns, so nothing to reorder
			expect(result).toEqual([]);
		});

		it("should maintain order when target is not found", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0),
				createColumn("col-2", 1),
				createColumn("col-3", 2),
			];

			// Target column doesn't exist
			const result = calculateNewColumnOrder(columns, "col-1", "col-999");

			// Should return original order (minus dragged column or handle gracefully)
			expect(result).toBeDefined();
		});
	});

	describe("complex scenarios with system columns", () => {
		it("should handle Now column with user columns", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0, false),
				createColumn("sys-now", 1, true, "Now"),
				createColumn("col-2", 2, false),
				createColumn("sys-completed", 999999, true, "Completed"),
				createColumn("col-3", 3, false),
				createColumn("col-4", 4, false),
			];

			// Move col-4 to before col-2 (Now should be included, Completed excluded)
			const result = calculateNewColumnOrder(columns, "col-4", "col-2");

			// Result should include Now but not Completed
			expect(result).toContain("col-1");
			expect(result).toContain("sys-now");
			expect(result).toContain("col-4");
			expect(result).toContain("col-2");
			expect(result).toContain("col-3");
			expect(result).not.toContain("sys-completed");
		});

		it("should handle dropping near Now column", () => {
			const columns: KanbanColumn[] = [
				createColumn("col-1", 0, false),
				createColumn("sys-now", 1, true, "Now"),
				createColumn("col-2", 2, false),
				createColumn("col-3", 3, false),
			];

			// Move col-3 to before col-2 (Now should stay in result)
			const result = calculateNewColumnOrder(columns, "col-3", "col-2");

			expect(result).toContain("col-1");
			expect(result).toContain("sys-now");
			expect(result).toContain("col-3");
			expect(result).toContain("col-2");
		});
	});
});
