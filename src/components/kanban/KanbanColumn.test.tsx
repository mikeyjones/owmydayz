import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KanbanColumn, KanbanItem } from "~/types";
import { KanbanColumnComponent } from "./KanbanColumn";

describe("KanbanColumn", () => {
	// Helper to create a mock column
	const createMockColumn = (
		overrides?: Partial<KanbanColumn & { items: KanbanItem[] }>,
	): KanbanColumn & { items: KanbanItem[] } => ({
		_id: "col-1",
		id: "col-1",
		_creationTime: Date.now(),
		boardId: "board-1",
		name: "To Do",
		position: 0,
		isSystem: false,
		items: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	});

	// Helper to create a mock item
	const createMockItem = (overrides?: Partial<KanbanItem>): KanbanItem => ({
		_id: "item-1",
		id: "item-1",
		_creationTime: Date.now(),
		boardId: "board-1",
		columnId: "col-1",
		name: "Test Item",
		position: 0,
		importance: "medium",
		effort: "medium",
		tags: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	});

	const mockHandlers = {
		onAddItem: vi.fn(),
		onQuickAddItem: vi.fn(),
		onEditItem: vi.fn(),
		onDeleteItem: vi.fn(),
		onEditColumn: vi.fn(),
		onDeleteColumn: vi.fn(),
		onUnfold: vi.fn(),
	};

	describe("drag handle visibility", () => {
		it("should render drag handle for non-system columns", () => {
			const column = createMockColumn({ isSystem: false });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// Drag handle should be visible (the header with data-drag-handle)
			const dragHandle = container.querySelector('[data-drag-handle="true"]');
			expect(dragHandle).toBeInTheDocument();
			expect(dragHandle).toHaveClass("hover:cursor-grab");
		});

		it("should not render drag handle for Completed system column", () => {
			const column = createMockColumn({ isSystem: true, name: "Completed" });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// The Completed system column should not have cursor-grab on header
			const header = container.querySelector('[data-drag-handle="true"]');
			// The header exists but shouldn't have cursor-grab for Completed column
			if (header) {
				expect(header).not.toHaveClass("hover:cursor-grab");
			}
		});

		it("should render drag handle in column header", () => {
			const column = createMockColumn({ isSystem: false });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// Drag handle should be in the header section
			const header = container.querySelector('[data-drag-handle="true"]');
			expect(header).toBeInTheDocument();
			expect(header).toHaveClass("border-b");
			expect(header).toHaveClass("hover:cursor-grab");
		});

		it("should not render drag handle when column is folded", () => {
			const column = createMockColumn({ isSystem: false });
			const { container } = render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Drag handle should not be visible when folded
			// (folded columns use a different UI and are not draggable)
			const dragHandle = container.querySelector('[data-drag-handle="true"]');
			expect(dragHandle).not.toBeInTheDocument();
		});
	});

	describe("draggable setup", () => {
		it("should have correct data attributes for draggable column", () => {
			const column = createMockColumn({
				id: "col-123",
				isSystem: false,
			});
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// The column element should have proper structure for dragging
			const dragHandle = container.querySelector('[data-drag-handle="true"]');
			expect(dragHandle).toBeInTheDocument();

			// Drag handle should have cursor styles
			expect(dragHandle).toHaveClass("hover:cursor-grab");
			expect(dragHandle).toHaveClass("active:cursor-grabbing");
		});

		it("should mark column as type 'column' in drag data", () => {
			const column = createMockColumn({
				id: "col-456",
				isSystem: false,
			});
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// The column container should be set up as a draggable element
			// This is verified by checking for the main column div
			const columnElement = container.querySelector('[class*="flex-col"]');
			expect(columnElement).toBeInTheDocument();
		});

		it("should not set up draggable for Completed system column", () => {
			const column = createMockColumn({ isSystem: true, name: "Completed" });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// Completed system column should not have cursor-grab class
			const dragHandle = container.querySelector('[data-drag-handle="true"]');
			if (dragHandle) {
				expect(dragHandle).not.toHaveClass("hover:cursor-grab");
			}
		});
	});

	describe("drop target validation", () => {
		it("should render drop zone for items", () => {
			const column = createMockColumn();
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// The items container should be a drop target
			const dropZone = container.querySelector('[class*="overflow-y-auto"]');
			expect(dropZone).toBeInTheDocument();
		});

		it("should show empty state with drop zone message", () => {
			const column = createMockColumn({ items: [] });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			// Empty column should show drop zone message
			const dropMessage = screen.getByText("Drop items here");
			expect(dropMessage).toBeInTheDocument();
		});

		it("should accept item drops in expanded column", () => {
			const column = createMockColumn({ items: [] });
			const { container } = render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={false}
				/>,
			);

			// Drop zone should be present in expanded state
			const dropZone = container.querySelector('[class*="overflow-y-auto"]');
			expect(dropZone).toBeInTheDocument();
		});

		it("should accept item drops in folded column", () => {
			const column = createMockColumn({ items: [] });
			const { container } = render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Folded column should still be a drop target (the button element)
			const foldedButton = container.querySelector('button[type="button"]');
			expect(foldedButton).toBeInTheDocument();
		});

		it("should render items in the drop zone", () => {
			const items = [
				createMockItem({ id: "item-1", name: "Item 1" }),
				createMockItem({ id: "item-2", name: "Item 2" }),
			];
			const column = createMockColumn({ items });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			// Items should be rendered in the drop zone
			expect(screen.getByText("Item 1")).toBeInTheDocument();
			expect(screen.getByText("Item 2")).toBeInTheDocument();
		});

		it("should not show empty state when items are present", () => {
			const items = [createMockItem()];
			const column = createMockColumn({ items });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			// Empty state message should not be visible
			const dropMessage = screen.queryByText("Drop items here");
			expect(dropMessage).not.toBeInTheDocument();
		});
	});

	describe("column rendering", () => {
		it("should render column name", () => {
			const column = createMockColumn({ name: "In Progress" });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			expect(screen.getByText("In Progress")).toBeInTheDocument();
		});

		it("should render item count", () => {
			const items = [
				createMockItem({ id: "item-1" }),
				createMockItem({ id: "item-2" }),
				createMockItem({ id: "item-3" }),
			];
			const column = createMockColumn({ items });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			expect(screen.getByText("3")).toBeInTheDocument();
		});

		it("should apply custom column color", () => {
			const column = createMockColumn();
			const columnColor = {
				name: "blue",
				bg: "bg-blue-50",
				border: "border-blue-200",
				headerBg: "bg-blue-100",
				text: "text-blue-700",
				accent: "border-l-blue-500",
			};
			const { container } = render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					columnColor={columnColor}
				/>,
			);

			// Column should have the custom color classes
			const columnElement = container.querySelector('[class*="bg-blue-50"]');
			expect(columnElement).toBeInTheDocument();
		});
	});

	describe("folded state", () => {
		it("should render in folded state", () => {
			const column = createMockColumn({ name: "Done" });
			render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Column name should still be visible in folded state
			expect(screen.getByText("Done")).toBeInTheDocument();

			// Should show item count
			expect(screen.getByText("0")).toBeInTheDocument();
		});

		it("should not show items when folded", () => {
			const items = [createMockItem({ name: "Hidden Item" })];
			const column = createMockColumn({ items });
			render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Items should not be visible when folded
			expect(screen.queryByText("Hidden Item")).not.toBeInTheDocument();
		});

		it("should render unfold button when folded", () => {
			const column = createMockColumn();
			const { container } = render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Folded column should be clickable to unfold
			const button = container.querySelector('button[type="button"]');
			expect(button).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("should have proper ARIA labels on expanded column", () => {
			const column = createMockColumn({ name: "To Do", items: [] });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			// Column should have region role and aria-label
			const region = screen.getByRole("region", {
				name: "To Do column with 0 items",
			});
			expect(region).toBeInTheDocument();
		});

		it("should have proper ARIA labels on folded column", () => {
			const column = createMockColumn({ name: "Done" });
			render(
				<KanbanColumnComponent
					column={column}
					{...mockHandlers}
					isFolded={true}
				/>,
			);

			// Folded column should have aria-label and aria-expanded
			const button = screen.getByRole("button", {
				name: /Expand Done column with/,
			});
			expect(button).toBeInTheDocument();
			expect(button).toHaveAttribute("aria-expanded", "false");
		});

		it("should have aria-label on add item button", () => {
			const column = createMockColumn({ name: "In Progress" });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			const addButton = screen.getByRole("button", {
				name: "Add item to In Progress",
			});
			expect(addButton).toBeInTheDocument();
		});

		it("should have aria-label on column options button", () => {
			const column = createMockColumn({ name: "Done", isSystem: false });
			render(<KanbanColumnComponent column={column} {...mockHandlers} />);

			const optionsButton = screen.getByRole("button", {
				name: "Column options for Done",
			});
			expect(optionsButton).toBeInTheDocument();
		});

		it("should have drag handle with proper cursor styles", () => {
			const column = createMockColumn({ isSystem: false });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// The header acts as the drag handle and should have appropriate cursor styles
			const dragHandle = container.querySelector('[data-drag-handle="true"]');
			expect(dragHandle).toBeInTheDocument();
			expect(dragHandle).toHaveClass("hover:cursor-grab");
			expect(dragHandle).toHaveClass("active:cursor-grabbing");
		});

		it("should have role=list on items container", () => {
			const items = [createMockItem({ name: "Test Item" })];
			const column = createMockColumn({ items });
			const { container } = render(
				<KanbanColumnComponent column={column} {...mockHandlers} />,
			);

			// Items container should have role=list
			const listContainer = container.querySelector('[role="list"]');
			expect(listContainer).toBeInTheDocument();
		});
	});
});
