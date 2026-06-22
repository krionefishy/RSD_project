import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { Provider, createStore } from "jotai";
import { useApp } from "../context/AppContext";
import { authStorage } from "../utils/authStorage";
import { authStatusAtom, userAtom } from "../store/atoms";
import type { AppUser } from "../types/user";

// Mock AuthAPI to track server-side logout calls
vi.mock("../api/AuthAPI", () => ({
  AuthAPI: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockUser: AppUser = {
  id: "user-1",
  name: "Test User",
  firstName: "Test",
  lastName: "User",
  role: "seller",
  externalSystemId: "test_seller",
};

describe("useApp logout", () => {
  beforeEach(() => {
    authStorage.clear();
    vi.clearAllMocks();
  });

  it("calls AuthAPI.logout when logout() is invoked", async () => {
    const { AuthAPI } = await import("../api/AuthAPI");

    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(authStatusAtom, "ready");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(Provider, { store }, children);

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });

    // AuthAPI.logout is called (fire-and-forget)
    expect(AuthAPI.logout).toHaveBeenCalledOnce();
  });

  it("clears local state immediately after logout (does not wait for server)", async () => {
    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(authStatusAtom, "ready");
    authStorage.setAuthSession({ accessToken: "acc", refreshToken: "ref" });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(Provider, { store }, children);

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.logout();
    });

    // User is cleared immediately — no waiting for server response
    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe("unauthenticated");
    expect(authStorage.hasTokens()).toBe(false);
  });

  it("clears local state even when AuthAPI.logout rejects", async () => {
    const { AuthAPI } = await import("../api/AuthAPI");
    vi.mocked(AuthAPI.logout).mockRejectedValueOnce(new Error("Network error"));

    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(authStatusAtom, "ready");
    authStorage.setAuthSession({ accessToken: "acc", refreshToken: "ref" });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(Provider, { store }, children);

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.logout();
    });

    // Local state cleared regardless of server error (best-effort)
    expect(result.current.user).toBeNull();
    expect(authStorage.hasTokens()).toBe(false);
  });
});
