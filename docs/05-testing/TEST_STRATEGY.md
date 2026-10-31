🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Test strategy

> **Current state:** unit, component and integration tests run in job `quality`, Firestore rules in job `rules`, Playwright smoke, auth and watchlist scenarios in job `e2e`. Tools and versions are fixed in [ADR-0006](../03-architecture/decisions/ADR-0006-testing-stack.md). The rules for writing tests (queries, mocking, states, timers, coverage) live in the engineering standards, §14 (Notion). Where this document and the standards disagree, the standards win.

## Pyramid

```
        ▲     E2E (few, critical paths)               → Playwright
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
e2e/                             # <scenario>.spec.ts
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
5. Components: `MovieCard`, `Hero`, `ContentRow`, `CategoryPills`, `AsyncBoundary` (fallback, Try again refetch, 404 → `NotFound`), `NotFound`, page skeletons.
6. Pages:
   - ✅ **Movies** (`apps/pages-mfe/src/pages/movies/__tests__/`): search ↔ list switching (regression for the conditional-hook bug), genre filter, sort, empty state, "Load more" (next-page error, end of list), state in the URL, URL parsing;
   - **Home**: rows render from MSW fixtures, and one failing row does not blank the page.

### Step 3 — ✅ e2e

Add Playwright (chromium) on the merged `dist/` served by `firebase emulators:start --only hosting`. Network goes through `page.route('**/api/tmdb/**')` with fixtures. Scenarios:

1. Home shows the hero and content rows.
2. Navigation Home → Movies → Profile across MFEs.
3. Search and filters on Movies are reflected in the URL and survive Back/Forward.
4. With `remoteEntry.js` of one remote aborted, its section shows the "unavailable" placeholder and the other sections keep working.
5. An unknown URL shows NotFound.

`e2e/watchlist.spec.ts` runs on the Firestore emulator with the real rules:

1. Folders nest six levels deep, then rename and move.
2. Deleting a folder keeps its titles and removes only that branch.
3. A delete names and removes a subfolder made in another tab.
4. A failed write shows a toast and keeps the form.
5. A delete still running does not pull the person back after they navigate away.
6. A double click on Delete still asks first.
7. The selected folder stays in view in the short tree of a phone.
8. A whole title row opens the title.
9. A long unbroken name does not widen the page on a phone.
10. Firestore runs from the host's singleton with the signed-in user, on the watchlist page and from the catalog's picker. These are the only automated checks for a second `firebase/app`.
11. A title goes into several folders and shows in the watchlist at once. A details page adds a title too, a person with no folders keeps the title under All titles, and a show is stored as TV.
12. Saving folders leaves `status` and `addedAt` alone.
13. Two tabs keep both folders, a tab that lost the race to create overwrites nothing, and a folder deleted elsewhere is not written.
14. A signed-out visitor gets the offer with no Firebase and comes back. A signed-in catalog page reads nothing until the picker opens.
15. A whole card, its metadata included, opens the title, and its button does not.
16. The dialog survives a second press outside, a double tap on a touch screen, a long list on a phone, Enter in the picker, a second card pressed during the download, and sign-out.
17. A failed save keeps the ticks. A dialog chunk that will not load, online or offline, leaves the page working, and a page lost with the connection loads on Try again once it returns.
18. Keyboard focus stays clear of the sticky filters on Movies and of the edges of a Home row.
19. A status belongs to the title: it shows in every folder and after a reload, and `folderIds` stay.
20. The status filter survives a sign-in, a folder change, a reload and Back.
21. The switch opens nothing, and the rest of the row opens the title. A correction during a slow write ends on the last press, and a failed write puts the stored status back.
22. Under a filter, a double tap leaves the next title alone, the keyboard keeps its focus, and Back that takes the focused row moves focus to the heading. At 320 px the switch and the pills fit, with 44 px to press.
23. The profile shows the account and the watchlist counts and leads to the watchlist and Settings. A failed read of the watchlist leaves the account, and `Try again` brings the counts.
24. A theme chosen in Settings reaches a page of another remote, survives a new load and a sign-out, and `System` follows the device.
25. A removed title leaves every folder and the profile, also after a reload, and a removal in a long list keeps the page where it is.

Titles are seeded through the emulator's REST API only for states the UI cannot produce on demand. `pnpm test:e2e` needs Java as well as `firebase-tools`.

e2e runs on PRs into `main` only, so run it locally before merging a change to the watchlist or to `@repo/firebase`.

## CI

- `quality` job: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test`.
- ✅ e2e: a separate `e2e` job on PRs into `main`, after `build:deploy`. `FIREBASE_CLI` overrides the emulator command there, because CI has no global `firebase-tools`; the job sets up Java 21 for the Firestore emulator.

## Coverage

- Target: **lines and branches ≥ 80%** for `@repo/api`, `@repo/events` and `@repo/ui/src/lib`, with an explicit `coverage.include`.
- Start with a report only. A `coverage.thresholds` gate is added once those packages have their tests.
- Components and pages have no percentage target; the state checklist from §14.4 applies instead.
