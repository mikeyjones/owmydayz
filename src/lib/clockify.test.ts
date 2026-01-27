import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ClockifyClient,
	type ClockifyProject,
	type ClockifyTimeEntry,
	type ClockifyUser,
} from "./clockify";

describe("ClockifyClient", () => {
	const mockAccessToken = "test-access-token";
	const mockWorkspaceId = "workspace-123";
	const mockUserId = "user-456";

	let client: ClockifyClient;
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		client = new ClockifyClient(mockAccessToken);
		mockFetch = vi.fn();
		global.fetch = mockFetch as any;
	});

	describe("getCurrentUser", () => {
		it("fetches the current user from Clockify API", async () => {
			const mockUser: ClockifyUser = {
				id: mockUserId,
				email: "test@example.com",
				name: "Test User",
				activeWorkspace: mockWorkspaceId,
				defaultWorkspace: mockWorkspaceId,
				status: "ACTIVE",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUser,
			});

			const result = await client.getCurrentUser();

			expect(result).toEqual(mockUser);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.clockify.me/api/v1/user",
				expect.objectContaining({
					headers: expect.objectContaining({
						"X-Api-Key": mockAccessToken,
						"Content-Type": "application/json",
					}),
				}),
			);
		});

		it("throws error when API request fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => "Unauthorized",
			});

			await expect(client.getCurrentUser()).rejects.toThrow(
				"Clockify API error (401): Unauthorized",
			);
		});
	});

	describe("getProjects", () => {
		it("fetches projects for a workspace", async () => {
			const mockProjects: ClockifyProject[] = [
				{
					id: "project-1",
					name: "Project One",
					workspaceId: mockWorkspaceId,
					billable: true,
					color: "#FF5733",
					archived: false,
				},
				{
					id: "project-2",
					name: "Project Two",
					workspaceId: mockWorkspaceId,
					billable: false,
					color: "#33FF57",
					archived: false,
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockProjects,
			});

			const result = await client.getProjects(mockWorkspaceId);

			expect(result).toEqual(mockProjects);
			expect(mockFetch).toHaveBeenCalledWith(
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/projects`,
				expect.objectContaining({
					headers: expect.objectContaining({
						"X-Api-Key": mockAccessToken,
					}),
				}),
			);
		});
	});

	describe("getCurrentTimer", () => {
		it("fetches the current running timer", async () => {
			const mockTimeEntry: ClockifyTimeEntry = {
				id: "entry-1",
				description: "Working on feature",
				projectId: "project-1",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: true,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [mockTimeEntry],
			});

			const result = await client.getCurrentTimer(mockWorkspaceId, mockUserId);

			expect(result).toEqual(mockTimeEntry);
			expect(mockFetch).toHaveBeenCalledWith(
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries?in-progress=true`,
				expect.any(Object),
			);
		});

		it("returns null when no timer is running", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
			});

			const result = await client.getCurrentTimer(mockWorkspaceId, mockUserId);

			expect(result).toBeNull();
		});
	});

	describe("startTimer", () => {
		it("starts a new timer with all options", async () => {
			const mockTimeEntry: ClockifyTimeEntry = {
				id: "entry-1",
				description: "New task",
				projectId: "project-1",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: true,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
				},
			};

			// Mock getCurrentTimer to return no running timer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
			});

			// Mock startTimer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTimeEntry,
			});

			const options = {
				description: "New task",
				projectId: "project-1",
				taskId: "task-1",
				billable: true,
			};

			const result = await client.startTimer(
				mockWorkspaceId,
				mockUserId,
				options,
			);

			expect(result).toEqual(mockTimeEntry);
			// Verify both getCurrentTimer and startTimer were called
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries`,
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"X-Api-Key": mockAccessToken,
					}),
					body: expect.stringContaining('"description":"New task"'),
				}),
			);
		});

		it("starts a timer with default options", async () => {
			const mockTimeEntry: ClockifyTimeEntry = {
				id: "entry-1",
				description: "",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: false,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
				},
			};

			// Mock getCurrentTimer to return no running timer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
			});

			// Mock startTimer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTimeEntry,
			});

			const result = await client.startTimer(mockWorkspaceId, mockUserId);

			expect(result).toEqual(mockTimeEntry);
			// Verify both getCurrentTimer and startTimer were called
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				expect.any(String),
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining('"billable":false'),
				}),
			);
		});

		it("stops any running timer before starting a new one", async () => {
			const runningTimer: ClockifyTimeEntry = {
				id: "running-entry",
				description: "Currently running task",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: false,
				timeInterval: {
					start: "2026-01-20T09:00:00Z",
				},
			};

			const stoppedTimer: ClockifyTimeEntry = {
				...runningTimer,
				timeInterval: {
					start: "2026-01-20T09:00:00Z",
					end: "2026-01-20T10:00:00Z",
				},
			};

			const newTimer: ClockifyTimeEntry = {
				id: "new-entry",
				description: "New task",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: false,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
				},
			};

			// Mock getCurrentTimer to return a running timer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [runningTimer],
			});

			// Mock stopTimer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => stoppedTimer,
			});

			// Mock startTimer
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => newTimer,
			});

			const result = await client.startTimer(mockWorkspaceId, mockUserId, {
				description: "New task",
				stopRunningTimer: true,
			});

			expect(result).toEqual(newTimer);

			// Verify the sequence of calls
			expect(mockFetch).toHaveBeenCalledTimes(3);

			// First call: getCurrentTimer
			expect(mockFetch).toHaveBeenNthCalledWith(
				1,
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries?in-progress=true`,
				expect.any(Object),
			);

			// Second call: stopTimer
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries`,
				expect.objectContaining({
					method: "PATCH",
				}),
			);

			// Third call: startTimer
			expect(mockFetch).toHaveBeenNthCalledWith(
				3,
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries`,
				expect.objectContaining({
					method: "POST",
				}),
			);
		});

		it("starts a timer without stopping when stopRunningTimer is false", async () => {
			const newTimer: ClockifyTimeEntry = {
				id: "new-entry",
				description: "New task",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: false,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => newTimer,
			});

			const result = await client.startTimer(mockWorkspaceId, mockUserId, {
				description: "New task",
				stopRunningTimer: false,
			});

			expect(result).toEqual(newTimer);
			// Should only call startTimer, not getCurrentTimer or stopTimer
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});

	describe("stopTimer", () => {
		it("stops the currently running timer", async () => {
			const mockTimeEntry: ClockifyTimeEntry = {
				id: "entry-1",
				description: "Completed task",
				workspaceId: mockWorkspaceId,
				userId: mockUserId,
				billable: true,
				timeInterval: {
					start: "2026-01-20T10:00:00Z",
					end: "2026-01-20T11:00:00Z",
					duration: "PT1H",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTimeEntry,
			});

			const result = await client.stopTimer(mockWorkspaceId, mockUserId);

			expect(result).toEqual(mockTimeEntry);
			expect(mockFetch).toHaveBeenCalledWith(
				`https://api.clockify.me/api/v1/workspaces/${mockWorkspaceId}/user/${mockUserId}/time-entries`,
				expect.objectContaining({
					method: "PATCH",
					headers: expect.objectContaining({
						"X-Api-Key": mockAccessToken,
					}),
				}),
			);
		});
	});
});
