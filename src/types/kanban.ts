// =====================================================
// Clockify Integration Types
// =====================================================

export type ClockifyConnectionId = string;

export type ClockifyConnection = {
	_id: ClockifyConnectionId;
	id: ClockifyConnectionId; // Alias for _id for convenience
	_creationTime: number;
	userId: string;
	workspaceId: string;
	workspaceName: string;
	apiKey: string; // Encrypted API key
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
};

// =====================================================
// Kanban Types (Personal Boards)
// =====================================================

// Base ID types - these match Convex's Id types but can be used as strings
export type KanbanBoardId = string;
export type KanbanColumnId = string;
export type KanbanItemId = string;

export type KanbanBoard = {
	_id: KanbanBoardId;
	id: KanbanBoardId; // Alias for _id for convenience
	_creationTime: number;
	name: string;
	description?: string;
	userId: string;
	focusMode: boolean;
	clockifyDefaultProjectId?: string; // Default Clockify project for new items
	clockifyDefaultClientId?: string; // Default Clockify client for new items
	createdAt: number;
	updatedAt: number;
};

export type KanbanColumn = {
	_id: KanbanColumnId;
	id: KanbanColumnId; // Alias for _id for convenience
	_creationTime: number;
	boardId: KanbanBoardId;
	name: string;
	position: number;
	isSystem: boolean;
	createdAt: number;
	updatedAt: number;
};

export type KanbanItem = {
	_id: KanbanItemId;
	id: KanbanItemId; // Alias for _id for convenience
	_creationTime: number;
	columnId: KanbanColumnId;
	boardId: KanbanBoardId;
	name: string;
	description?: string;
	importance: KanbanImportance;
	effort: KanbanEffort;
	tags: string[];
	position: number;
	completedAt?: number;
	// Clockify timer integration fields
	clockifyProjectId?: string; // Clockify project ID for this item
	clockifyClientId?: string; // Clockify client ID for this item
	clockifyTimeEntryId?: string; // Active Clockify time entry ID
	timerStartedAt?: number; // Timestamp when timer was started
	timerTotalSeconds?: number; // Total accumulated time in seconds
	lastTimerSync?: number; // Last time we synced with Clockify
	createdAt: number;
	updatedAt: number;
};

export type KanbanItemComment = {
	_id: string;
	_creationTime: number;
	itemId: KanbanItemId;
	userId: string;
	content: string;
	parentCommentId?: string;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
};

export type KanbanColumnWithItems = KanbanColumn & {
	items: KanbanItem[];
};

export type KanbanBoardWithColumns = KanbanBoard & {
	columns: KanbanColumnWithItems[];
};

export type NowItemWithBoard = KanbanItem & {
	boardName: string;
};

// =====================================================
// Team Board Types
// =====================================================

export type TeamBoardId = string;
export type TeamColumnId = string;
export type TeamItemId = string;

export type TeamBoard = {
	_id: TeamBoardId;
	id: TeamBoardId; // Alias for _id
	_creationTime: number;
	teamId: string;
	name: string;
	description?: string;
	focusMode: boolean;
	createdBy: string;
	createdAt: number;
	updatedAt: number;
};

export type TeamColumn = {
	_id: TeamColumnId;
	id: TeamColumnId; // Alias for _id
	_creationTime: number;
	boardId: TeamBoardId;
	name: string;
	position: number;
	isSystem: boolean;
	createdAt: number;
	updatedAt: number;
};

export type TeamItem = {
	_id: TeamItemId;
	id: TeamItemId; // Alias for _id
	_creationTime: number;
	columnId: TeamColumnId;
	boardId: TeamBoardId;
	name: string;
	description?: string;
	importance: KanbanImportance;
	effort: KanbanEffort;
	tags: string[];
	position: number;
	assignedTo?: string;
	completedAt?: number;
	createdAt: number;
	updatedAt: number;
};

export type TeamItemComment = {
	_id: string;
	_creationTime: number;
	itemId: TeamItemId;
	userId: string;
	content: string;
	parentCommentId?: string;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
};

export type TeamColumnWithItems = TeamColumn & {
	items: TeamItem[];
};

export type TeamBoardWithColumns = TeamBoard & {
	columns: TeamColumnWithItems[];
	teamName: string;
	teamSlug: string;
};

export type TeamNowItemWithBoard = TeamItem & {
	boardName: string;
	teamName: string;
};

// =====================================================
// Importance and Effort Types
// =====================================================

export type KanbanImportance = "low" | "medium" | "high";
export type KanbanEffort = "small" | "medium" | "big";

export const KANBAN_IMPORTANCE_VALUES = ["low", "medium", "high"] as const;
export const KANBAN_EFFORT_VALUES = ["small", "medium", "big"] as const;
