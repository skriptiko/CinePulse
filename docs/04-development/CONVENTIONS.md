🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CONVENTIONS — Development conventions

## Monorepo structure

```
apps/       host (5000), pages-mfe (5001), user-mfe (5002)
packages/   api, ui, routes, events, typescript-config
functions/  Firebase Cloud Functions (tmdbProxy)
```

Packages are consumed via `@repo/*` aliases (`@repo/api`, `@repo/ui`, `@repo/routes`, `@repo/events`, `@repo/typescript-config`). Apps: `@repo/host`, `@repo/pages-mfe`, `@repo/user-mfe`, `@repo/functions`.

## Naming

- Component files in `@repo/ui` are **kebab-case** (`movie-card.tsx`, `content-row.tsx`); the exported component is **PascalCase** (`MovieCard`).
- Pages in apps are **PascalCase** (`Home.tsx`, `Movies.tsx`, `Profile.tsx`).
- Hooks are `useXxx` (`useMoviesOrSearch`, `useMovieFilters`); query factories are `<domain>Queries` (`movieQueries`).
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
HOME '/', MOVIES '/movies', USER '/user', USER_PROFILE '/user/profile', USER_SETTINGS '/user/settings'
```

Each MFE exposes a `routes` array (`RouteObject[]`) through Module Federation (`exposes: { './routes': './src/routes.tsx' }`); the host collects them and renders them via `useRoutes`.

> ⬜ **There are no dynamic routes (`:id`) yet.** Future pages (Movie Detail `/movies/:id`, TV, Person) need parameterized paths in `ROUTE_PATHS` and a pattern for reading the parameter. The query factories for them already exist (`movieQueries.detail`, `tvQueries.detail`, `personQueries.detail`).

## MFE pattern (Module Federation)

- A **remote** exposes `./routes`; the **host** imports them dynamically (`import('pagesMfe/routes')`).
- **Shared** dependencies (one instance for the whole app): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`. When adding a new shared dependency, register it in `shared` in **every** `vite.config.ts` (host + remotes), otherwise you get duplicate instances.
- Each MFE has its own `main.tsx` for **standalone development** (with `ApiProvider` + `AppLayout`); when integrated into the host, only the `routes` export is used.

## Cross-MFE communication

Only through `@repo/events`: the typed `createTypedEmitter` / `createTypedListener` (events from `EventMap`) and `globalStore`. No direct imports between apps.

## Commits

Format: `CIN-<number>: <short description in the imperative mood>`. The number is the task ID in the "Tasks" database in [Notion](https://app.notion.com/p/40880c5f7ed58170bca1efda4e894ce9), where all project management happens. No commit without a Notion task: create the ticket first.

## Known tech debt

- ✅ **Fixed (2026-10-29, CIN-5): conditional hook call in `Movies.tsx`.** It used to have `searchQuery ? useSearchMovies(searchQuery) : useMovies('popular')`, which violates the React rules of hooks. It is now an unconditional `useMoviesOrSearch(searchQuery)` from `@repo/api`.

  **Pattern going forward:** suspense hooks (`useSuspenseQuery`/`useSuspenseInfiniteQuery`) do not support `enabled`, so do not pick a hook by a condition. Either switch `queryKey`/`queryFn` inside one query (as `useMoviesOrSearch` does) or move the variants into separate components, each with its own unconditional hook.
