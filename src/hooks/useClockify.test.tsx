import { describe, expect, it } from "vitest";
import type {
	ClockifyProject,
	ClockifyTimeEntry,
	ClockifyUser,
} from "../lib/clockify";

/**
 * Basic type tests for Clockify hooks
 * Integration tests require full Convex setup and are better done as E2E tests
 */

describe("Clockify Type Safety", () => {
	it("should have correct ClockifyUser type structure", () => {
		const user: ClockifyUser = {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			activeWorkspace: "ws-123",
			defaultWorkspace: "ws-123",
			status: "ACTIVE",
		};

		expect(user.id).toBe("user-123");
		expect(user.email).toBe("test@example.com");
		expect(user.activeWorkspace).toBe("ws-123");
	});

	it("should have correct ClockifyProject type structure", () => {
		const project: ClockifyProject = {
			id: "proj-123",
			name: "Test Project",
			workspaceId: "ws-123",
			billable: true,
			color: "#FF0000",
			archived: false,
		};

		expect(project.id).toBe("proj-123");
		expect(project.name).toBe("Test Project");
		expect(project.billable).toBe(true);
	});

	it("should have correct ClockifyTimeEntry type structure", () => {
		const timeEntry: ClockifyTimeEntry = {
			id: "entry-123",
			description: "Working on feature",
			workspaceId: "ws-123",
			userId: "user-123",
			billable: false,
			timeInterval: {
				start: "2024-01-01T10:00:00Z",
				end: "2024-01-01T11:00:00Z",
			},
		};

		expect(timeEntry.id).toBe("entry-123");
		expect(timeEntry.description).toBe("Working on feature");
		expect(timeEntry.timeInterval.start).toBe("2024-01-01T10:00:00Z");
	});
});

describe("Clockify Hook Exports", () => {
	it("should export all required hooks", async () => {
		const {
			useClockifyConnection,
			useClockifyProjects,
			useStartTimer,
			useStopTimer,
			useDisconnectClockify,
		} = await import("./useClockify");

		expect(useClockifyConnection).toBeDefined();
		expect(useClockifyProjects).toBeDefined();
		expect(useStartTimer).toBeDefined();
		expect(useStopTimer).toBeDefined();
		expect(useDisconnectClockify).toBeDefined();
	});
});
