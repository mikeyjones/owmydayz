import { pgTable, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User table - Core user information for authentication
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  isAdmin: boolean("is_admin")
    .$default(() => false)
    .notNull(),
  // Subscription fields
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  plan: text("plan")
    .$default(() => "free")
    .notNull(),
  subscriptionStatus: text("subscription_status"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Session table - Better Auth session management
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Account table - Better Auth OAuth provider accounts
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Verification table - Better Auth email verification
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

// User Profile - Extended profile information
export const userProfile = pgTable(
  "user_profile",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    bio: text("bio"),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("idx_user_profile_id").on(table.id)]
);

// Relations
export const userRelations = relations(user, ({ one }) => ({
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.id],
  }),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.id],
    references: [user.id],
  }),
}));

// Type exports
export type User = typeof user.$inferSelect;
export type CreateUserData = typeof user.$inferInsert;
export type UpdateUserData = Partial<Omit<CreateUserData, "id" | "createdAt">>;

export type UserProfile = typeof userProfile.$inferSelect;
export type CreateUserProfileData = typeof userProfile.$inferInsert;
export type UpdateUserProfileData = Partial<Omit<CreateUserProfileData, "id">>;

// Subscription types
export type SubscriptionPlan = "free" | "basic" | "pro";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | null;

// =====================================================
// Kanban Board Tables
// =====================================================

// Kanban Board - Container for columns and items
export const kanbanBoard = pgTable(
  "kanban_board",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_kanban_board_user_id").on(table.userId)]
);

// Kanban Column - Columns within a board (e.g., "To Do", "In Progress", "Done")
// System columns ('Now' and 'Completed') cannot be deleted, renamed, or reordered
export const kanbanColumn = pgTable(
  "kanban_column",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => kanbanBoard.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isSystem: boolean("is_system")
      .$default(() => false)
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_kanban_column_board_id").on(table.boardId)]
);

// Kanban Item - Individual items/cards within a column
export const kanbanItem = pgTable(
  "kanban_item",
  {
    id: text("id").primaryKey(),
    columnId: text("column_id")
      .notNull()
      .references(() => kanbanColumn.id, { onDelete: "cascade" }),
    boardId: text("board_id")
      .notNull()
      .references(() => kanbanBoard.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    importance: text("importance").notNull().default("medium"), // low, medium, high
    effort: text("effort").notNull().default("medium"), // small, medium, big
    tags: text("tags").array().default([]), // Array of tag strings
    position: integer("position").notNull().default(0),
    completedAt: timestamp("completed_at"), // When item was moved to Completed column
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_kanban_item_column_id").on(table.columnId),
    index("idx_kanban_item_board_id").on(table.boardId),
    index("idx_kanban_item_completed_at").on(table.completedAt),
  ]
);

// Kanban Relations
export const kanbanBoardRelations = relations(kanbanBoard, ({ one, many }) => ({
  user: one(user, {
    fields: [kanbanBoard.userId],
    references: [user.id],
  }),
  columns: many(kanbanColumn),
}));

export const kanbanColumnRelations = relations(kanbanColumn, ({ one, many }) => ({
  board: one(kanbanBoard, {
    fields: [kanbanColumn.boardId],
    references: [kanbanBoard.id],
  }),
  items: many(kanbanItem),
}));

export const kanbanItemRelations = relations(kanbanItem, ({ one }) => ({
  column: one(kanbanColumn, {
    fields: [kanbanItem.columnId],
    references: [kanbanColumn.id],
  }),
  board: one(kanbanBoard, {
    fields: [kanbanItem.boardId],
    references: [kanbanBoard.id],
  }),
}));

// Kanban type exports
export type KanbanBoard = typeof kanbanBoard.$inferSelect;
export type CreateKanbanBoardData = typeof kanbanBoard.$inferInsert;
export type UpdateKanbanBoardData = Partial<Omit<CreateKanbanBoardData, "id" | "createdAt" | "userId">>;

export type KanbanColumn = typeof kanbanColumn.$inferSelect;
export type CreateKanbanColumnData = typeof kanbanColumn.$inferInsert;
export type UpdateKanbanColumnData = Partial<Omit<CreateKanbanColumnData, "id" | "createdAt" | "boardId">>;

export type KanbanItem = typeof kanbanItem.$inferSelect;
export type CreateKanbanItemData = typeof kanbanItem.$inferInsert;
export type UpdateKanbanItemData = Partial<Omit<CreateKanbanItemData, "id" | "createdAt" | "columnId" | "boardId">>;

// Kanban enums
export type KanbanImportance = "low" | "medium" | "high";
export type KanbanEffort = "small" | "medium" | "big";

export const KANBAN_IMPORTANCE_VALUES = ["low", "medium", "high"] as const;
export const KANBAN_EFFORT_VALUES = ["small", "medium", "big"] as const;

// =====================================================
// Team Tables
// =====================================================

// Team roles enum
export const TEAM_ROLE_VALUES = ["owner", "admin", "member"] as const;
export type TeamRole = (typeof TEAM_ROLE_VALUES)[number];

// Team invitation status enum
export const TEAM_INVITATION_STATUS_VALUES = ["pending", "accepted", "expired"] as const;
export type TeamInvitationStatus = (typeof TEAM_INVITATION_STATUS_VALUES)[number];

// Team - Organization that can have members and boards
export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_team_owner_id").on(table.ownerId),
    index("idx_team_slug").on(table.slug),
  ]
);

