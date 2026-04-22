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

class AuthAPIImpl {
  private publicKeyPromise: Promise<CryptoKey> | null = null;

  async fetchPublicKey(): Promise<CryptoKey> {
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

  async login(email: string, rawPassword: string): Promise<LoginResult> {
    const encryptedPassword = await this.encryptPassword(rawPassword);
    const response = await apiClient.post<TokenPairResponse>(
      "/auth/login",
      { email: email.trim().toLowerCase(), encrypted_password: encryptedPassword },
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
