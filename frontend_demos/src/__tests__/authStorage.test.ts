import { describe, it, expect, beforeEach } from "vitest";
import { authStorage } from "../utils/authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    authStorage.clear();
  });

  it("hasTokens returns false when storage is empty", () => {
    expect(authStorage.hasTokens()).toBe(false);
  });

  it("hasTokens returns false when only access token is set", () => {
    authStorage.setAccessToken("access_token_only");
    expect(authStorage.hasTokens()).toBe(false);
  });

  it("hasTokens returns true when both tokens are set", () => {
    authStorage.setAuthSession({
      accessToken: "test_access",
      refreshToken: "test_refresh",
    });
    expect(authStorage.hasTokens()).toBe(true);
  });

  it("clear removes both tokens", () => {
    authStorage.setAuthSession({
      accessToken: "test_access",
      refreshToken: "test_refresh",
    });
    authStorage.clear();
    expect(authStorage.hasTokens()).toBe(false);
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });
});
