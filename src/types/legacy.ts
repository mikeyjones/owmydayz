// =====================================================
// Legacy Types - Placeholders for features not yet migrated to Convex
// These will be updated when the respective features are migrated
// =====================================================

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

// Attachment types
export type AttachmentType = "image" | "video" | "file";

export type PostAttachment = {
  id: string;
  postId?: string;
  commentId?: string;
  url: string;
  type: AttachmentType;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: Date;
};

// Portfolio types
export type PortfolioItem = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Module types
export type ModuleContent = {
  id: string;
  moduleId: string;
  title: string;
  type: ModuleContentType;
  content: string;
  order: number;
  createdAt: Date;
};

export type ModuleContentType = "video" | "text" | "quiz" | "assignment" | "task" | "image" | "pdf";

// =====================================================
// Constants
// =====================================================

// Post categories
export const POST_CATEGORIES = [
  "general",
  "question",
  "discussion",
  "announcement",
  "feedback",
  "showcase",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

// Event types
export const EVENT_TYPES = [
  "meeting",
  "workshop",
  "webinar",
  "deadline",
  "reminder",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Module content types
export const MODULE_CONTENT_TYPES = [
  "video",
  "text",
  "task",
  "image",
  "pdf",
] as const;

// Module types
export type ClassroomModuleWithUser = {
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Message types
export type MessageWithSender = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  conversationId: string;
  createdAt: Date;
};

// Member types
export type MemberWithUser = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  role: string;
  joinedAt: Date;
};

// Event types
export type EventWithUser = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  userId: string;
  userName: string;
  userImage: string | null;
  createdAt: Date;
};

// Post types
export type PostWithUser = {
  id: string;
  title: string;
  content: string;
  category: string;
  userId: string;
  userName: string;
  userImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Comment types
export type CommentWithUser = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  postId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Conversation types
export type ConversationWithParticipant = {
  id: string;
  participantId: string;
  participantName: string;
  participantImage: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
};

// Item comment types (for kanban)
export type ItemCommentWithUser = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  itemId: string;
  parentCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
