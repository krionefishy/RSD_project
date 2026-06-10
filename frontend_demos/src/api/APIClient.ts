import { isPresentationMode } from "../config/presentationMode";
import { authStorage } from "../utils/authStorage";

export interface APIErrorDetail {
  code?: string;
  message?: string;
}

export class APIError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly detail: unknown;

  constructor(status: number, message: string, code?: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

type RefreshHandler = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

const API_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");

class APIClientImpl {
  private refreshHandler: RefreshHandler | null = null;
  private unauthorizedHandler: UnauthorizedHandler | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setRefreshHandler(handler: RefreshHandler | null): void {
    this.refreshHandler = handler;
  }

  setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    this.unauthorizedHandler = handler;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", query, body, signal, skipAuth = false, skipRefresh = false } = options;

    if (isPresentationMode()) {
      throw new APIError(
        503,
        `Presentation mode: no network requests (${method} ${path})`,
        "PRESENTATION_NO_NETWORK",
      );
    }

    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (!skipAuth) {
      const token = authStorage.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
    });

    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const parsed = await this.safeParseError(response);
      if (parsed?.code === "TOKEN_EXPIRED" && this.refreshHandler) {
        const newToken = await this.refreshOnce();
        if (newToken) {
          return this.request<T>(path, { ...options, skipRefresh: true });
        }
      }
      this.unauthorizedHandler?.();
      throw new APIError(401, parsed?.message ?? "Unauthorized", parsed?.code, parsed);
    }

    if (!response.ok) {
      const parsed = await this.safeParseError(response);
      throw new APIError(
        response.status,
        parsed?.message ?? response.statusText ?? "Request failed",
        parsed?.code,
        parsed,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  get<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const base = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
    if (!query) return base;
    const search = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      search.append(k, String(v));
    });
    const qs = search.toString();
    if (!qs) return base;
    return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
  }

  private async safeParseError(response: Response): Promise<APIErrorDetail | null> {
    try {
      const data = await response.clone().json();
      const detail = (data as { detail?: unknown }).detail;
      if (detail && typeof detail === "object") {
        const { code, message } = detail as APIErrorDetail;
        return { code, message };
      }
      if (typeof detail === "string") {
        return { message: detail };
      }
      return null;
    } catch {
      return null;
    }
  }

  private refreshOnce(): Promise<string | null> {
    if (!this.refreshHandler) return Promise.resolve(null);
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshHandler().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }
}

export const apiClient = new APIClientImpl();
