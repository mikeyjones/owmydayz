import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FocusItem } from "./FocusItem";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
	default: vi.fn(),
}));

// Mock the Clockify hooks
const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();
let mockIsConnected = false;

vi.mock("~/hooks/useClockify", () => ({
	useClockifyConnection: () => ({
		isConnected: mockIsConnected,
		data: mockIsConnected ? [{ workspaceId: "ws-1" }] : [],
	}),
	useStartTimer: () => ({
		mutate: mockStartTimer,
		isPending: false,
	}),
	useStopTimer: () => ({
		mutate: mockStopTimer,
		isPending: false,
	}),
}));

// Mock item type
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

describe("FocusItem", () => {
	const createMockItem = (overrides?: Partial<NowItem>): NowItem => ({
		_id: "item-1",
		columnId: "col-1",
		boardId: "board-1",
		name: "Test Item",
		description: "Test description",
		importance: "medium",
		effort: "medium",
		tags: [],
		position: 0,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		boardName: "Test Board",
		...overrides,
	});

	const mockOnComplete = vi.fn();
	const mockOnEdit = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockIsConnected = false;
	});

	describe("basic rendering", () => {
		it("should render item name", () => {
			const item = createMockItem({ name: "My Focus Task" });
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			expect(screen.getByText("My Focus Task")).toBeInTheDocument();
		});

		it("should render item description", () => {
			const item = createMockItem({ description: "This is a test description" });
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			expect(screen.getByText("This is a test description")).toBeInTheDocument();
		});

		it("should render board name", () => {
			const item = createMockItem({ boardName: "Work Board" });
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			expect(screen.getByText("Work Board")).toBeInTheDocument();
		});

		it("should render importance badge", () => {
			const item = createMockItem({ importance: "high" });
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			expect(screen.getByText("High")).toBeInTheDocument();
		});
	});

	describe("completion functionality", () => {
		it("should show completion checkbox", () => {
			const item = createMockItem();
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const buttons = screen.getAllByRole("button");
			// First button should be the card itself, second should be the checkbox
			expect(buttons.length).toBeGreaterThan(1);
		});

		it("should call onComplete when checkbox is clicked", () => {
			vi.useFakeTimers();
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Find the checkbox button
			const checkbox = container.querySelector(
				'button[type="button"]:not([aria-label])',
			);
			if (checkbox) {
				fireEvent.click(checkbox);
			}

			// Wait for the animation timeout (600ms)
			vi.advanceTimersByTime(600);

			expect(mockOnComplete).toHaveBeenCalledWith(item._id, item.boardId);
			vi.useRealTimers();
		});
	});

	describe("timer functionality - not connected", () => {
		it("should not show timer UI when Clockify is not connected", () => {
			mockIsConnected = false;
			const item = createMockItem();
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const playButton = screen.queryByLabelText("Start timer");
			expect(playButton).not.toBeInTheDocument();
		});
	});

	describe("timer functionality - connected", () => {
		beforeEach(() => {
			mockIsConnected = true;
		});

		it("should show play button when Clockify is connected and timer is not running", () => {
			const item = createMockItem({
				clockifyTimeEntryId: undefined,
				timerStartedAt: undefined,
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const playButton = screen.getByLabelText("Start timer");
			expect(playButton).toBeInTheDocument();
		});

		it("should show pause button when timer is running", () => {
			const item = createMockItem({
				clockifyTimeEntryId: "entry-1",
				timerStartedAt: Date.now() - 5000, // Started 5 seconds ago
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const pauseButton = screen.getByLabelText("Stop timer");
			expect(pauseButton).toBeInTheDocument();
		});

		it("should call startTimer when play button is clicked", () => {
			mockStartTimer.mockClear();
			const item = createMockItem({
				name: "Test Task",
				clockifyProjectId: "project-1",
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const playButton = screen.getByLabelText("Start timer");
			fireEvent.click(playButton);

			expect(mockStartTimer).toHaveBeenCalledWith({
				itemId: item._id,
				description: "Test Task",
				projectId: "project-1",
			});
		});

		it("should call stopTimer when pause button is clicked", () => {
			mockStopTimer.mockClear();
			const item = createMockItem({
				clockifyTimeEntryId: "entry-1",
				timerStartedAt: Date.now(),
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const pauseButton = screen.getByLabelText("Stop timer");
			fireEvent.click(pauseButton);

			expect(mockStopTimer).toHaveBeenCalledWith({
				itemId: item._id,
			});
		});

		it("should display elapsed time when timer is running", () => {
			const item = createMockItem({
				clockifyTimeEntryId: "entry-1",
				timerStartedAt: Date.now() - 125000, // Started 2:05 ago
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Should show time in MM:SS format
			const timeDisplay = screen.getByText(/2:0[45]/); // Allow for slight timing variation
			expect(timeDisplay).toBeInTheDocument();
		});

		it("should display total time when timer is stopped but has accumulated time", () => {
			const item = createMockItem({
				clockifyTimeEntryId: undefined,
				timerStartedAt: undefined,
				timerTotalSeconds: 150, // 2:30
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const timeDisplay = screen.getByText("2:30");
			expect(timeDisplay).toBeInTheDocument();
		});

		it("should format elapsed time in HH:MM:SS for times over 1 hour", () => {
			const item = createMockItem({
				clockifyTimeEntryId: "entry-1",
				timerStartedAt: Date.now() - 3665000, // 1:01:05 ago
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Should show time in HH:MM:SS format
			const timeDisplay = screen.getByText(/1:01:0[45]/); // Allow for slight timing variation
			expect(timeDisplay).toBeInTheDocument();
		});

		it("should not show elapsed time when timer has never run", () => {
			const item = createMockItem({
				clockifyTimeEntryId: undefined,
				timerStartedAt: undefined,
				timerTotalSeconds: undefined,
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Time display should not be present
			const timeDisplays = screen.queryAllByText(/\d+:\d+/);
			expect(timeDisplays).toHaveLength(0);
		});

		it("should start timer without project ID if not set", () => {
			mockStartTimer.mockClear();
			const item = createMockItem({
				name: "Test Task",
				clockifyProjectId: undefined,
			});
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const playButton = screen.getByLabelText("Start timer");
			fireEvent.click(playButton);

			expect(mockStartTimer).toHaveBeenCalledWith({
				itemId: item._id,
				description: "Test Task",
				projectId: undefined,
			});
		});
	});

	describe("visual states", () => {
		it("should apply hover styles", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const itemElement = container.querySelector(".group");
			expect(itemElement).toHaveClass("hover:bg-card/80");
		});

		it("should show loading spinner when completing", () => {
			const item = createMockItem();
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
					isCompleting={true}
				/>,
			);

			const buttons = screen.getAllByRole("button");
			const checkbox = buttons.find((btn) => !btn.getAttribute("aria-label"));
			const loader = checkbox?.querySelector("svg");
			expect(loader).toHaveClass("animate-spin");
		});

		it("should have cursor pointer", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const itemElement = container.querySelector(".group");
			expect(itemElement).toHaveClass("cursor-pointer");
		});
	});

	describe("click to edit", () => {
		it("should call onEdit when card is clicked", () => {
			const item = createMockItem({ name: "Clickable Task" });
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Click on the main card container (not a child button)
			const card = container.querySelector(".group");
			if (card) {
				fireEvent.click(card);
			}

			expect(mockOnEdit).toHaveBeenCalledWith(item);
		});

		it("should not call onEdit when clicking the checkbox", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			// Find the checkbox button by its class or structure
			const checkbox = container.querySelector(
				'button[type="button"]:not([aria-label])',
			);
			if (checkbox) {
				fireEvent.click(checkbox);
			}

			expect(mockOnEdit).not.toHaveBeenCalled();
		});

		it("should not call onEdit when clicking timer buttons", () => {
			mockIsConnected = true;
			const item = createMockItem();
			render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const timerButton = screen.getByLabelText("Start timer");
			fireEvent.click(timerButton);

			expect(mockOnEdit).not.toHaveBeenCalled();
		});

		it("should call onEdit when Enter key is pressed", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const card = container.querySelector(".group");
			if (card) {
				fireEvent.keyDown(card, { key: "Enter" });
			}

			expect(mockOnEdit).toHaveBeenCalledWith(item);
		});

		it("should call onEdit when Space key is pressed", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const card = container.querySelector(".group");
			if (card) {
				fireEvent.keyDown(card, { key: " " });
			}

			expect(mockOnEdit).toHaveBeenCalledWith(item);
		});

		it("should have tabIndex for keyboard accessibility", () => {
			const item = createMockItem();
			const { container } = render(
				<FocusItem
					item={item}
					onComplete={mockOnComplete}
					onEdit={mockOnEdit}
				/>,
			);

			const card = container.querySelector(".group");
			expect(card).toHaveAttribute("tabIndex", "0");
		});
	});
});
