import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KanbanItem } from "~/types";
import { KanbanItemCard } from "./KanbanItem";

// Mock the useKanbanItemCommentCount hook
vi.mock("~/hooks/useItemComments", () => ({
	useKanbanItemCommentCount: () => ({ data: 0 }),
}));

describe("KanbanItemCard", () => {
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
		onEdit: vi.fn(),
		onDelete: vi.fn(),
	};

	describe("accessibility", () => {
		it("should have proper ARIA labels on item card", () => {
			const item = createMockItem({
				name: "Test Task",
				description: "Test description",
			});
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			// Item should have article role and aria-label
			const article = screen.getByRole("article");
			expect(article).toBeInTheDocument();
			expect(article).toHaveAttribute("aria-label");
			expect(article.getAttribute("aria-label")).toContain("Test Task");
			expect(article.getAttribute("aria-label")).toContain("Test description");
		});

		it("should have aria-label on options button", () => {
			const item = createMockItem({ name: "Options Item" });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			const optionsButton = screen.getByRole("button", {
				name: "More options for Options Item",
			});
			expect(optionsButton).toBeInTheDocument();
		});

		it("should have focus styles", () => {
			const item = createMockItem();
			const { container } = render(
				<KanbanItemCard item={item} {...mockHandlers} />,
			);

			const article = container.querySelector('[role="article"]');
			expect(article).toHaveClass("focus:outline-none");
			expect(article).toHaveClass("focus:ring-2");
			expect(article).toHaveClass("focus:ring-primary/50");
		});

		it("should have hover styles", () => {
			const item = createMockItem();
			const { container } = render(
				<KanbanItemCard item={item} {...mockHandlers} />,
			);

			const article = container.querySelector('[role="article"]');
			expect(article).toHaveClass("hover:shadow-md");
			expect(article).toHaveClass("hover:border-primary/30");
			expect(article).toHaveClass("hover:bg-accent/5");
		});

		it("should have cursor grab for dragging", () => {
			const item = createMockItem();
			const { container } = render(
				<KanbanItemCard item={item} {...mockHandlers} />,
			);

			const article = container.querySelector('[role="article"]');
			expect(article).toHaveClass("hover:cursor-grab");
			expect(article).toHaveClass("active:cursor-grabbing");
		});
	});

	describe("keyboard navigation", () => {
		it("should handle Space key to edit item", () => {
			const item = createMockItem({ name: "Keyboard Item" });
			const onEdit = vi.fn();
			render(
				<KanbanItemCard
					item={item}
					onEdit={onEdit}
					onDelete={mockHandlers.onDelete}
				/>,
			);

			const article = screen.getByRole("article");
			fireEvent.keyDown(article, { key: " " });

			expect(onEdit).toHaveBeenCalledWith(item);
		});

		it("should handle Enter key to edit item", () => {
			const item = createMockItem({ name: "Keyboard Item" });
			const onEdit = vi.fn();
			render(
				<KanbanItemCard
					item={item}
					onEdit={onEdit}
					onDelete={mockHandlers.onDelete}
				/>,
			);

			const article = screen.getByRole("article");
			fireEvent.keyDown(article, { key: "Enter" });

			expect(onEdit).toHaveBeenCalledWith(item);
		});

		it("should not trigger edit on other keys", () => {
			const item = createMockItem();
			const onEdit = vi.fn();
			render(
				<KanbanItemCard
					item={item}
					onEdit={onEdit}
					onDelete={mockHandlers.onDelete}
				/>,
			);

			const article = screen.getByRole("article");
			fireEvent.keyDown(article, { key: "a" });
			fireEvent.keyDown(article, { key: "Escape" });
			fireEvent.keyDown(article, { key: "Tab" });

			expect(onEdit).not.toHaveBeenCalled();
		});
	});

	describe("visual feedback", () => {
		it("should show opacity when dragging", () => {
			const item = createMockItem();
			const { container } = render(
				<KanbanItemCard item={item} {...mockHandlers} isDragging={true} />,
			);

			const article = container.querySelector('[role="article"]');
			expect(article).toHaveClass("opacity-50");
		});

		it("should display importance badge", () => {
			const item = createMockItem({ importance: "high" });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("High")).toBeInTheDocument();
		});

		it("should display effort badge", () => {
			const item = createMockItem({ effort: "small" });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("S")).toBeInTheDocument();
		});
	});

	describe("rendering", () => {
		it("should render item name", () => {
			const item = createMockItem({ name: "My Task" });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("My Task")).toBeInTheDocument();
		});

		it("should render item description when present", () => {
			const item = createMockItem({ description: "Task description" });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("Task description")).toBeInTheDocument();
		});

		it("should not render description element when description is empty", () => {
			const item = createMockItem({ description: undefined });
			const { container } = render(
				<KanbanItemCard item={item} {...mockHandlers} />,
			);

			const description = container.querySelector(
				'p[class*="text-muted-foreground"]',
			);
			expect(description).not.toBeInTheDocument();
		});

		it("should render tags when present", () => {
			const item = createMockItem({ tags: ["frontend", "urgent"] });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("frontend")).toBeInTheDocument();
			expect(screen.getByText("urgent")).toBeInTheDocument();
		});

		it("should limit visible tags to 2", () => {
			const item = createMockItem({ tags: ["tag1", "tag2", "tag3", "tag4"] });
			render(<KanbanItemCard item={item} {...mockHandlers} />);

			expect(screen.getByText("tag1")).toBeInTheDocument();
			expect(screen.getByText("tag2")).toBeInTheDocument();
			expect(screen.getByText("+2")).toBeInTheDocument();
		});
	});
});
