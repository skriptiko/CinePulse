# CLAUDE.md

Guidance for working with the code in this repository.

## Overview

CinePulse is a movie/TV catalog built on TMDB data as a micro-frontend app: Turborepo + pnpm (9.15.4, Node >= 24), Vite 5, React 19 (ADR-0007: `ref` as a prop, no `forwardRef`), `@module-federation/vite`, React Router 7, TanStack Query 5, Tailwind 4 + shadcn/Radix. Project documentation is in English, in `docs/` (conventions: `docs/04-development/CONVENTIONS.md`).

## Project management — Notion

All project management happens in Notion ("CinePulse" hub, https://app.notion.com/p/40880c5f7ed58170bca1efda4e894ce9): roadmap, epics (Now/Next/Later), tasks, resources. The repo has no roadmap or tracker; `docs/` contains only technical documentation.

- Before starting work, find or create a task in the "Tasks" database (Notion MCP) and move it to *In Progress*.
- Commit: `CIN-<number>: …`, where the number = the task ID in Notion.
- After the work, update the task status (and the "Commits" field); a new architectural decision gets an ADR.

## Commands

```bash
pnpm install
pnpm dev                              # all apps (host 5000, pages-mfe 5001, user-mfe 5002)
pnpm --filter @repo/host dev          # a single app (@repo/pages-mfe, @repo/user-mfe)
pnpm build                            # turbo build (tsc + vite build)
pnpm typecheck                        # turbo typecheck (tsc --noEmit in each package)
pnpm lint                             # biome check src/ in each package + JSX-spread ban
pnpm check                            # biome check --write across the whole repo
pnpm --filter @repo/api typecheck     # check a single package
pnpm build:deploy                     # as in CI: build without apps/design + scripts/merge-dist.js → root dist/
pnpm test                             # vitest run across all projects (root vitest.config.ts)
pnpm exec vitest run --project ui     # a single project; pnpm test:coverage — report in coverage/
pnpm size                             # host JS budget (.size-limit.json); run turbo build --filter=@repo/host first
pnpm emulators                        # build:deploy + Firebase Hosting (5010) and Functions (5011) on the demo project
pnpm test:e2e                         # Playwright on the merged dist/ + Auth emulator: run pnpm build:deploy first; needs a global firebase-tools
pnpm test:rules                       # Firestore rules on the emulator: needs Java and a global firebase-tools
```

Verifying changes = `pnpm typecheck` + `pnpm lint` + `pnpm test`. Test stack: ADR-0006, plan: `docs/05-testing/TEST_STRATEGY.md`:
- Vitest 3.2 (not 4+, because of Vite 5), Testing Library, MSW 3, jsdom, axe-core.
- Tests live in `__tests__/<name>.test.ts(x)` next to the code. A project becomes part of the run once it has its own `vitest.config.ts`.
- jsdom projects set `environment: scripts/vitest-jsdom-environment.ts` (jsdom with Node fetch globals); with plain `jsdom`, MSW fails on `AbortSignal`.
- Helpers are in `@repo/test-utils`:
  - `renderWithProviders` (QueryClient with `retry: false` + MemoryRouter, returns `user`);
  - MSW `server` and `handlers`;
  - `buildMovie` / `buildPaginated`;
  - `expectNoA11yViolations`.
- `@repo/api` does not use test-utils (that would be a dependency cycle) and creates its own `setupServer`.
- In MSW 3 the option is called `onUnhandledFrame: 'error'`: MSW silently ignores the old `onUnhandledRequest`.
- Mock the network, not our modules (`vi.mock` for `@repo/api` is forbidden).

The Husky pre-commit hook runs `lint-staged` → `biome check --write --no-errors-on-unmatched` on `*.{js,ts,tsx,json}`; `commit-msg` checks the `CIN-<N>: …` format (≤ 72 characters). Biome (not ESLint/Prettier): single quotes, `;` always, 2 spaces, width 100; errors: `noUnusedImports`/`noUnusedVariables`, `noExplicitAny`, `noNonNullAssertion`, `noDefaultExport` (except `*.config.*`), `useFilenamingConvention` (kebab-case), `useTailwindSortedClasses`, the `a11y` group. Markdown and YAML are excluded. JSX spread (`{...props}`) and `asChild` are forbidden (standards §5.2): Biome does not catch this, so `pnpm lint` also runs `scripts/check-jsx-spread.js`. `@repo/ui` primitives declare `Pick<ComponentProps<…>, …>` with the needed attributes and pass each one explicitly; for a new attribute, add it to the type and the JSX. A Radix trigger is styled with `className={cn(buttonVariants(…), …)}`.

TMDB requires `TMDB_API_READ_TOKEN` in the root `.env` (Vite `loadEnv` reads the repo root); the functions emulator uses `functions/.secret.local` (template: `functions/.secret.local.example`); production uses Firebase Secret Manager.

## Architecture

### Module Federation

- `apps/host` is the shell. `loadRemoteRoutes(REMOTES)` (`src/remotes/`) dynamically imports `pagesMfe/routes` and `userMfe/routes` independently (`Promise.allSettled`): the paths of a remote that failed to load get `RemoteUnavailable` and an `mfe:error` is emitted. For a new remote, add it to `REMOTES` together with its `ROUTE_PATHS`. The `RouteObject[]` arrays are concatenated and rendered via `useRoutes` inside `AppLayout` from `@repo/ui`, wrapped in `ShellBoundary` (react-error-boundary); the last route is `*` → `NotFound`. `vite:preloadError` → one reload (`src/stale-chunk-reload.ts`). Every `element` in the remotes' `routes.tsx` is wrapped in `PageBoundary` (`AsyncBoundary` with `resetKeys`/`Suspense key` = `pathname`, a page skeleton, Retry resets the queries, 404 → `NotFound`).
- `apps/pages-mfe` (public catalog: Home, Movies) and `apps/user-mfe` (account: Profile, Settings) are remotes, each exposing only `./routes` (`src/routes.tsx`). Their `main.tsx` is used **only** for standalone development (with `ApiProvider` + `AppLayout`); in the integration the host takes only `routes`.
- Remote URLs in the host: `PAGES_MFE_URL` / `USER_MFE_URL` (default `http://localhost:500x/remoteEntry.js`; in production, `apps/host/.env.production`, `/pages-mfe/remoteEntry.js`; the host reads env from its own directory, and `vite build` fails without these variables). A staging URL can be set for hybrid development.
- **Shared singletons**: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-error-boundary`, `zustand`, `@repo/events`, `@repo/routes`, `@repo/api`, `@repo/firebase`. The `shared` map for all three `vite.config.ts` files is built by `createMfShared()` in `scripts/mf-shared.ts`: all are `singleton`, and third-party ones also get `strictVersion` with `requiredVersion` from the pnpm catalog. A version mismatch fails with an explicit Federation Runtime error. Add a new shared dependency only there (and to the catalog). `@repo/ui` is deliberately not shared: it holds no state of its own, and each app bundles only the components it uses.
- Remote types for the host are manual declarations in `apps/host/src/@types/remotes/*.d.ts` (plus the generated `apps/host/@mf-types/`). Update them when adding a new remote or export.
- Styles (ADR-0009): Tailwind 4 via `@tailwindcss/vite`. The theme is `@repo/ui/theme.css`; each app's `src/styles/globals.css` imports `tailwindcss`, the theme, and `@source` for what it renders. In the integration only the host's CSS loads: its `@source` covers `packages/ui/src` and both remotes, so host and remotes must deploy together.

### Shared packages (`packages/*`)

Packages are not built for consumption: `exports` point straight to `src/index.ts`. Versions of shared dependencies (react, router, query, TS, vite, MF, tailwind, types) live in the `catalog` in `pnpm-workspace.yaml`, and `package.json` uses `"catalog:"`; the exception is `functions/` (Cloud Build installs it via npm). Dependencies that must be singletons (`react`, `react-router-dom`, `@tanstack/react-query`) go into `peerDependencies` + `devDependencies` in `packages/*`, not `dependencies`; internal packages use `workspace:*`.

- `@repo/routes` — `ROUTE_PATHS` (`as const satisfies`, every path starts with `/`), the single source of truth for paths. Remotes build `routes` from these constants, and `Header`/`Footer` build navigation (existing pages only; `NavLink` provides `aria-current`); dynamic routes are linked with `buildPath.movie(id)` and friends, never by hand.
- `@repo/api` — the TMDB client. All requests go to the relative `/api/tmdb/*` (`apiGet`), the token never reaches the browser: in dev it is the Vite proxy (host and pages-mfe) with a Bearer token, in production a Firebase rewrite to the `tmdbProxy` function (`functions/src/index.ts`; only GET/HEAD and an allowlist of paths/params in `functions/src/proxy-rules.ts`; add a new endpoint in `@repo/api` there too). Layers: `endpoints/` (fetch functions, internal) → `queries/<domain>.ts` (`queryOptions` factories: `movieQueries.row/list/detail`…) → a component calls `useSuspenseQuery(factory)` / `useSuspenseQueries` directly, so pages need `Suspense`. A hook in `hooks/` only when it has logic (`useMoviesOrSearch`). `createQueryClient` (retry only `network`/`server`, ≤ 2) and `ApiProvider` live only in the host and the remotes' standalone `main.tsx`. Errors are `ApiError` with a `kind`; the transport emits no events, and `QueryCache.onError` emits `error:report` and a toast (`notification:show`) only on top of existing data. The host is the only listener: `src/error-channel/` (lazy sonner `Toaster`, report filter, offline banner).
- `@repo/events` — a typed event bus (`EventMap` in `types.ts`; `createTypedEmitter`/`createTypedListener`) and `globalStore`, a Zustand store (`theme`/`setTheme`, ADR-0008; the theme is saved in `localStorage` and `apps/host/public/theme-init.js` applies it before the first paint); in React, `useGlobalStore(selector)` (the selector returns a stable value or is wrapped in `useShallow`). Both are singletons on `window.__CINEPULSE_EVENT_BUS__` / `window.__CINEPULSE_STORE__`, so they work across MFEs. Cross-MFE communication goes only through this package, with no direct imports between `apps/*`.
- `@repo/firebase` — the only importer of the `firebase` SDK (ADR-0010), always dynamically; `firebase` is not in the `shared` map. Config comes from `/__/firebase/init.json` at runtime (a Vite proxy in dev), a `demo-` project talks to the Auth emulator (port 5013). `startAuthSession()` runs before the first render and loads the SDK only if `localStorage` has the session flag; it writes `user`/`authStatus` to `globalStore` and emits `user:login`/`user:logout`. `/auth/login` calls `prepareSignIn()` on mount, because a popup must open right after the click. Protected pages in `user-mfe` are wrapped in `RequireAuth`.
- `@repo/ui` — the design system. shadcn primitives (without spread and `asChild`) are in `components/ui/`; domain components (`MovieCard`, `Hero`, `ContentRow`…), `AppLayout`, boundaries (`AsyncBoundary`, `PageBoundary`, `ShellBoundary`), `NotFound` and page skeletons are in `components/`; TMDB → UI model mappers (`toMovieCardData`, `toHeroData`, `toFeaturedItemData`…) are in `lib/mappers/`, formatting in `lib/format.ts`. Domain components take a single UI model (`MovieCard({ movie })`). Props types (`MovieCardProps`…) are exported from `index.ts`; files are kebab-case.

### Deployment

Pushes to `main`/`develop` and PRs → GitHub Actions jobs `quality` (`pnpm lint` + `pnpm typecheck` + `pnpm test`, install with `--frozen-lockfile`, so the lockfile must be up to date), `size` (reports only) and `rules` (Firestore rules on the emulator); PRs into `main` also run `e2e`. Only a push to `main` continues: `pnpm build:deploy` (build without `apps/design` → `scripts/merge-dist.js`) (host into the root of `dist/`, remotes into `dist/pages-mfe/` and `dist/user-mfe/`) → deploy of Functions, Firestore rules and Firebase Hosting (project `cinepulse-eec15`). Rewrites in `firebase.json`: `/api/tmdb/**` → `tmdbProxy`, SPA fallback for each MFE. When adding a new MFE, update `merge-dist.js`, `firebase.json` and the host's `.env.production`.

`docs/08-design-files/` is a separate Next.js design prototype (a UI reference), not part of the workspace.

## Conventions

- Commits: `CIN-<number>: <short description in the imperative mood>`.
- Dependency updates: Renovate (`renovate.json`): grouped PRs into `develop` every Monday, no automerge; majors only after approval on the Dependency Dashboard and with a separate ticket. Renovate does not touch Node and pnpm.
- All files and folders are kebab-case (`home.tsx`, `use-movies.ts`, `app-routes.tsx`), exports are PascalCase/camelCase. Named exports only (default only in `*.config.*`). A page with local hooks/components is a `pages/<name>/` folder with `<name>-page.tsx`.
- `@repo/api` Suspense hooks do not support `enabled`, so do not pick a hook conditionally (`cond ? useA() : useB()` breaks the rules of hooks). Switch `queryKey`/`queryFn` within a single query (like `useMoviesOrSearch`) or move the variants into separate components.
