import { useCallback, useEffect, useMemo, useRef } from "react";

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
	(...args: Parameters<T>): void;
	/** Immediately execute any pending debounced call */
	flush: () => void;
	/** Cancel any pending debounced call without executing */
	cancel: () => void;
}

/**
 * Creates a debounced version of a callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback with flush and cancel methods
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
	callback: T,
	delay: number,
): DebouncedFunction<T> {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const callbackRef = useRef(callback);
	const pendingArgsRef = useRef<unknown[] | null>(null);

	// Update callback ref when callback changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return useMemo(() => {
		const cancel = () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			pendingArgsRef.current = null;
		};

		const flush = () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			if (pendingArgsRef.current !== null) {
				const args = pendingArgsRef.current;
				pendingArgsRef.current = null;
				callbackRef.current(...args);
			}
		};

		const debouncedFn = (...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			pendingArgsRef.current = args;

			timeoutRef.current = setTimeout(() => {
				pendingArgsRef.current = null;
				callbackRef.current(...args);
			}, delay);
		};

		debouncedFn.flush = flush;
		debouncedFn.cancel = cancel;

		return debouncedFn as DebouncedFunction<T>;
	}, [delay]);
}
