import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsConfigPaths()],
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: [
			"node_modules",
			"dist",
			".output",
			"convex",
			"**/*.config.*",
			"**/.*/**",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70,
			},
			exclude: [
				"node_modules",
				"dist",
				".output",
				"convex",
				"**/*.config.*",
				"**/*.d.ts",
				"**/types/**",
				"src/routes/**",
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
			],
		},
		pool: "threads",
		// Single thread execution for better test isolation
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
	},
});