// Team Membership - Junction table for users in teams with roles
export const teamMembership = pgTable(
  "team_membership",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner, admin, member
    joinedAt: timestamp("joined_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_team_membership_team_id").on(table.teamId),
    index("idx_team_membership_user_id").on(table.userId),
  ]
);

// Team Invitation - Pending email invitations to join a team
export const teamInvitation = pgTable(
  "team_invitation",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // Role to assign when accepted
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending, accepted, expired
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_team_invitation_team_id").on(table.teamId),
    index("idx_team_invitation_email").on(table.email),
    index("idx_team_invitation_token").on(table.token),
  ]
);

// Team Board - Kanban board owned by a team (shared with team members)
export const teamBoard = pgTable(
  "team_board",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_team_board_team_id").on(table.teamId),
    index("idx_team_board_created_by").on(table.createdBy),
  ]
);

// Team Board Column - Columns within a team board
export const teamColumn = pgTable(
  "team_column",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => teamBoard.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isSystem: boolean("is_system")
      .$default(() => false)
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_team_column_board_id").on(table.boardId)]
);

// Team Board Item - Individual items/cards within a team column
export const teamItem = pgTable(
  "team_item",
  {
    id: text("id").primaryKey(),
    columnId: text("column_id")
      .notNull()
      .references(() => teamColumn.id, { onDelete: "cascade" }),
    boardId: text("board_id")
      .notNull()
      .references(() => teamBoard.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    importance: text("importance").notNull().default("medium"),
    effort: text("effort").notNull().default("medium"),
    tags: text("tags").array().default([]),
    position: integer("position").notNull().default(0),
    completedAt: timestamp("completed_at"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_team_item_column_id").on(table.columnId),
    index("idx_team_item_board_id").on(table.boardId),
    index("idx_team_item_completed_at").on(table.completedAt),
  ]
);

// Team Relations
export const teamRelations = relations(team, ({ one, many }) => ({
  owner: one(user, {
    fields: [team.ownerId],
    references: [user.id],
  }),
  memberships: many(teamMembership),
  invitations: many(teamInvitation),
  boards: many(teamBoard),
}));

export const teamMembershipRelations = relations(teamMembership, ({ one }) => ({
  team: one(team, {
    fields: [teamMembership.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMembership.userId],
    references: [user.id],
  }),
}));

export const teamInvitationRelations = relations(teamInvitation, ({ one }) => ({
  team: one(team, {
    fields: [teamInvitation.teamId],
    references: [team.id],
  }),
  inviter: one(user, {
    fields: [teamInvitation.invitedBy],
    references: [user.id],
  }),
}));

export const teamBoardRelations = relations(teamBoard, ({ one, many }) => ({
  team: one(team, {
    fields: [teamBoard.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [teamBoard.createdBy],
    references: [user.id],
  }),
  columns: many(teamColumn),
}));

export const teamColumnRelations = relations(teamColumn, ({ one, many }) => ({
  board: one(teamBoard, {
    fields: [teamColumn.boardId],
    references: [teamBoard.id],
  }),
  items: many(teamItem),
}));

export const teamItemRelations = relations(teamItem, ({ one }) => ({
  column: one(teamColumn, {
    fields: [teamItem.columnId],
    references: [teamColumn.id],
  }),
  board: one(teamBoard, {
    fields: [teamItem.boardId],
    references: [teamBoard.id],
  }),
  creator: one(user, {
    fields: [teamItem.createdBy],
    references: [user.id],
  }),
}));

// Team type exports
export type Team = typeof team.$inferSelect;
export type CreateTeamData = typeof team.$inferInsert;
export type UpdateTeamData = Partial<Omit<CreateTeamData, "id" | "createdAt" | "ownerId">>;

export type TeamMembership = typeof teamMembership.$inferSelect;
export type CreateTeamMembershipData = typeof teamMembership.$inferInsert;

export type TeamInvitation = typeof teamInvitation.$inferSelect;
export type CreateTeamInvitationData = typeof teamInvitation.$inferInsert;

export type TeamBoard = typeof teamBoard.$inferSelect;
export type CreateTeamBoardData = typeof teamBoard.$inferInsert;
export type UpdateTeamBoardData = Partial<Omit<CreateTeamBoardData, "id" | "createdAt" | "teamId" | "createdBy">>;

export type TeamColumn = typeof teamColumn.$inferSelect;
export type CreateTeamColumnData = typeof teamColumn.$inferInsert;
export type UpdateTeamColumnData = Partial<Omit<CreateTeamColumnData, "id" | "createdAt" | "boardId">>;

export type TeamItem = typeof teamItem.$inferSelect;
export type CreateTeamItemData = typeof teamItem.$inferInsert;
export type UpdateTeamItemData = Partial<Omit<CreateTeamItemData, "id" | "createdAt" | "columnId" | "boardId" | "createdBy">>;
