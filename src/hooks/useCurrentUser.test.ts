import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "~/lib/auth-client";
import { useCurrentUser, useRequireAuth } from "./useCurrentUser";

// Get the mocked authClient
const mockedAuthClient = vi.mocked(authClient);

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated state when no session exists", () => {
    mockedAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("returns authenticated state with user data when session exists", () => {
    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
    };

    mockedAuthClient.useSession.mockReturnValue({
      data: { user: mockUser, session: { id: "session-123" } },
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userId).toBe("user-123");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("returns loading state when session is pending", () => {
    mockedAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("useRequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when requireUserId is called without authentication", () => {
    mockedAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.userId).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(() => result.current.requireUserId()).toThrow(
      "You must be logged in to perform this action"
    );
  });

  it("returns userId when requireUserId is called with authentication", () => {
    const mockUser = {
      id: "user-456",
      name: "Auth User",
      email: "auth@example.com",
    };

    mockedAuthClient.useSession.mockReturnValue({
      data: { user: mockUser, session: { id: "session-456" } },
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.userId).toBe("user-456");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.requireUserId()).toBe("user-456");
  });
});
