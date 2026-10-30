🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0001: Micro-frontends with Module Federation

## Status

Accepted

## Context

CinePulse splits logically into two independent areas: the public catalog (Home, Movies, later TV/Search/Detail) and the user account (Profile, Settings, authentication). These areas have different development cycles and potentially different owning teams. We need an architecture that lets us develop and deploy them independently while presenting them to the user as one app.

Options considered: (1) a single monolithic SPA; (2) micro-frontends with Module Federation; (3) separate apps per route without federation (iframe/redirect).

## Decision

We chose **micro-frontends on `@module-federation/vite`**:

- `apps/host` (port 5000) — a shell with no pages of its own that dynamically loads remote routes.
- `apps/pages-mfe` (5001) and `apps/user-mfe` (5002) — remote modules, each with `exposes: { './routes': './src/routes.tsx' }`.
- The unit of composition is an **array of routes** (`RouteObject[]`), not individual components: the host calls `import('pagesMfe/routes')` / `import('userMfe/routes')` and merges them into a shared router.
- Shared dependencies (`shareScope: 'default'`): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`.
- Hybrid development: remote URLs are overridden via `PAGES_MFE_URL` / `USER_MFE_URL`.

## Consequences

**Pros:**
- Independent development and deployment of each MFE.
- Clear boundaries of responsibility; a minimal contract (only the routes export).
- Local work against a staging remote is possible (hybrid mode).

**Cons / trade-offs:**
- Shared `react`/`react-router-dom` tightly couple versions across MFEs, so upgrades must be coordinated.
- A more complex build (`target: chrome89`, `minify: false`, `cssCodeSplit: false`, `modulePreload: false`) and the need for `merge-dist` for Firebase.
- Extra infrastructure for remote types (`sync-types`, `@mf-types/`).
- Remote loading failures need their own graceful degradation (implemented in `App.tsx` + a shell-level ErrorBoundary).
