import Stripe from "stripe";
import { privateEnv } from "~/config/privateEnv";

const secret = privateEnv.STRIPE_SECRET_KEY?.trim();
export const stripe: Stripe | null = secret
	? new Stripe(secret, { apiVersion: "2025-12-15.clover" })
	: null;
