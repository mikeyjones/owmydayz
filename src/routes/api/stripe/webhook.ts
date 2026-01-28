// Stripe webhook - TODO: Implement via Convex HTTP actions
// This is a stub that will need to be reimplemented for Convex

import type Stripe from "stripe";
import { createFileRoute } from "@tanstack/react-router";
import { privateEnv } from "~/config/privateEnv";
import { getPlanByPriceId } from "~/lib/plans";
import { stripe } from "~/lib/stripe";
import type { SubscriptionPlan, SubscriptionStatus } from "~/types";
import { updateUserSubscription } from "~/utils/subscription";

export const Route = createFileRoute("/api/stripe/webhook")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				if (!stripe) {
					return Response.json(
						{ received: false, disabled: true },
						{ status: 503 },
					);
				}

				const body = await request.text();
				const sig = request.headers.get("stripe-signature");

				if (!sig) {
					return Response.json(
						{ error: "Missing stripe signature" },
						{ status: 400 },
					);
				}

				let event: any;

				try {
					event = stripe.webhooks.constructEvent(
						body,
						sig,
						privateEnv.STRIPE_WEBHOOK_SECRET,
					);
				} catch (err) {
					console.error("Webhook signature verification failed:", err);
					return Response.json({ error: "Invalid signature" }, { status: 400 });
				}

				console.log("Received Stripe webhook:", event.type);

				try {
					switch (event.type) {
						case "checkout.session.completed":
							await handleCheckoutCompleted(stripe, event.data.object);
							break;

						case "customer.subscription.created":
						case "customer.subscription.updated":
							await handleSubscriptionChange(stripe, event.data.object);
							break;

						case "customer.subscription.deleted":
							await handleSubscriptionDeleted(stripe, event.data.object);
							break;

						default:
							console.log(`Unhandled event type: ${event.type}`);
					}

					return Response.json({ received: true });
				} catch (error) {
					console.error("Error processing webhook:", error);
					return Response.json(
						{ error: "Webhook processing failed" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

async function handleCheckoutCompleted(
	client: Stripe,
	session: any,
) {
	console.log("Handling checkout completed:", session.id);

	const subscription = await client.subscriptions.retrieve(
		session.subscription,
	);

	console.log("Subscription:", subscription);

	// Use item-level billing period (new Stripe API)
	const subscriptionItem = subscription.items.data[0];
	const periodEnd = subscriptionItem?.current_period_end;

	if (!periodEnd || Number.isNaN(periodEnd)) {
		console.error("Invalid item current_period_end:", periodEnd);
		throw new Error("Invalid subscription period end date");
	}

	// TODO: Implement via Convex mutation
	await updateUserSubscription(session.metadata.userId, {
		subscriptionId: subscription.id,
		customerId: subscription.customer as string,
		plan: getPlanByPriceId(subscriptionItem?.price.id)
			?.plan as SubscriptionPlan,
		status: subscription.status as SubscriptionStatus,
		expiresAt: new Date(periodEnd * 1000),
	});

	console.log(`Checkout completed for user ${session.metadata.userId}`);
}

async function handleSubscriptionChange(
	_client: Stripe,
	subscription: any,
) {
	console.log("Handling subscription change:", subscription.id);

	const priceId = subscription.items.data[0]?.price.id;
	const planDetails = getPlanByPriceId(priceId);

	if (!planDetails) {
		console.error("No plan found for price ID:", priceId);
		return;
	}

	// TODO: Look up user by Stripe customer ID in Convex
	console.warn("Subscription change handling not yet implemented in Convex");
}

async function handleSubscriptionDeleted(
	_client: Stripe,
	subscription: any,
) {
	console.log("Handling subscription deleted:", subscription.id);

	// TODO: Look up user by Stripe customer ID in Convex and update
	console.warn("Subscription deletion handling not yet implemented in Convex");
}
