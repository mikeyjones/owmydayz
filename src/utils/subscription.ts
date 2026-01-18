// Stub implementation - subscriptions to be implemented via Convex
// TODO: Implement subscription management in Convex

import type { SubscriptionPlan, SubscriptionStatus } from "~/types";

interface SubscriptionData {
	subscriptionId: string;
	customerId: string;
	plan: SubscriptionPlan;
	status: SubscriptionStatus;
	expiresAt?: Date;
}

export async function updateUserSubscription(
	userId: string,
	subscriptionData: SubscriptionData,
) {
	console.warn("Subscription management not yet implemented in Convex");
	return null;
}

export async function getUserSubscription(userId: string) {
	console.warn("Subscription management not yet implemented in Convex");
	return null;
}

export async function updateUserPlan(userId: string, plan: SubscriptionPlan) {
	console.warn("Subscription management not yet implemented in Convex");
	return null;
}

export function isPlanActive(
	status: SubscriptionStatus | null | undefined,
	expiresAt: Date | null | undefined,
): boolean {
	if (!status) return false;

	// Check if subscription is in an active state
	if (status !== "active") return false;

	// Check if subscription hasn't expired (if expiry date is set)
	if (expiresAt && new Date() > expiresAt) return false;

	return true;
}

export function hasAccess(
	userPlan: SubscriptionPlan,
	requiredPlan: SubscriptionPlan,
): boolean {
	const planHierarchy: Record<SubscriptionPlan, number> = {
		free: 0,
		basic: 1,
		pro: 2,
	};

	return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
}

export function getUploadLimit(plan: SubscriptionPlan): number {
	switch (plan) {
		case "pro":
			return -1; // Unlimited
		case "basic":
			return 50;
		case "free":
		default:
			return 5;
	}
}

export async function cancelUserSubscription(userId: string) {
	console.warn("Subscription management not yet implemented in Convex");
	return null;
}
