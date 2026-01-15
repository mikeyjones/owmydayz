import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, getAuthenticatedUser } from "./auth";

// =====================================================
// User Profile Queries
// =====================================================

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return user;
  },
});

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .first();
    
    return profile;
  },
});

export const isUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .first();
    
    return profile?.isAdmin ?? false;
  },
});

// =====================================================
// User Profile Mutations
// =====================================================

export const createOrUpdateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .first();
    
    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        bio: args.bio,
        updatedAt: Date.now(),
      });
      return existingProfile._id;
    }
    
    const profileId = await ctx.db.insert("userProfiles", {
      userId: user.id,
      bio: args.bio,
      isAdmin: false,
      plan: "free",
      updatedAt: Date.now(),
    });
    
    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      bio: args.bio,
      updatedAt: Date.now(),
    });
    
    return profile._id;
  },
});

// =====================================================
// Subscription Mutations (for Stripe webhook)
// =====================================================

export const updateSubscription = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    plan: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Note: This should be called from a Convex action that handles Stripe webhooks
    // In production, you'd want to verify this is called from a trusted source
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile) {
      // Create profile if it doesn't exist
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        isAdmin: false,
        plan: args.plan ?? "free",
        stripeCustomerId: args.stripeCustomerId,
        subscriptionId: args.subscriptionId,
        subscriptionStatus: args.subscriptionStatus,
        subscriptionExpiresAt: args.subscriptionExpiresAt,
        updatedAt: Date.now(),
      });
      return;
    }
    
    await ctx.db.patch(profile._id, {
      stripeCustomerId: args.stripeCustomerId ?? profile.stripeCustomerId,
      subscriptionId: args.subscriptionId ?? profile.subscriptionId,
      plan: args.plan ?? profile.plan,
      subscriptionStatus: args.subscriptionStatus ?? profile.subscriptionStatus,
      subscriptionExpiresAt: args.subscriptionExpiresAt ?? profile.subscriptionExpiresAt,
      updatedAt: Date.now(),
    });
  },
});

export const setStripeCustomerId = mutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .first();
    
    if (!profile) {
      await ctx.db.insert("userProfiles", {
        userId: user.id,
        isAdmin: false,
        plan: "free",
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
      return;
    }
    
    await ctx.db.patch(profile._id, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
  },
});
