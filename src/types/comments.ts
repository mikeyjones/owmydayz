// =====================================================
// Item Comment Types (for Kanban items)
// =====================================================

export type ItemCommentWithUser = {
  _id: string;
  itemId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  // User info
  userName: string;
  userEmail: string;
  userImage: string | null;
  // Replies
  replies?: ItemCommentWithUser[];
};
