import { setAuthSession } from "../utils/authStorage";
import { mockCurrentUser } from "../mock/user";

// Mock API for authentication (no backend connection)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AuthAPIClass {
  _saveSession(data) {
    if (!data?.access_token) {
      return;
    }
    setAuthSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user_id,
    });
  }

  async login(email, password) {
    await delay(500);

    // Mock authentication - any email/password works for demo
    const mockResponse = {
      access_token: "mock_access_token_" + Date.now(),
      refresh_token: "mock_refresh_token_" + Date.now(),
      token_type: "bearer",
      expires_in: 3600,
      user_id: 1,
    };

    this._saveSession(mockResponse);

    return {
      accessToken: mockResponse.access_token,
      refreshToken: mockResponse.refresh_token,
      tokenType: mockResponse.token_type,
      expiresIn: mockResponse.expires_in,
      userId: mockResponse.user_id,
    };
  }

  async logout() {
    await delay(300);
    return { success: true };
  }
}

const AuthAPI = new AuthAPIClass();
export default AuthAPI;
