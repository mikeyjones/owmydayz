import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Register better-auth routes (/api/auth/*) with CORS enabled
// Note: Cannot use "*" wildcard with credentials - must specify exact origins
authComponent.registerRoutes(http, createAuth, {
	cors: {
		// Explicitly list allowed origins for cookie support
		// Wildcard "*" doesn't work with credentials: 'include'
		allowedOrigins: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://localhost:3003",
			// Production (Vercel) – add your custom domain too if you use one
			"https://owmydayz-872h.vercel.app",
		],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["Set-Cookie"],
	},
});

export default http;
