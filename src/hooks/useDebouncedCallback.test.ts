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

	test("flush should immediately execute pending callback", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		result.current("test-arg");

		// Callback should not be called yet
		expect(callback).not.toHaveBeenCalled();

		// Flush pending callback
		result.current.flush();

		// Callback should be called immediately with the arguments
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith("test-arg");

		// Advancing time should not call again
		vi.advanceTimersByTime(500);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test("flush should do nothing if no pending callback", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		// Flush without any pending call
		result.current.flush();

		expect(callback).not.toHaveBeenCalled();
	});

	test("cancel should prevent pending callback from executing", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		result.current("test-arg");

		// Cancel pending callback
		result.current.cancel();

		// Advancing time should not call the callback
		vi.advanceTimersByTime(500);
		expect(callback).not.toHaveBeenCalled();
	});

	test("flush should use latest arguments from most recent call", () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useDebouncedCallback(callback, 500));

		result.current("first");
		result.current("second");
		result.current("third");

		result.current.flush();

		// Should be called with the last arguments
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith("third");
	});
});
