import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Note: user, session, account, verification tables are managed by @convex-dev/better-auth component

export default defineSchema({
  // =====================================================
  // User Profile - Extended profile information
  // =====================================================
  userProfiles: defineTable({
    // References the user ID from better-auth (stored as string, not Convex ID)
    userId: v.string(),
    bio: v.optional(v.string()),
    // Subscription fields (extended from user)
    isAdmin: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    plan: v.string(), // "free" | "basic" | "pro"
    subscriptionStatus: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // =====================================================
  // Kanban Board Tables (Personal)
  // =====================================================
  kanbanBoards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(), // References better-auth user ID
    focusMode: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  kanbanColumns: defineTable({
    boardId: v.id("kanbanBoards"),
    name: v.string(),
    position: v.number(),
    isSystem: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_boardId", ["boardId"]),

  kanbanItems: defineTable({
    columnId: v.id("kanbanColumns"),
    boardId: v.id("kanbanBoards"),
    name: v.string(),
    description: v.optional(v.string()),
    importance: v.string(), // "low" | "medium" | "high"
    effort: v.string(), // "small" | "medium" | "big"
    tags: v.array(v.string()),
    position: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_columnId", ["columnId"])
    .index("by_boardId", ["boardId"])
    .index("by_completedAt", ["completedAt"]),

  kanbanItemComments: defineTable({
    itemId: v.id("kanbanItems"),
    userId: v.string(), // References better-auth user ID
    content: v.string(),
    parentCommentId: v.optional(v.id("kanbanItemComments")),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_itemId", ["itemId"])
    .index("by_userId", ["userId"])
    .index("by_parentCommentId", ["parentCommentId"]),

  // =====================================================
  // Team Tables
  // =====================================================
  teams: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(), // References better-auth user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_slug", ["slug"]),

  teamMemberships: defineTable({
    teamId: v.id("teams"),
    userId: v.string(), // References better-auth user ID
    role: v.string(), // "owner" | "admin" | "member"
    joinedAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"])
    .index("by_teamId_userId", ["teamId", "userId"]),

  teamInvitations: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    invitedBy: v.string(), // References better-auth user ID
    role: v.string(), // "owner" | "admin" | "member"
    token: v.string(),
    status: v.string(), // "pending" | "accepted" | "expired"
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // =====================================================
  // Team Board Tables
  // =====================================================
  teamBoards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    teamId: v.id("teams"),
    createdBy: v.string(), // References better-auth user ID
    focusMode: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_createdBy", ["createdBy"]),

  teamColumns: defineTable({
    boardId: v.id("teamBoards"),
    name: v.string(),
    position: v.number(),
    isSystem: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_boardId", ["boardId"]),

  teamItems: defineTable({
    columnId: v.id("teamColumns"),
    boardId: v.id("teamBoards"),
    name: v.string(),
    description: v.optional(v.string()),
    importance: v.string(), // "low" | "medium" | "high"
    effort: v.string(), // "small" | "medium" | "big"
    tags: v.array(v.string()),
    position: v.number(),
    completedAt: v.optional(v.number()),
    createdBy: v.string(), // References better-auth user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_columnId", ["columnId"])
    .index("by_boardId", ["boardId"])
    .index("by_completedAt", ["completedAt"]),

  teamItemComments: defineTable({
    itemId: v.id("teamItems"),
    userId: v.string(), // References better-auth user ID
    content: v.string(),
    parentCommentId: v.optional(v.id("teamItemComments")),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_itemId", ["itemId"])
    .index("by_userId", ["userId"])
    .index("by_parentCommentId", ["parentCommentId"]),
});
