/**
 * Clockify API client library
 * Provides methods to interact with Clockify API for time tracking
 */

const CLOCKIFY_API_BASE = "https://api.clockify.me/api/v1";

export interface ClockifyUser {
	id: string;
	email: string;
	name: string;
	activeWorkspace: string;
	defaultWorkspace: string;
	profilePicture?: string;
	status: string;
}

export interface ClockifyProject {
	id: string;
	name: string;
	workspaceId: string;
	clientId?: string;
	billable: boolean;
	color: string;
	archived: boolean;
}

export interface ClockifyClientData {
	id: string;
	name: string;
	workspaceId: string;
	archived: boolean;
}

export interface ClockifyTimeEntry {
	id: string;
	description: string;
	projectId?: string;
	taskId?: string;
	workspaceId: string;
	userId: string;
	billable: boolean;
	timeInterval: {
		start: string;
		end?: string;
		duration?: string;
	};
}

/**
 * Clockify API client for interacting with Clockify time tracking services
 */
export class ClockifyClient {
	private accessToken: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	/**
	 * Make an authenticated request to the Clockify API
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${CLOCKIFY_API_BASE}${endpoint}`;

		const response = await fetch(url, {
			...options,
			headers: {
				"X-Api-Key": this.accessToken,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Clockify API error (${response.status}): ${errorText}`);
		}

		return response.json();
	}

	/**
	 * Get the current authenticated user
	 */
	async getCurrentUser(): Promise<ClockifyUser> {
		return this.request<ClockifyUser>("/user");
	}

	/**
	 * Get projects for a workspace
	 */
	async getProjects(workspaceId: string): Promise<ClockifyProject[]> {
		return this.request<ClockifyProject[]>(
			`/workspaces/${workspaceId}/projects`,
		);
	}

	/**
	 * Get clients for a workspace
	 */
	async getClients(workspaceId: string): Promise<ClockifyClientData[]> {
		return this.request<ClockifyClientData[]>(
			`/workspaces/${workspaceId}/clients`,
		);
	}

	/**
	 * Get the current running timer for a user
	 */
	async getCurrentTimer(
		workspaceId: string,
		userId: string,
	): Promise<ClockifyTimeEntry | null> {
		const entries = await this.request<ClockifyTimeEntry[]>(
			`/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true`,
		);
		return entries.length > 0 ? entries[0] : null;
	}

	/**
	 * Start a new timer
	 * If stopRunningTimer is true (default), stops any running timer before starting a new one
	 */
	async startTimer(
		workspaceId: string,
		userId: string,
		options: {
			description?: string;
			projectId?: string;
			taskId?: string;
			billable?: boolean;
			stopRunningTimer?: boolean;
		} = {},
	): Promise<ClockifyTimeEntry> {
		// Stop any running timer first if requested (default behavior)
		const shouldStopRunningTimer = options.stopRunningTimer ?? true;
		if (shouldStopRunningTimer) {
			const runningTimer = await this.getCurrentTimer(workspaceId, userId);
			if (runningTimer) {
				await this.stopTimer(workspaceId, userId);
			}
		}

		return this.request<ClockifyTimeEntry>(
			`/workspaces/${workspaceId}/user/${userId}/time-entries`,
			{
				method: "POST",
				body: JSON.stringify({
					start: new Date().toISOString(),
					billable: options.billable ?? false,
					description: options.description ?? "",
					projectId: options.projectId ?? null,
					taskId: options.taskId ?? null,
				}),
			},
		);
	}

	/**
	 * Stop the currently running timer
	 */
	async stopTimer(
		workspaceId: string,
		userId: string,
	): Promise<ClockifyTimeEntry> {
		return this.request<ClockifyTimeEntry>(
			`/workspaces/${workspaceId}/user/${userId}/time-entries`,
			{
				method: "PATCH",
				body: JSON.stringify({
					end: new Date().toISOString(),
				}),
			},
		);
	}
}
