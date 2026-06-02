import { authStorage } from "../utils/authStorage";
import { importRsaPublicKey, rsaEncryptToBase64 } from "../utils/rsaEncrypt";
import { apiClient } from "./APIClient";

interface PublicKeyResponse {
  public_key_pem: string;
}

interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  role: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  role: string;
}

const MOCK_USER = {
  id: "mock-seller-uuid",
  external_system_id: "seller_001",
  role: "seller",
  first_name: "Seller",
  last_name: "User",
};

const MOCK_TOKENS = {
  access_token: "mock_access_token_for_development_only",
  refresh_token: "mock_refresh_token_for_development_only",
  expires_in: 3600,
};

function isMockAuth(): boolean {
  return import.meta.env.VITE_MOCK_AUTH === "true";
}

class AuthAPIImpl {
  private publicKeyPromise: Promise<CryptoKey> | null = null;

  async fetchPublicKey(): Promise<CryptoKey> {
    if (isMockAuth()) {
      throw new Error("Mock auth: no public key needed");
    }
    if (!this.publicKeyPromise) {
      this.publicKeyPromise = (async () => {
        try {
          const response = await apiClient.get<PublicKeyResponse>("/auth/public-key", {
            skipAuth: true,
          });
          return await importRsaPublicKey(response.public_key_pem);
        } catch (err) {
          this.publicKeyPromise = null;
          throw err;
        }
      })();
    }
    return this.publicKeyPromise;
  }

  async encryptPassword(rawPassword: string): Promise<string> {
    const key = await this.fetchPublicKey();
    return rsaEncryptToBase64(rawPassword, key);
  }

  async login(externalSystemId: string, _rawPassword: string): Promise<LoginResult> {
    if (isMockAuth()) {
      // Mock login - accept any credentials
      authStorage.setAuthSession({
        accessToken: MOCK_TOKENS.access_token,
        refreshToken: MOCK_TOKENS.refresh_token,
      });
      return {
        accessToken: MOCK_TOKENS.access_token,
        refreshToken: MOCK_TOKENS.refresh_token,
        expiresIn: MOCK_TOKENS.expires_in,
        userId: MOCK_USER.id,
        role: MOCK_USER.role,
      };
    }

    const encryptedPassword = await this.encryptPassword(_rawPassword);
    const response = await apiClient.post<TokenPairResponse>(
      "/auth/login",
      { external_system_id: externalSystemId.trim(), encrypted_password: encryptedPassword },
      { skipAuth: true },
    );

    authStorage.setAuthSession({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    });

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      userId: response.user_id,
      role: response.role,
    };
  }

  async refresh(): Promise<string | null> {
    if (isMockAuth()) {
      return MOCK_TOKENS.access_token;
    }

    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<TokenPairResponse>(
        "/auth/refresh",
        { refresh_token: refreshToken },
        { skipAuth: true, skipRefresh: true },
      );
      authStorage.setAuthSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      return response.access_token;
    } catch {
      authStorage.clear();
      return null;
    }
  }

  async logout(): Promise<void> {
    if (isMockAuth()) {
      authStorage.clear();
      return;
    }

    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post<void>(
          "/auth/logout",
          { refresh_token: refreshToken },
          { skipRefresh: true },
        );
      } catch {
        /* best effort */
      }
    }
    authStorage.clear();
  }
}

export const AuthAPI = new AuthAPIImpl();
