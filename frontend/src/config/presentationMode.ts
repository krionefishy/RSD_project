/** Presentation / server demo: all data client-side, no API calls. */

export function isPresentationMode(): boolean {
  return import.meta.env.VITE_PRESENTATION_MODE === "true";
}

export function useMockAuth(): boolean {
  return isPresentationMode() || import.meta.env.VITE_MOCK_AUTH === "true";
}

export function useMockKB(): boolean {
  return isPresentationMode() || import.meta.env.VITE_MOCK_KB === "true";
}

export function useMocks(): boolean {
  return useMockAuth() || useMockKB();
}
