import {
  isDemo1DesignRoute,
  isDemo1Mode,
  shouldUseMockApiModule,
  type ApiModule,
} from "./demo1Mode";

export {
  isDemo1Mode,
  isDemo1LiveApi,
  isDemo1LiveRoute,
  isDemo1DesignRoute,
  DEMO1_LIVE_ROUTE_PREFIXES,
  shouldUseMockApiModule,
} from "./demo1Mode";
export type { ApiModule, Demo1ApiModule } from "./demo1Mode";

export function isPresentationMode(): boolean {
  return import.meta.env.VITE_PRESENTATION_MODE === "true";
}

/** Whether the given API module should use mock data instead of the backend. */
export function useMockApiModule(module: ApiModule): boolean {
  return shouldUseMockApiModule(module);
}

/**
 * Legacy helper — prefer `useMockApiModule('auth' | 'user' | …)` per API class.
 * True when auth-related modules are mocked (presentation mode or VITE_MOCK_AUTH).
 */
export function useMockAuth(): boolean {
  return useMockApiModule("auth");
}

export function useMockKB(): boolean {
  return useMockApiModule("knowledge");
}

export function useMockSales(): boolean {
  return useMockApiModule("sellings") || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin-po"));
}

export function useMocks(): boolean {
  return useMockKB() || useMockAuth() || useMockSales();
}

/** Presentation-style UI — full presentation mode or a non-live route in demo1 mode. */
export function isDesignDemoExperience(pathname?: string): boolean {
  if (isPresentationMode()) return true;
  if (!pathname || !isDemo1Mode()) return false;
  return isDemo1DesignRoute(pathname);
}
