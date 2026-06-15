/**
 * Demo 1 partial-mock mode: live backend only for the Demo 1 contract scope
 * (auth, personnel admin, profiles, compensation, timesheets).
 * All other API modules are forced to mock/design behaviour.
 */

export type Demo1ApiModule = "auth" | "user" | "adminStaff" | "personnel" | "locations";

export type ApiModule =
  | Demo1ApiModule
  | "locations"
  | "knowledge"
  | "sellings"
  | "adminSoftware";

const DEMO1_LIVE_MODULES: ReadonlySet<Demo1ApiModule> = new Set([
  "auth",
  "user",
  "adminStaff",
  "personnel",
  "locations",
]);

/** Route prefixes that use the live Demo 1 backend integration. */
export const DEMO1_LIVE_ROUTE_PREFIXES = ["/admin-personnel", "/login"] as const;

export function isDemo1Mode(): boolean {
  return import.meta.env.VITE_DEMO1_MODE === "true";
}

export function isDemo1LiveApi(module: Demo1ApiModule): boolean {
  return isDemo1Mode() && DEMO1_LIVE_MODULES.has(module);
}

export function isDemo1LiveRoute(pathname: string): boolean {
  return DEMO1_LIVE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isDemo1DesignRoute(pathname: string): boolean {
  return isDemo1Mode() && !isDemo1LiveRoute(pathname);
}

export function shouldUseMockApiModule(module: ApiModule): boolean {
  if (import.meta.env.VITE_PRESENTATION_MODE === "true") {
    return true;
  }

  if (isDemo1Mode()) {
    if (module === "knowledge" || module === "sellings" || module === "adminSoftware") {
      return true;
    }
    return !isDemo1LiveApi(module);
  }

  if (module === "knowledge") {
    return import.meta.env.VITE_MOCK_KB === "true";
  }

  return import.meta.env.VITE_MOCK_AUTH === "true";
}
