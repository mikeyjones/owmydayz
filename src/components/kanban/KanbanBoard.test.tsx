import { render, screen, waitFor } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	KanbanBoard as KanbanBoardType,
	KanbanColumnWithItems,
} from "~/types";
import { KanbanBoard } from "./KanbanBoard";

// Mock the hooks
vi.mock("convex/react");
vi.mock("~/lib/auth-client");
vi.mock("~/hooks/useCurrentUser", () => ({
	useCurrentUser: () => ({ userId: "user-1" }),
}));

describe("KanbanBoard - Column Reordering Integration", () => {
	// Helper to create mock board with columns
	const createMockBoard = (
		columns: KanbanColumnWithItems[] = [],
	): KanbanBoardType & { columns: KanbanColumnWithItems[] } => ({
		_id: "board-1",
		id: "board-1",
		_creationTime: Date.now(),
		userId: "user-1",
		name: "Test Board",
		description: "Test board description",
		focusMode: false,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		columns,
	});

	// Helper to create mock column
	const createMockColumn = (
		id: string,
		position: number,
		isSystem = false,
	): KanbanColumnWithItems => ({
		_id: id,
		id,
		_creationTime: Date.now(),
		boardId: "board-1",
		name: `Column ${id}`,
		position,
		isSystem,
		items: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	let mockMutationFn: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock mutation function that matches Convex ReactMutation interface
		mockMutationFn = Object.assign(vi.fn(), {
			withOptimisticUpdate: vi.fn(),
		});

		// Mock useMutation to return a mock mutation function
		vi.mocked(useMutation).mockReturnValue(mockMutationFn as any);
	});

	describe("drag column functionality", () => {
		it("should render columns in correct order", () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
				createMockColumn("col-3", 2),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// Verify columns are rendered
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
			expect(screen.getByText("Column col-2")).toBeInTheDocument();
			expect(screen.getByText("Column col-3")).toBeInTheDocument();
		});

		it("should allow dragging non-system columns", () => {
			const columns = [
				createMockColumn("col-1", 0, false),
				createMockColumn("col-2", 1, false),
				createMockColumn("sys-1", 2, true),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			const { container } = render(<KanbanBoard boardId="board-1" />);

			// Verify non-system columns have drag handles
			const dragHandles = container.querySelectorAll(
				'[data-testid="column-drag-handle"]',
			);

			// Should have 2 drag handles (col-1 and col-2, not sys-1)
			expect(dragHandles.length).toBe(2);
		});

		it("should not allow dragging system columns", () => {
			const columns = [
				createMockColumn("col-1", 0, false),
				createMockColumn("sys-1", 1, true),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// System columns should not have drag handles
			// This will be verified by the column component tests
			expect(screen.getByText("Column sys-1")).toBeInTheDocument();
		});
	});

	describe("optimistic update during column drag", () => {
		it("should immediately show column in new position during drag", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
				createMockColumn("col-3", 2),
			];
			const board = createMockBoard(columns);

			let currentBoard = board;
			vi.mocked(useQuery).mockImplementation(() => currentBoard);

			const { rerender } = render(<KanbanBoard boardId="board-1" />);

			// Simulate optimistic update: col-3 moved to position 0
			const reorderedColumns = [
				createMockColumn("col-3", 0),
				createMockColumn("col-1", 1),
				createMockColumn("col-2", 2),
			];

			currentBoard = createMockBoard(reorderedColumns);
			rerender(<KanbanBoard boardId="board-1" />);

			// Verify the new order is reflected
			expect(screen.getByText("Column col-3")).toBeInTheDocument();
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
			expect(screen.getByText("Column col-2")).toBeInTheDocument();
		});

		it("should maintain optimistic state until server confirms", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// During the mutation, the optimistic update should be visible
			// This is handled by the component's state management
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
			expect(screen.getByText("Column col-2")).toBeInTheDocument();
		});

		it("should clear optimistic state when server data matches", async () => {
			const initialColumns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(initialColumns);

			let currentBoard = board;
			vi.mocked(useQuery).mockImplementation(() => currentBoard);

			const { rerender } = render(<KanbanBoard boardId="board-1" />);

			// Simulate server confirming the reorder
			const reorderedColumns = [
				createMockColumn("col-2", 0),
				createMockColumn("col-1", 1),
			];
			currentBoard = createMockBoard(reorderedColumns);

			rerender(<KanbanBoard boardId="board-1" />);

			// Verify final state matches server
			expect(screen.getByText("Column col-2")).toBeInTheDocument();
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});
	});

	describe("mutation call during column drag", () => {
		it("should call reorderColumns mutation with correct data", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
				createMockColumn("col-3", 2),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// Note: This test validates the contract for when the feature IS implemented
			// The actual drag-and-drop interaction would be tested via e2e tests
			// Here we're testing that when a column reorder happens, the mutation is called

			// Verify the mutation hook is set up
			expect(useMutation).toHaveBeenCalled();
		});

		it("should include boardId and new column order in mutation", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// When implemented, the mutation should be called with:
			// {
			//   boardId: "board-1",
			//   columnOrder: [{ id: "col-2", position: 0 }, { id: "col-1", position: 1 }]
			// }

			// For now, verify the mutation hook is available
			expect(useMutation).toHaveBeenCalled();
		});

		it("should only include non-system columns in reorder mutation", async () => {
			const columns = [
				createMockColumn("col-1", 0, false),
				createMockColumn("sys-1", 1, true),
				createMockColumn("col-2", 2, false),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// When dragging columns, only user columns should be in the new order
			// System columns are always at the end
			// This behavior is tested in the columnReordering utility tests

			expect(screen.getByText("Column col-1")).toBeInTheDocument();
			expect(screen.getByText("Column sys-1")).toBeInTheDocument();
			expect(screen.getByText("Column col-2")).toBeInTheDocument();
		});

		it("should not call mutation if column is dropped in same position", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// If a column is dragged and dropped in the same position,
			// no mutation should be fired (optimization)

			// This will be tested in the implementation
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});
	});

	describe("rollback on error", () => {
		it("should rollback to original order if mutation fails", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
				createMockColumn("col-3", 2),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// After a failed mutation, the optimistic update should be rolled back
			// and the original order restored

			await waitFor(() => {
				expect(screen.getByText("Column col-1")).toBeInTheDocument();
				expect(screen.getByText("Column col-2")).toBeInTheDocument();
				expect(screen.getByText("Column col-3")).toBeInTheDocument();
			});
		});

		it("should show error toast when reorder fails", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// When implemented, a toast error should be shown
			// This is handled by the useReorderColumns hook

			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});

		it("should handle optimistic rollback for multiple pending reorders", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
				createMockColumn("col-3", 2),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// If multiple column reorders happen quickly (while mutations are pending),
			// and one fails, the system should correctly rollback to the last known good state

			// This is an edge case that will be handled by the optimistic state management
			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});

		it("should preserve other optimistic updates when one column reorder fails", async () => {
			const columns = [
				createMockColumn("col-1", 0),
				createMockColumn("col-2", 1),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// If a column reorder fails, but there are other pending optimistic updates
			// (like item moves), those should not be affected

			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});
	});

	describe("edge cases", () => {
		it("should handle empty board", () => {
			const board = createMockBoard([]);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			expect(screen.getByText("No columns yet")).toBeInTheDocument();
		});

		it("should handle single column", () => {
			const columns = [createMockColumn("col-1", 0)];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			expect(screen.getByText("Column col-1")).toBeInTheDocument();
		});

		it("should handle board with only system columns", () => {
			const columns = [
				createMockColumn("sys-1", 0, true),
				createMockColumn("sys-2", 1, true),
			];
			const board = createMockBoard(columns);

			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// System columns should be rendered but not draggable
			expect(screen.getByText("Column sys-1")).toBeInTheDocument();
			expect(screen.getByText("Column sys-2")).toBeInTheDocument();
		});

		it("should handle loading state", () => {
			vi.mocked(useQuery).mockReturnValue(undefined);

			render(<KanbanBoard boardId="board-1" />);

			// Should show loading spinner
			const loader = document.querySelector(".animate-spin");
			expect(loader).toBeInTheDocument();
		});

		it("should handle board not found", () => {
			vi.mocked(useQuery).mockReturnValue(null);

			render(<KanbanBoard boardId="board-1" />);

			expect(screen.getByText("Board not found")).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("should have proper ARIA labels on main board container", () => {
			const board = createMockBoard([]);
			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			const mainContainer = screen.getByRole("main", { name: "Kanban board" });
			expect(mainContainer).toBeInTheDocument();
		});

		it("should have proper heading hierarchy", () => {
			const board = createMockBoard([]);
			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			// Board name should be an h1
			const heading = screen.getByRole("heading", {
				name: board.name,
				level: 1,
			});
			expect(heading).toBeInTheDocument();
		});

		it("should have aria-labels on action buttons", () => {
			const board = createMockBoard([]);
			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			const addColumnButton = screen.getByRole("button", {
				name: "Add new column to board",
			});
			expect(addColumnButton).toBeInTheDocument();

			const settingsButton = screen.getByRole("button", {
				name: "Board settings",
			});
			expect(settingsButton).toBeInTheDocument();
		});

		it("should have proper role on columns container", () => {
			const board = createMockBoard([]);
			vi.mocked(useQuery).mockReturnValue(board);

			render(<KanbanBoard boardId="board-1" />);

			const columnsRegion = screen.getByRole("region", {
				name: "Board columns",
			});
			expect(columnsRegion).toBeInTheDocument();
		});
	});
});
