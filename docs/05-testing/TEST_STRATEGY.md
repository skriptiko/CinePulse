🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Test strategy

> **Current state: no tests yet.** This document is the rollout plan. Tools and versions are fixed in [ADR-0006](../03-architecture/decisions/ADR-0006-testing-stack.md). The rules for writing tests (queries, mocking, states, timers, coverage) live in the engineering standards, §14 (Notion). Where this document and the standards disagree, the standards win.

## Pyramid

```
        ▲     E2E (few, critical paths)               → Playwright, later
       ▲▲▲    Component / integration (some)          → Vitest + Testing Library + MSW
      ▲▲▲▲▲   Unit (many, cheap, fast)                → Vitest
```

| Level | What | Environment |
| --- | --- | --- |
| unit | mappers, `format.ts`, URL/query helpers, `queryOptions` key shapes, `ApiError` / retry policy, event bus, store | `node`, or `jsdom` when the code touches `window` |
| component | `@repo/ui` components: rendering from the model, interaction, loading/empty/error states, structural a11y (axe) | `jsdom` |
| integration | MFE pages with a real `QueryClient`, `AsyncBoundary` and MSW on `/api/tmdb/*` | `jsdom` |
| e2e | critical paths on the merged `dist/` (host + remotes) | Playwright, chromium |

## Layout

```
vitest.config.ts                 # root: test.projects + coverage
packages/test-utils/             # @repo/test-utils: renderWithProviders, MSW server/handlers, factories, axe helper
packages/api/src/core/
  utils.ts
  __tests__/utils.test.ts
packages/ui/src/components/
  movie-card.tsx
  __tests__/movie-card.test.tsx
apps/pages-mfe/src/pages/movies/
  movies-page.tsx
  __tests__/movies-page.test.tsx
e2e/                             # later: <scenario>.spec.ts
```

- Run everything with `pnpm test` from the root (one Vitest run over all projects). `pnpm test:coverage` gives a merged v8 report in `coverage/`.
- jsdom projects point `environment` at `scripts/vitest-jsdom-environment.ts` (jsdom plus Node's fetch globals, see ADR-0006).
- `@repo/api` tests create their own MSW server: `@repo/test-utils` depends on `@repo/api`, so using it back would be a cycle.
- Each project's `vitest.config.ts` only sets its environment and setup files.

## Rollout

### Step 1 — infrastructure (PR-3b) ✅

- [x] Add `vitest`, `@vitest/coverage-v8`, `jsdom`, `msw` and the Testing Library packages to the pnpm catalog.
- [x] Add the root `vitest.config.ts` with `test.projects`, a `vitest.config.ts` per project, and `"test": "vitest run"` at the root.
- [x] Create `@repo/test-utils`:
  - `renderWithProviders`;
  - the MSW `server` with `onUnhandledFrame: 'error'`, reset after each test;
  - `buildMovie` / `buildPaginated`;
  - the axe helper.
- [x] Add `pnpm test` to the CI `quality` job.
- [x] Write the first tests:
  - unit: `buildQueryString`, `getImageUrl`;
  - `getMovies` over MSW;
  - `CategoryPills` render, interaction and axe;
  - the shared MSW server.

Exit: `pnpm test` is green locally and in CI, with at least one test in `@repo/api` and one render test in `@repo/ui`.

### Step 2 — tests come with the refactoring (phases 4–6)

From here on, new or changed logic in `packages/*` and new UI states land with tests in the same PR (§14.2). Planned coverage, in the order the code is touched:

1. UI mappers and `format.ts` (`toMovieCardData`, `toHeroData`, `formatYear`, `formatRating`).
2. `ApiError` classification, `shouldRetry`, `getRetryDelay`, `getNextPageParam` (including the 500-page cap).
3. `queryOptions` factories: key shapes.
4. `@repo/events`: event bus (`on` / `off` / `once` / `emit`) and the store.
5. Components: `MovieCard`, `Hero`, `ContentRow`, `CategoryPills`, the error boundaries (shell/module).
6. Pages:
   - **Movies**: search ↔ list switching (regression for the conditional-hook bug), genre filter, sort, empty state, "Load more" (next-page error, end of list), state in the URL;
   - **Home**: rows render from MSW fixtures, and one failing row does not blank the page.

### Step 3 — e2e (after phase 6)

Add Playwright (chromium) on the merged `dist/` served by `firebase emulators:start --only hosting`. Network goes through `page.route('**/api/tmdb/**')` with fixtures. Scenarios:

1. Home shows the hero and content rows.
2. Navigation Home → Movies → Profile across MFEs.
3. Search and filters on Movies are reflected in the URL and survive Back/Forward.
4. With `remoteEntry.js` of one remote aborted, its section shows the "unavailable" placeholder and the other sections keep working.
5. An unknown URL shows NotFound.

e2e runs on PRs into `main` only.

## CI

- `quality` job: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test`.
- e2e: a separate job on PRs into `main`, after `build:deploy`.

## Coverage

- Target: **lines and branches ≥ 80%** for `@repo/api`, `@repo/events` and `@repo/ui/src/lib`, with an explicit `coverage.include`.
- Start with a report only. A `coverage.thresholds` gate is added once those packages have their tests.
- Components and pages have no percentage target; the state checklist from §14.4 applies instead.
