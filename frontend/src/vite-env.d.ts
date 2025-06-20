/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_ENABLE_MOCK_API: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extensão para window global
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: any;
      onCommitFiberUnmount?: any;
    };
  }
}
