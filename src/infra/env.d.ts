interface Env {
  ENVIRONMENT: string;
  LOGIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  DB?: D1Database;
  SESSIONS?: KVNamespace;
  CACHE?: KVNamespace;
  ACCOUNT_ENCRYPTION_KEY?: string;
  ASSETS: Fetcher;
}
