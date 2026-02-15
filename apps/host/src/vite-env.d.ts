/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PAGES_MFE_URL?: string;
  readonly USER_MFE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
