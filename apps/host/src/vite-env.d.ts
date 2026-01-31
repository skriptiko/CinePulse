/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly HELLO_MFE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
