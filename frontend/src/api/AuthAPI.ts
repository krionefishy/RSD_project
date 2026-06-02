import { useMockAuth } from "../config/presentationMode";
import { getMockUserByExternalId } from "../mock/mockUsers";
import { authStorage } from "../utils/authStorage";
import { toBackendRole } from "../utils/roleMap";
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

const MOCK_TOKENS = {
  access_token: "mock_access_token_for_development_only",
  refresh_token: "mock_refresh_token_for_development_only",
  expires_in: 3600,
};

class AuthAPIImpl {
  private publicKeyPromise: Promise<CryptoKey> | null = null;

  async fetchPublicKey(): Promise<CryptoKey> {
    if (useMockAuth()) {
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
    if (useMockAuth()) {
      const user = getMockUserByExternalId(externalSystemId.trim());
      authStorage.setAuthSession({
        accessToken: MOCK_TOKENS.access_token,
        refreshToken: MOCK_TOKENS.refresh_token,
      });
      return {
        accessToken: MOCK_TOKENS.access_token,
        refreshToken: MOCK_TOKENS.refresh_token,
        expiresIn: MOCK_TOKENS.expires_in,
        userId: user.id,
        role: toBackendRole(user.role),
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
    if (useMockAuth()) {
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
    if (useMockAuth()) {
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
