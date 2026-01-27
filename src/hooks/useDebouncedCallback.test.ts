import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useDebouncedCallback } from "./useDebouncedCallback";

describe("useDebouncedCallback", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("should debounce callback execution", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		// Call multiple times
		result.current();
		result.current();
		result.current();

		// Callback should not be called yet
		expect(callback).not.toHaveBeenCalled();

		// Fast forward time
		vi.advanceTimersByTime(500);

		// Callback should be called only once
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test("should pass arguments to callback", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		result.current("arg1", "arg2");

		vi.advanceTimersByTime(500);

		expect(callback).toHaveBeenCalledWith("arg1", "arg2");
	});

	test("should reset timer on subsequent calls", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		result.current();
		vi.advanceTimersByTime(300);

		result.current();
		vi.advanceTimersByTime(300);

		// Should not be called yet (timer was reset)
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(200);

		// Now it should be called
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test("should clean up timeout on unmount", () => {
		const callback = vi.fn();
		const { result, unmount } = renderHook(() =>
			useDebouncedCallback(callback, 500),
		);

		result.current();
		unmount();

		vi.advanceTimersByTime(500);

		// Callback should not be called after unmount
		expect(callback).not.toHaveBeenCalled();
	});

	test("should update callback when it changes", () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();

		const { result, rerender } = renderHook(
			({ cb }) => useDebouncedCallback(cb, 500),
			{
				initialProps: { cb: callback1 },
			},
		);

		result.current();

		// Update callback
		rerender({ cb: callback2 });

		vi.advanceTimersByTime(500);

		// New callback should be called
		expect(callback1).not.toHaveBeenCalled();
		expect(callback2).toHaveBeenCalledTimes(1);
	});
});
