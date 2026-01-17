import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig({ mode: "test", command: "serve" }),
  defineConfig({
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
      // Parallelization enabled by default with threads pool
    },
  })
);
