/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_MOCK_AUTH?: string;
  readonly VITE_MOCK_KB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
