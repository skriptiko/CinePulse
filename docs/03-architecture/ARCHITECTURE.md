🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CinePulse architecture

CinePulse is a micro-frontend (MFE) web app: a movie catalog on top of the TMDB API. The architecture rests on three principles:

1. **Independent MFEs** — the public catalog and the user account area are developed and deployed as separate remote modules.
2. **Shared composition through the host** — the shell dynamically loads remote routes and composes them into one app.
3. **Isolated data layer** — all TMDB access is encapsulated in the `@repo/api` package, and the token never reaches the client.

## Topology overview

| App | Role | Port (dev) | Module Federation |
|------------|------|:---:|-------------------|
| `apps/host` | Shell | 5000 | `remotes: pagesMfe, userMfe` |
| `apps/pages-mfe` | Public catalog (Home, Movies) | 5001 | `exposes: ./routes` |
| `apps/user-mfe` | User account (Profile, Settings) | 5002 | `exposes: ./routes` |

The host has no pages of its own: it imports routes from the remote modules in `apps/host/src/App.tsx`:

```ts
const [pagesModule, userModule] = await Promise.all([
  import('pagesMfe/routes'),
  import('userMfe/routes'),
]);
setRemoteRoutes([...pagesModule.routes, ...userModule.routes]);
```

Each remote exposes only a `RouteObject[]` array (`exposes: { './routes': './src/routes.tsx' }`), so the unit of composition is a **route**, not a single component. This is deliberate (see [ADR-0001](./decisions/ADR-0001-micro-frontend-module-federation.md)).

### Federation mechanism

We use `@module-federation/vite`. The host is configured as a consumer (`apps/host/vite.config.ts`) and the MFEs as providers (`apps/*/vite.config.ts`). Remote URLs can be overridden with environment variables for hybrid development:

```
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js
```

**Shared dependencies** (one instance for the whole app, `shareScope: 'default'`):

- `react`, `react-dom` — React 19 ([ADR-0007](./decisions/ADR-0007-react-19.md)); every shared dependency is a `singleton`, and `requiredVersion` comes from the pnpm catalog via `scripts/mf-shared.ts` (`strictVersion` for third-party ones)
- `react-router-dom` — shared router, one `BrowserRouter` in the host
- `@tanstack/react-query` — shared `QueryClient`
- `zustand` — runtime of the global store ([ADR-0008](./decisions/ADR-0008-zustand-global-store.md))
- `@repo/events` — shared event bus and global store
- `@repo/routes` — shared path constants
- `@repo/api` — shared data access layer

Sharing these dependencies is critical: `react` and `react-router-dom` must be single instances, otherwise hooks and the router context break; `@repo/events` must be a single instance so that the event bus and store are truly global (see [ADR-0004](./decisions/ADR-0004-typed-event-bus.md)).

## Monorepo

The project is a monorepo on **Turborepo + pnpm workspaces** (see [ADR-0002](./decisions/ADR-0002-turborepo-pnpm-monorepo.md)). Workspace boundaries are in `pnpm-workspace.yaml`:

```
packages:
  - "apps/*"
  - "packages/*"
  - "functions"
```

Task orchestration is in `turbo.json`: `build` (with `dependsOn: ["^build"]`, cached in `dist/**`), `dev` (persistent, no cache), `lint`, `typecheck`, `sync-types` (generates remote types in the host after build).

**Shared packages:**

| Package | Purpose |
|-------|-------------|
| `@repo/api` | TMDB client, endpoints, React Query hooks, types |
| `@repo/firebase` | Firebase app and Auth session behind dynamic imports; the only importer of the SDK |
| `@repo/ui` | Design system (Shadcn UI + Radix + Tailwind), mappers |
| `@repo/events` | Typed event bus + global store |
| `@repo/routes` | Path constants (`ROUTE_PATHS`) and helpers |
| `@repo/typescript-config` | Shared `tsconfig` files (base, react-library) |

Every MFE and the host are workspace packages and consume these packages via `@repo/*` without publishing to a registry.

## Data flow

Data flows one way: UI component → query factory (`queryOptions`) → endpoint → `apiGet` → proxy → TMDB.

```
Component (Home/Movies)
   │  useSuspenseQuery(movieQueries.row(…)) / useMoviesOrSearch
   ▼
React Query (Suspense)             packages/api/src/queries/*
   │  queryFn → endpoints          packages/api/src/endpoints/*
   ▼
apiGet(endpoint, { params })       packages/api/src/core/client.ts
   │  fetch(`/api/tmdb` + endpoint)
   ▼
Proxy   ── dev:  Vite server.proxy (apps/*/vite.config.ts)
        └─ prod: Firebase Function `tmdbProxy` (functions/src/index.ts)
   │  adds Authorization: Bearer <TMDB_API_READ_TOKEN>
   ▼
TMDB API  https://api.themoviedb.org/3
```

