🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CONVENTIONS — Development conventions

## Monorepo structure

```
apps/       host (5000), pages-mfe (5001), user-mfe (5002)
packages/   api, ui, routes, events, firebase, test-utils, typescript-config
functions/  Firebase Cloud Functions (tmdbProxy)
firestore/  Firestore security rules and their tests
e2e/        Playwright specs
```

Packages are consumed via `@repo/*` aliases (`@repo/api`, `@repo/ui`, `@repo/routes`, `@repo/events`, `@repo/firebase`, `@repo/test-utils`, `@repo/typescript-config`). Apps: `@repo/host`, `@repo/pages-mfe`, `@repo/user-mfe`, `@repo/functions`.

## Naming

- Component files in `@repo/ui` are **kebab-case** (`movie-card.tsx`, `content-row.tsx`); the exported component is **PascalCase** (`MovieCard`).
- Every file and folder is **kebab-case**, pages included. A page with local hooks or components is a `pages/<name>/` folder with `<name>-page.tsx` (`pages/home/home-page.tsx`, `pages/movie-detail/movie-detail-page.tsx`); the exported component is PascalCase (`Home`, `MovieDetail`).
- Hooks are `useXxx` (`useMoviesOrSearch`, `useCatalogFilters`); query factories are `<domain>Queries` (`movieQueries`).
- Shared constants are `SCREAMING_SNAKE` (`ROUTE_PATHS`, `API_CONFIG`).

## Linting and formatting

The single tool is **Biome** (`biome.json`); it replaces ESLint + Prettier.

Formatting:
- quotes — **single** (`quoteStyle: single`)
- semicolons — **always** (`semicolons: always`)
- indent — **2 spaces**
- line width — **100**
- trailing commas — `es5`
- import sorting — enabled (`organizeImports`)

Key linter rules:
- `noExplicitAny` — **warn**
- `noUnusedImports` — **error**
- `noUnusedVariables` — **error**
- `noNonNullAssertion` — **warn**
- `useConst` — **error**
- `noUselessFragments` — **warn**

Git hooks (**Husky**): `.husky/pre-commit` → `pnpm lint-staged`, which runs `biome check --apply` on `*.{js,ts,tsx,json}`. So code is automatically checked/fixed before each commit.

Manual commands: `pnpm lint`, `pnpm format`, `pnpm check`, `pnpm typecheck`.

## TypeScript

Shared configs live in `@repo/typescript-config`:
- `base.json` — base strict config
- `react-library.json` — for React packages

Each package/app extends the relevant config in its own `tsconfig.json`. `*.d.ts` files (including the generated `@mf-types`) are excluded from Biome.

## Routing

The single source of truth for paths is `ROUTE_PATHS` in `@repo/routes`:

```ts
HOME '/', MOVIES '/movies', TV '/tv', MOVIE_DETAIL '/movies/:id', TV_DETAIL '/tv/:id', PERSON_DETAIL '/person/:id', SEARCH '/search', AUTH_LOGIN '/auth/login', USER '/user', USER_PROFILE '/user/profile', USER_SETTINGS '/user/settings', USER_WATCHLIST '/user/watchlist'
```

Each MFE exposes a `routes` array (`RouteObject[]`) through Module Federation (`exposes: { './routes': './src/routes.tsx' }`); the host collects them and renders them via `useRoutes`.

Dynamic routes are linked with `buildPath.movie(id)` and friends, never by hand. Movie Detail `/movies/:id`, TV Detail `/tv/:id` and Person `/person/:id` read the parameter with `useParams` and `parseRouteId` (`apps/pages-mfe/src/lib/`), and anything but a positive integer reaches `NotFound`. A new one also goes into the paths of its remote in `apps/host/src/remotes/remotes.ts`.

## MFE pattern (Module Federation)

- A **remote** exposes `./routes`; the **host** imports them dynamically (`import('pagesMfe/routes')`).
- **Shared** dependencies (one instance for the whole app): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`. When adding a new shared dependency, register it in `shared` in **every** `vite.config.ts` (host + remotes), otherwise you get duplicate instances.
- Each MFE has its own `main.tsx` for **standalone development** (with `ApiProvider` + `AppLayout`); when integrated into the host, only the `routes` export is used.

## MFE workflow (mandatory)

The project works the way a team that owns micro-frontends separately does: a task lives in one MFE, runs there and is verified there; the MFEs meet in CI.

- **One task, one MFE.** A ticket belongs to exactly one app (`host`, `pages-mfe`, `user-mfe`) or one shared package (`@repo/ui`, `@repo/api`, `@repo/routes`, `@repo/events`, `@repo/firebase`): its "Area" in Notion has a single value. Work that needs a shared package and an MFE is split: the package ticket merges first, then each MFE adopts it in a ticket of its own. Tasks with no MFE (CI, dependencies, configs, `functions/`, Firestore rules, docs) are their own area.
- **Run it on its MFE.** A remote is developed standalone, through its `main.tsx`: `pnpm --filter @repo/pages-mfe dev` (5001) or `pnpm --filter @repo/user-mfe dev` (5002), not `pnpm dev`. Only a host task runs `pnpm dev`, because the host loads both remotes.
- **Verify it on its MFE.** Before the merge into `develop`, for an app (`<mfe>` is `host`, `pages-mfe` or `user-mfe`):

  ```bash
  pnpm exec turbo typecheck lint build --filter=@repo/<mfe>
  pnpm exec vitest run --project <mfe>
  pnpm lint:jsx-spread
  ```

  A shared package is verified together with every app that consumes it (`...` selects the package and its dependents):

  ```bash
  pnpm exec turbo typecheck lint build --filter=...@repo/<package>
  pnpm exec vitest run --project <package> --project host --project pages-mfe --project user-mfe
  pnpm lint:jsx-spread
  ```

  A task with no MFE runs the full set: `pnpm typecheck` + `pnpm lint` + `pnpm test`.
- **Integration happens in CI and on release.** Every PR runs the full `quality`, `size` and `rules` jobs; the host with both remotes and `pnpm test:e2e` run on the release PR into `main`. A failure there that one MFE caused goes back to that MFE as a ticket of its own.

## Cross-MFE communication

Only through `@repo/events`: the typed `createTypedEmitter` / `createTypedListener` (events from `EventMap`) and `globalStore`. No direct imports between apps.

## Documentation

A new domain term (a watchlist entity, a status, a UI concept users see) goes into the [GLOSSARY](../01-product/GLOSSARY.md) in the same PR as the feature that introduces it, and a changed page or flow updates its line in the [PRD](../01-product/PRD.md). A new architectural decision gets an ADR.

## Commits

Format: `CIN-<number>: <short description in the imperative mood>`. The number is the task ID in the "Tasks" database in [Notion](https://app.notion.com/p/40880c5f7ed58170bca1efda4e894ce9), where all project management happens. No commit without a Notion task: create the ticket first.

## Known tech debt

- ✅ **Fixed (2026-10-29, CIN-5): conditional hook call in `Movies.tsx`.** It used to have `searchQuery ? useSearchMovies(searchQuery) : useMovies('popular')`, which violates the React rules of hooks. It is now an unconditional `useMoviesOrSearch(searchQuery)` from `@repo/api`.

  **Pattern going forward:** suspense hooks (`useSuspenseQuery`/`useSuspenseInfiniteQuery`) do not support `enabled`, so do not pick a hook by a condition. Either switch `queryKey`/`queryFn` inside one query (as `useMoviesOrSearch` does) or move the variants into separate components, each with its own unconditional hook.
