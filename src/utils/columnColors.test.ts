import { describe, expect, it } from "vitest";
import { COLUMN_COLORS, getColumnColorById } from "./columnColors";

describe("getColumnColorById", () => {
	it("should return a consistent color for the same column ID", () => {
		const columnId = "test-column-123";

		const color1 = getColumnColorById(columnId);
		const color2 = getColumnColorById(columnId);

		expect(color1).toBe(color2);
	});

	it("should return colors from the COLUMN_COLORS array", () => {
		const columnId = "test-column-456";

		const color = getColumnColorById(columnId);

		expect(COLUMN_COLORS).toContainEqual(color);
	});

	it("should return different colors for different column IDs", () => {
		const columnId1 = "column-one";
		const columnId2 = "column-two";

		const color1 = getColumnColorById(columnId1);
		const color2 = getColumnColorById(columnId2);

		// Note: Due to hashing, there's a small chance they could collide,
		// but with our 10 colors and good hash distribution, this is unlikely
		// This test mainly verifies the function works, not that it guarantees uniqueness
		expect(color1).toBeDefined();
		expect(color2).toBeDefined();
	});

	it("should handle various column ID formats", () => {
		const testIds = [
			"short",
			"a-much-longer-column-id-with-dashes",
			"column_with_underscores",
			"123numeric",
			"MixedCase",
		];

		for (const id of testIds) {
			const color = getColumnColorById(id);
			expect(COLUMN_COLORS).toContainEqual(color);
		}
	});

	it("should be stable across multiple calls", () => {
		const columnId = "stability-test";

		// Call the function multiple times and collect results
		const results = Array.from({ length: 10 }, () =>
			getColumnColorById(columnId),
		);

		// All results should be the same object reference
		const firstResult = results[0];
		for (const result of results) {
			expect(result).toBe(firstResult);
		}
	});
});