The client always calls the relative path `/api/tmdb/...` (`API_CONFIG.PROXY_BASE_URL`). In production Firebase Hosting rewrites `/api/tmdb/**` to the `tmdbProxy` function; in dev the Vite proxy intercepts the same path. The token is added only on the proxy side (see [ADR-0003](./decisions/ADR-0003-tmdb-proxy.md)).

React Query caches data with `staleTime` 5 minutes and `refetchOnWindowFocus: false`; only network, 5xx and 429 errors are retried, at most twice (`createQueryClient` in `packages/api/src/query-client/`). Lists use infinite queries (`useSuspenseInfiniteQuery`) with the shared `getNextPageParam` (capped at TMDB's 500 pages).

## Cross-MFE communication

MFEs never import from each other. They communicate through `@repo/events`:

- **Event bus** (`packages/events/src/event-bus.ts`) — a typed emitter/listener on top of `window.__CINEPULSE_EVENT_BUS__` (a singleton on `window`). Event types are fixed in `EventMap` (`notification:show`, `mfe:error`, `error:report`).
- **Global store** (`packages/events/src/store.ts`) — a Zustand store, singleton on `window.__CINEPULSE_STORE__`, with `{ theme }` and `setTheme`. React components subscribe with `useGlobalStore(selector)` ([ADR-0008](./decisions/ADR-0008-zustand-global-store.md)).

Keeping the singleton on `window` guarantees a single instance even if federation loads the package twice. The API transport does not emit events; error toasts and reports go through `QueryCache.onError` (see Error handling below).

Model details are in [DATA_MODEL.md](./DATA_MODEL.md), decision details in [ADR-0004](./decisions/ADR-0004-typed-event-bus.md) and [ADR-0008](./decisions/ADR-0008-zustand-global-store.md).

## Error handling

Boundaries are built on `react-error-boundary` (a strict MF singleton) and live in `@repo/ui`:

1. **Page** — every route element of a remote is wrapped in `PageBoundary` (`AsyncBoundary` = `QueryErrorResetBoundary` + `ErrorBoundary` + `Suspense`). Navigation resets it (`resetKeys` and the `Suspense` key are the `pathname`). The fallback is a page skeleton (`MovieGridSkeleton`, `PageSkeleton`), shown after 300 ms. Home does not suspend as a whole: each section has its own `AsyncBoundary`, skeleton and `SectionErrorFallback`, and the page prefetches every row so they load in parallel. Errors go to `PageErrorFallback`: a 404 (`kind: 'not_found'`) renders `NotFound`, anything else a plain-language message with **Try again**, which also resets the failed queries so they refetch.
2. **Shell** — `ShellBoundary` in `apps/host/src/app.tsx`, inside `AppLayout`, so the header survives any error. It offers **Reload** and resets on navigation.

Also:
- **Unknown URL** — the host appends a catch-all `*` route rendering `NotFound` after the remotes' routes.
- **Remote route loading** — `loadRemoteRoutes(REMOTES)` (`apps/host/src/remotes/`) loads each remote independently. A failed remote gets `RemoteUnavailable` ("This section is unavailable" + Try again, which reloads) on the paths listed for it in `REMOTES`, and `mfe:error` is emitted with a serialized error; the other remotes keep working.
- **Stale chunks after a deploy** — `vite:preloadError` triggers one `location.reload()`; the reload time in `sessionStorage` blocks another reload for 60 s, so a really missing chunk cannot loop.
- **API errors** — `ApiError` with `kind` (`network`, `not_found`, `server`, `client`, `validation`), `status` and `cause`; an abort is rethrown unchanged. See [API_SPEC.md](./API_SPEC.md#errors).
- **One channel per error** — `createQueryClient` (`@repo/api`) sets `QueryCache.onError`: every failed query emits `error:report` (`source: 'query'`); a toast (`notification:show`, text from `getErrorMessage`) is emitted only when the query already has data (a failed background refetch), never for a 404 and never when `meta.inlineErrors` is set. Without data the error goes to the page boundary instead. Failed mutations always toast.
- **Toasts** — the host subscribes to `notification:show` and shows it with sonner; its `Toaster` is lazy-loaded, so sonner is not in the initial bundle. Remotes never import sonner.
- **Reporting** — boundaries, `QueryCache`/`MutationCache` and the host's `window` `error` / `unhandledrejection` handlers emit `error:report`. The host's single listener drops expected failures (404, aborts, network errors while offline) and, with no vendor chosen, logs the rest in development only.
- **Offline** — the host shows one global banner while `onlineManager` reports offline; data on screen stays.

## Build and deploy

- **Bundler:** Vite. The production build uses `target: 'chrome89'`, `minify: false`, `cssCodeSplit: false`, `modulePreload: false` (for Module Federation compatibility).
- **Merge dist:** `scripts/merge-dist.js` merges the `dist/` of every app into one folder for Firebase Hosting (`pnpm build:deploy`).
- **Hosting + Functions:** `firebase.json` defines rewrites (`/api/tmdb/**` → `tmdbProxy`, `/pages-mfe/**` and `/user-mfe/**` → their `index.html`, everything else → host `index.html`) and a CORS header for `*.js`.

Pipeline details: [CI_CD.md](../06-deployment/CI_CD.md); environments: [ENVIRONMENTS.md](../06-deployment/ENVIRONMENTS.md).

## Strengths

- Clear separation of responsibilities (shell / MFE / shared packages).
- Independent development and deployment of MFEs; hybrid mode via remote env URLs.
- Safe TMDB access: the token lives only on the proxy.
- End-to-end type safety: typed events, a typed data layer, shared `tsconfig` files.

## Known limitations

- **`new Function` in the Module Federation runtime.** The bundle contains such branches, but the paths we use never reach them: the CSP is enforced without `'unsafe-eval'`, and the production pages load with a clean console (checked 2026-10-30). A runtime upgrade that reaches them would fail under the CSP, and `e2e/smoke.spec.ts` would catch it, because it runs under the same headers.
- Shared dependencies tightly couple the `react`/`react-router-dom` versions across all MFEs, so upgrades must be coordinated.
- There is no separate staging environment; deploys go straight to production (Phase 6).

## ➕ Planned impact of the requirements (2026-07-12)

> The formalized scope (see the [PRD](../01-product/PRD.md)) adds **watchlist + authentication**. This requires new backend components that the current architecture does not have (so far only the stateless `tmdbProxy`). **To be worked out in Phases 3–4:**

- **Firebase Auth** — authentication (Google sign-in, ADR-0010). Connect a real provider to `globalStore` (add the user state back then; it was removed in ADR-0008 because it had no source) and to the `user:login`/`user:logout` events. Gate access to `user-mfe` (watchlist for signed-in users only).
- **Firestore** — persistent watchlist storage (a folder tree up to 6 levels deep, many-to-many title membership, watched/planned status) + security rules (per-user data isolation). This is the project's **first own database**, so update [DATA_MODEL](./DATA_MODEL.md).
- **Impact on data flow:** next to "read-only TMDB through the proxy" comes "read/write user data through the Firestore SDK"; `user-mfe` must keep these two paths separate.
- **Decision:** [ADR-0010](./decisions/ADR-0010-firebase-auth-firestore-watchlist.md) fixes the storage shape and the integration.

## Diagrams

⬜ There are no formal C4 diagrams yet. Below is a text diagram of the composition (replace with C4/sequence diagrams if needed).

```
                         ┌─────────────────────────────┐
                         │         User's browser        │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │      apps/host (shell :5000) │
                         │  BrowserRouter + AppLayout   │
                         │  ShellBoundary (in layout)   │
                         └───────┬─────────────┬────────┘
              import('pagesMfe/routes)   import('userMfe/routes)
                         │                     │
              ┌──────────▼─────────┐ ┌─────────▼──────────┐
              │ pages-mfe (:5001)  │ │  user-mfe (:5002)  │
              │ Home, Movies       │ │ Profile, Settings  │
              │ exposes ./routes   │ │ exposes ./routes   │
              └──────────┬─────────┘ └─────────┬──────────┘
                         │  shared packages (single instance) │
        ┌────────────────┼────────────┬─────────────┬───────┘
        ▼                ▼            ▼             ▼
   @repo/api        @repo/ui    @repo/events   @repo/routes
        │  apiGet('/api/tmdb/...')
        ▼
   ┌──────────────────────────┐   dev → Vite proxy
   │  Proxy  /api/tmdb/**      │───────────────────────┐
   │  prod → tmdbProxy (Fn)    │  + Authorization Bearer│
   └────────────┬─────────────┘                        │
                ▼                                        ▼
         TMDB API (https://api.themoviedb.org/3)  TMDB_API_READ_TOKEN (secret)
```
