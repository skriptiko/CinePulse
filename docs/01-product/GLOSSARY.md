🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Glossary

Key project terms. Most are derived from the code (reliable); the watchlist/auth product terms come from the requirements (2026-07-12 session) and are not implemented in the code yet.

## Architecture terms

- **MFE (Micro-Frontend)** — a self-contained frontend module that is developed and built separately and plugged into a shared shell at runtime. In CinePulse: `pages-mfe` and `user-mfe`.
- **Host (shell)** — the `apps/host` application (port 5000) that loads the remote modules and assembles them into a single application. Contains the layout, top-level routing and the shell-level error boundary.
- **Remote** — an MFE that exposes its modules (`exposes: { './routes': ... }`) for the host to load. In CinePulse the remotes are `pages-mfe` (5001) and `user-mfe` (5002).
- **Module Federation** — a Vite mechanism (`@module-federation/vite`) that lets one application load code from another at runtime via `remoteEntry.js`.
- **Shared dependency** — a dependency that the host and remotes share from a single instance (to avoid duplicating React, etc.). In the configs: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/*`.
- **shareScope / entryGlobalName** — Module Federation parameters that define the shared dependency scope and the global name of the remote entry.
- **Turborepo** — the monorepo task orchestrator (`turbo.json`): caches and parallelizes `build`, `dev`, `lint`, `typecheck`, `sync-types`.
- **pnpm workspace** — the monorepo package manager; the workspace members are listed in `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `functions`).

## Data and integrations

- **TMDB (The Movie Database)** — the external API source of data on movies/TV shows/people ([themoviedb.org](https://www.themoviedb.org/)).
- **Proxy / `tmdbProxy`** — a Firebase Cloud Function (`functions/src/index.ts`) that proxies requests to TMDB, adding the secret token on the backend (the client never sees the token). In dev, the Vite proxy on `/api/tmdb` plays the proxy role.
- **React Query (TanStack Query)** — a server-state caching library. Used together with Suspense.
- **Suspense query** — the `useSuspenseQuery` / `useSuspenseInfiniteQuery` hook: while loading, it suspends the component up to the nearest `<Suspense>`, simplifying loading states.
- **UI model / mapper** — a UI model (`MovieCardData`, `HeroData`, `FeaturedItemData`) is a flat type that a `@repo/ui` domain component takes as a single prop; a mapper (`toMovieCardData`, `toTvCardData`, `toTrendingCardData`, `toHeroData`, `toFeaturedItemData` in `lib/mappers/`) turns a raw TMDB entity into it. Formatting lives in `lib/format.ts`.

## TMDB entities (types in `@repo/api`)

- **Movie / MovieDetails** — a movie (short in lists / full on the detail page).
- **TV / TVDetails** — a TV show.
- **Person / PersonDetails** — a person (actor, director, etc.).
- **Genre** — a genre; genre lists are separate for movies and TV.
- **Trending** — trending items for a time window (`day` / `week`); may mix types (movie/tv/person).
- **Backdrop / Poster / Profile** — TMDB image types in various sizes (`w342`, `w780`, `w1280`, `original`, etc.; context-specific sizes are the `POSTER_SIZE_CARD`, `BACKDROP_SIZE_FEATURED`, `BACKDROP_SIZE_HERO` constants in `@repo/api`); the base URL is `image.tmdb.org/t/p`.
- **PaginatedResponse** — a paged TMDB response (`page`, `total_pages`, `results`).

## Cross-MFE communication (`@repo/events`)

- **Event bus** — a typed event bus (a singleton on `window.__CINEPULSE_EVENT_BUS__`) for communication between MFEs without direct dependencies. API: `createTypedEmitter` / `createTypedListener`. Events are described in `EventMap` (`notification:show`, `mfe:error`, `error:report`).
- **Global store** — global state (`window.__CINEPULSE_STORE__`), a Zustand store: `theme` + `setTheme`; React reads it with `useGlobalStore(selector)`.
- **Error boundary** — a React error-handling boundary. Two levels: **shell-level** (critical failure, application reload) and **module-level** (a single MFE can retry without reloading everything).

## Shared packages

- **`@repo/api`** — TMDB client, endpoints, React Query hooks, types.
- **`@repo/ui`** — design system (components, theme, mappers, provider).
- **`@repo/routes`** — path constants (`ROUTE_PATHS`) and the `RoutePath` type.
- **`@repo/events`** — event bus and global store.
- **`@repo/typescript-config`** — shared TS configs (`base.json`, `react-library.json`).
- **ROUTE_PATHS** — the single source of truth for routing paths (`HOME`, `MOVIES`, `USER_PROFILE`, `USER_SETTINGS`).

## Product terms (watchlist, auth) — from the 2026-07-12 requirements

> Not implemented in the code yet. Source: [PRD](./PRD.md).

- **Watchlist** — a personal viewing tracker; the core of the personal account (`user-mfe`). Available only to a registered user; stored in Firestore.
- **Folder** — a watchlist container that the user creates and names. Supports subfolders nested **up to 6 levels**; the number on each level is unlimited. Behaves like a tag: a title can sit in several folders.
- **Title status** — a separate field on a watchlist title, independent of folders: **watched / planned**.
- **Title** — the generic name for a catalog item that can be added to the watchlist: a movie (`Movie`) or a TV show (`TV`).
- **Firebase Auth** — the authentication provider; in scope: email+password with sign-up (social login is out of scope).
- **Firestore** — Firebase's document database for persistent watchlist storage (folders, membership, statuses). Not in the code yet — a planned architectural change (so far the project has had only the stateless `tmdbProxy`).
- **Definition of Done (DoD)** — the project completion criterion used instead of MVP phasing: all documented pages + profile + a working watchlist ("IMDb-like" TMDB coverage, but not the whole API).
