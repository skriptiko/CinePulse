🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0003: TMDB proxy instead of direct client requests

## Status

Accepted

## Context

The app's data comes from the TMDB API, which requires a token (`TMDB_API_READ_TOKEN`). Calling TMDB directly from the browser would inevitably expose the token in the client bundle or network requests, leaking the secret. We need a way to hide the token while keeping the client code simple.

## Decision

All TMDB traffic goes through a **server-side proxy at the relative path `/api/tmdb`**:

- **Production:** Firebase Function `tmdbProxy` (`functions/src/index.ts`, `onRequest`). The token is read via `defineSecret('TMDB_API_READ_TOKEN')`; the function rewrites the path (strips the `/api/tmdb` prefix), adds `Authorization: Bearer <token>` and proxies to `https://api.themoviedb.org/3`. The rewrite `"/api/tmdb/**" → tmdbProxy` is defined in `firebase.json`.
- **Hardening (CIN-52):** the function is a read-only, allowlisted proxy, not an open relay. The rules are pure functions in `functions/src/proxy-rules.ts` (unit-tested):
  - Methods: `GET` and `HEAD` only; anything else → `405` with `Allow: GET, HEAD`.
  - Paths: exactly what `@repo/api` calls — `/movie/{popular|top_rated|upcoming|now_playing}`, `/movie/{id}`, `/tv/{popular|top_rated|on_the_air|airing_today}`, `/tv/{id}`, `/trending/{all|movie|tv|person}/{day|week}`, `/search/{multi|movie|tv|person}`, `/genre/{movie|tv}/list`, `/person/{id}` (numeric ids). Anything else → `404`. A new endpoint in `@repo/api` must be added to the allowlist too.
  - Query: list/trending routes accept only `page` (integer 1..500); search routes require `query` (trimmed, 1..100 chars) plus optional `page`; detail and genre routes accept no params. Unknown, repeated or invalid params → `400` (rejected rather than dropped, so junk params cannot bust the CDN cache). The query string forwarded to TMDB is rebuilt from validated values.
  - Upstream errors are neutral and never forward TMDB bodies: TMDB `404` → `404`; `429` → `503` (+ numeric `Retry-After` if TMDB sent one); 5xx, other 4xx (e.g. `401` for a bad token), network failure or the 10 s upstream timeout → `502 { "error": "Upstream unavailable" }`. A missing token → `500 { "error": "Proxy misconfigured" }`.
  - `Cache-Control`: 2xx → `public, max-age=300, s-maxage=3600` (genre lists: `public, max-age=3600, s-maxage=86400`); every error → `no-store`. Firebase Hosting's CDN honours `s-maxage` for function rewrites, so repeated requests do not invoke the function.
  - `cors: false` (the browser reaches the function same-origin through the Hosting rewrite), `maxInstances: 2`. Logs go through `logger` from `firebase-functions` with the TMDB path and status only (no token, no search query).
  - Cost guard: besides `maxInstances` and CDN caching, a GCP budget alert is configured on the project.
- **Development:** Vite `server.proxy` in `apps/*/vite.config.ts` does the same locally, reading `TMDB_API_READ_TOKEN` from `.env` via `loadEnv`.
- **Client** (`packages/api/src/core`) only ever calls `/api/tmdb/...` (`API_CONFIG.PROXY_BASE_URL`) and knows nothing about the token.

## Consequences

**Pros:**
- The token never reaches the client (neither the bundle nor browser requests).
- The single `/api/tmdb` contract is the same in dev and prod, so client code does not change between environments.
- A central point for caching (CDN via `s-maxage`) and restrictions on the proxy side.

**Cons / trade-offs:**
- An extra network hop (browser → proxy → TMDB).
- Dependency on Firebase Functions (cold starts, quotas).
- The allowlist duplicates the endpoint list of `@repo/api`: a new endpoint returns `404` in production until it is added to `functions/src/proxy-rules.ts` (the Vite dev proxy has no allowlist).
- The secret must be configured separately in each environment (`.env` for Vite and `functions/.secret.local` for the emulator locally, Firebase Secret in production); see [RUNBOOK](../../07-operations/RUNBOOK.md#secrets).
