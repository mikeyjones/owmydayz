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
