import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider, createStore } from "jotai";
import { RequireAuth } from "../components/auth/RequireAuth";
import { authStatusAtom, userAtom } from "../store/atoms";
import { authStorage } from "../utils/authStorage";
import type { AppUser } from "../types/user";

// Mock UserAPI to prevent real HTTP calls
vi.mock("../api/UserAPI", () => ({
  UserAPI: {
    // Return a forever-pending promise by default so effects don't resolve during initial render tests
    fetchMe: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

// Mock APIClient to prevent real HTTP calls
vi.mock("../api/APIClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

function wrap(ui: React.ReactElement, store = createStore()) {
  return render(
    <MemoryRouter>
      <Provider store={store}>{ui}</Provider>
    </MemoryRouter>,
  );
}

const mockUser: AppUser = {
  id: "user-1",
  name: "Test User",
  firstName: "Test",
  lastName: "User",
  role: "seller",
  externalSystemId: "test_seller",
};

describe("RequireAuth", () => {
  beforeEach(() => {
    authStorage.clear();
    vi.clearAllMocks();
  });

  it("shows PageLoader when status is idle and tokens exist (session restore)", () => {
    // Tokens are present but user not yet loaded (page refresh scenario)
    authStorage.setAuthSession({ accessToken: "access", refreshToken: "refresh" });

    const store = createStore();
    // status defaults to 'idle' — this is exactly the F5 / page refresh state

    wrap(<RequireAuth><div>protected</div></RequireAuth>, store);

    expect(screen.getByText("Загрузка профиля...")).toBeDefined();
    expect(screen.queryByText("protected")).toBeNull();
  });

  it("does NOT redirect to /login when idle with tokens (before bootstrap completes)", () => {
    authStorage.setAuthSession({ accessToken: "access", refreshToken: "refresh" });

    const store = createStore();

    wrap(<RequireAuth><div>protected</div></RequireAuth>, store);

    // PageLoader is shown — no redirect, no protected content
    expect(screen.getByText("Загрузка профиля...")).toBeDefined();
  });

  it("redirects to /login when no tokens and status is unauthenticated", () => {
    // No tokens, explicitly unauthenticated
    const store = createStore();
    store.set(authStatusAtom, "unauthenticated");

    wrap(<RequireAuth><div>protected</div></RequireAuth>, store);

    // Protected content is not rendered (Navigate has taken over)
    expect(screen.queryByText("protected")).toBeNull();
    expect(screen.queryByText("Загрузка профиля...")).toBeNull();
  });

  it("renders children when user is fully authenticated", () => {
    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(authStatusAtom, "ready");

    wrap(<RequireAuth><div>protected content</div></RequireAuth>, store);

    expect(screen.getByText("protected content")).toBeDefined();
  });

  it("redirects to role route when user lacks required role", () => {
    const store = createStore();
    store.set(userAtom, mockUser); // seller role
    store.set(authStatusAtom, "ready");

    // Require admin-po role — seller doesn't have it
    wrap(
      <RequireAuth allowedRoles={["admin-po"]}>
        <div>admin only</div>
      </RequireAuth>,
      store,
    );

    expect(screen.queryByText("admin only")).toBeNull();
  });
});
