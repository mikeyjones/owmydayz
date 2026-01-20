import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("merges multiple class names", () => {
		const result = cn("foo", "bar", "baz");
		expect(result).toBe("foo bar baz");
	});

	it("handles conditional class names", () => {
		const isActive = true;
		const isDisabled = false;
		const result = cn("base", isActive && "active", isDisabled && "disabled");
		expect(result).toBe("base active");
	});

	it("resolves Tailwind class conflicts by keeping the last one", () => {
		const result = cn("p-4", "p-6");
		expect(result).toBe("p-6");

		const result2 = cn("text-red-500", "text-blue-500");
		expect(result2).toBe("text-blue-500");

		const result3 = cn("bg-white", "bg-black", "text-sm", "text-lg");
		expect(result3).toBe("bg-black text-lg");
	});

	it("handles arrays of class names", () => {
		const result = cn(["foo", "bar"], "baz");
		expect(result).toBe("foo bar baz");

		const result2 = cn(["p-2", "m-2"], ["p-4", "m-4"]);
		expect(result2).toBe("p-4 m-4");
	});

	it("handles undefined and null values", () => {
		const result = cn("foo", undefined, "bar", null, "baz");
		expect(result).toBe("foo bar baz");

		const result2 = cn(undefined, null, undefined);
		expect(result2).toBe("");
	});

	it("deduplicates conflicting Tailwind classes", () => {
		// twMerge deduplicates Tailwind utility conflicts, not arbitrary class names
		const result = cn("px-2", "px-2", "py-4", "py-4");
		expect(result).toBe("px-2 py-4");

		// Multiple margin classes resolve to the last one
		const result2 = cn("m-2", "m-4", "m-2");
		expect(result2).toBe("m-2");
	});
});
