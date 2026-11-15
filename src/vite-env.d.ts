/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'api' | 'local' | 'auto' — see src/lib/authClient.ts and .env.example */
  readonly VITE_AUTH_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
