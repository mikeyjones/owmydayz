import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClockifySettings } from "./ClockifySettings";

// Mock the hooks
vi.mock("~/hooks/useClockify", () => ({
	useClockifyConnection: vi.fn(() => ({
		data: [],
		isLoading: false,
		isConnected: false,
		activeWorkspace: null,
	})),
	useDisconnectClockify: vi.fn(() => ({
		mutate: vi.fn(),
		isPending: false,
	})),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("ClockifySettings", () => {
	it("should render the Clockify Integration panel", () => {
		render(<ClockifySettings />);

		expect(screen.getByText("Clockify Integration")).toBeInTheDocument();
	});

	it("should render the description text", () => {
		render(<ClockifySettings />);

		expect(
			screen.getByText(
				/Connect your Clockify account to automatically track time/i,
			),
		).toBeInTheDocument();
	});

	it("should show 'Not Connected' status when no connection exists", () => {
		render(<ClockifySettings />);

		expect(screen.getByText("Not Connected")).toBeInTheDocument();
		expect(screen.getByText("Connect Clockify")).toBeInTheDocument();
	});
});
