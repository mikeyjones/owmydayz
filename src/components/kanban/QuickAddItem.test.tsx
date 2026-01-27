import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuickAddItem } from "./QuickAddItem";

describe("QuickAddItem", () => {
	it("should render the add button initially", () => {
		render(<QuickAddItem onAdd={vi.fn()} />);
		expect(screen.getByText("Add a card")).toBeInTheDocument();
	});

	it("should show the input form when button is clicked", async () => {
		const user = userEvent.setup();
		render(<QuickAddItem onAdd={vi.fn()} />);

		await user.click(screen.getByText("Add a card"));

		expect(
			screen.getByPlaceholderText("Enter a title for this card..."),
		).toBeInTheDocument();
	});

	it("should call onAdd when form is submitted", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Type in the textarea
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "New task");

		// Click the Add card button
		await user.click(screen.getByRole("button", { name: /add card/i }));

		expect(onAdd).toHaveBeenCalledWith("New task");
	});

	it("should submit on Enter key press", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Type in the textarea and press Enter
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "New task{Enter}");

		expect(onAdd).toHaveBeenCalledWith("New task");
	});

	it("should not submit on Shift+Enter", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Type in the textarea and press Shift+Enter
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "New task{Shift>}{Enter}{/Shift}");

		expect(onAdd).not.toHaveBeenCalled();
	});

	it("should close form on Escape key press", async () => {
		const user = userEvent.setup();
		render(<QuickAddItem onAdd={vi.fn()} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Press Escape
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "{Escape}");

		// Form should be closed, button should be visible again
		await waitFor(() => {
			expect(screen.getByText("Add a card")).toBeInTheDocument();
		});
	});

	it("should close form when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(<QuickAddItem onAdd={vi.fn()} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Click cancel button (X icon)
		const cancelButton = screen.getByRole("button", { name: "" }); // X button has no text
		await user.click(cancelButton);

		// Form should be closed, button should be visible again
		await waitFor(() => {
			expect(screen.getByText("Add a card")).toBeInTheDocument();
		});
	});

	it("should clear input but keep form open after submission", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Type and submit
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "New task");
		await user.click(screen.getByRole("button", { name: /add card/i }));

		// Form should still be open but input should be cleared
		expect(
			screen.getByPlaceholderText("Enter a title for this card..."),
		).toBeInTheDocument();
		expect(textarea).toHaveValue("");
	});

	it("should trim whitespace from input", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Type with leading/trailing whitespace
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "  New task  ");
		await user.click(screen.getByRole("button", { name: /add card/i }));

		expect(onAdd).toHaveBeenCalledWith("New task");
	});

	it("should not submit if input is empty or only whitespace", async () => {
		const user = userEvent.setup();
		const onAdd = vi.fn();
		render(<QuickAddItem onAdd={onAdd} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Try to submit empty input
		await user.click(screen.getByRole("button", { name: /add card/i }));
		expect(onAdd).not.toHaveBeenCalled();

		// Try to submit whitespace only
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		await user.type(textarea, "   ");
		await user.click(screen.getByRole("button", { name: /add card/i }));
		expect(onAdd).not.toHaveBeenCalled();
	});

	it("should disable inputs when isPending is true", async () => {
		const user = userEvent.setup();
		render(<QuickAddItem onAdd={vi.fn()} isPending={true} />);

		// Open the form
		await user.click(screen.getByText("Add a card"));

		// Textarea should be disabled
		const textarea = screen.getByPlaceholderText(
			"Enter a title for this card...",
		);
		expect(textarea).toBeDisabled();

		// Buttons should be disabled
		const addButton = screen.getByRole("button", { name: /add card/i });
		expect(addButton).toBeDisabled();
	});
});
