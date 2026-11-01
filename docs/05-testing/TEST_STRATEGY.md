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
5. Components: `MovieCard`, `PersonCard`, `Hero`, `ContentRow`, `MovieDetailView`, `PersonDetailView` and the sections of a details page, `CategoryPills`, `CategoryLinks`, `AsyncBoundary` (fallback, Try again refetch, 404 → `NotFound`), `NotFound`, page skeletons.
6. Pages:
   - ✅ **Movies** (`apps/pages-mfe/src/pages/movies/__tests__/`): search ↔ list switching (regression for the conditional-hook bug), genre filter, sort, empty state, "Load more" (next-page error, end of list), state in the URL, URL parsing;
   - ✅ **TV Shows** (`apps/pages-mfe/src/pages/tv/__tests__/`): the same flows on the shared catalog pieces, with TV genres, sort params and words, and cards that link to their show. `src/__tests__/routes.test.tsx` covers its skeleton, its error with a retry, and that no search text follows a move from Movies;
   - **Home**: rows render from MSW fixtures, and one failing row does not blank the page;
   - ✅ **Movie Detail** (`apps/pages-mfe/src/pages/movie-detail/__tests__/`): one request for every section, their order, the region from the browser language, each empty state, a response without the appended blocks, the error state, axe;
   - ✅ **TV Detail** (`apps/pages-mfe/src/pages/tv-detail/__tests__/`): one request for every section, their order, each empty state, a response without the appended blocks, the error state and axe, as on Movie Detail, with seasons and episodes in the hero, the Seasons section with the specials last, the creator in the line of directors and writers, and TV cards in More like this. `parseRouteId` has its own test, and `src/__tests__/routes.test.tsx` covers the page on demand and its skeleton;
   - ✅ **Person** (`apps/pages-mfe/src/pages/person/__tests__/`): one request, the order of the sections, the talk show left out of Known for and kept in the filmography, each empty state, a response without the appended block, credits that lack a date, a title or a poster, the error state, an unknown and an invalid id, axe. `src/__tests__/routes.test.tsx` covers its skeleton;
   - ✅ **Search** (`apps/pages-mfe/src/pages/search/__tests__/`): no request and focus on the input with no query, a search on submit alone, the query trimmed and the type kept, an empty submit, the input following the URL on Back, tabs that are links and load one at a time, each result leading to its page, Load more with an inline failure, the empty line of each tab, the skeleton and the error beside a form that still works, one live region through new searches, tabs and failures, a `q` over the limit, axe, and the URL parsing and links of `use-search-state.ts`.

### Step 3 — ✅ e2e

Add Playwright (chromium) on the merged `dist/` served by `firebase emulators:start --only hosting`. Network goes through `page.route('**/api/tmdb/**')` with fixtures. Scenarios:

1. Home shows the hero and content rows.
2. Navigation Home → Movies → Profile across MFEs.
3. Search and filters on Movies and TV Shows are reflected in the URL and survive Back/Forward, and a shared TV Shows link opens the same view.
4. With `remoteEntry.js` of one remote aborted, its section shows the "unavailable" placeholder and the other sections keep working. A remote lost with the connection stays in the app on Try again, and loads on a press once the connection returns.
5. An unknown URL shows NotFound.
6. TV Shows opens from the header, the mobile menu and a direct URL, shows its empty and error states, and has no horizontal page scroll at 320 px, with a 100-character search too.
7. With `sessionStorage` blocked, a chunk that keeps failing loads the document once and shows the page's error state.
8. Reload after an error that reaches `ShellBoundary` stays in the app offline, and reloads on a press once the connection returns. The error comes from a `document.title` that throws on the catch-all route, which has no `PageBoundary`.

The mock answers in the browser, so without a check a request the real `tmdbProxy` refuses would still pass e2e. Every request that reaches `e2e/tmdb-mock.ts` therefore goes through the real `resolveProxyRequest` from `functions/src/proxy-rules.ts`, with the path and params of the URL the browser sent, and `e2e/proxy-rules.spec.ts` covers the check:

- A refused request gets the status, the `{ error }` body and the `Cache-Control: no-store` of the proxy, and it fails the test, even on a page that survives it, such as a Home row nobody asserts on.
- The test fails through `expect.soft` in the route handler. A throw or a plain `expect` there fails it too, but leaves the request unanswered and ends the test on the spot.
- A test that means to provoke a refusal says so with `expectRefusal(page, isProvoked)`, for the requests that match. Any other refusal still fails it. Today that is the `q` over the limit in `e2e/search.spec.ts`.

The check does not see three things:

- A request a spec fulfils with its own `page.route` never reaches the mock. One that goes on with `route.fallback()` does.
- A request sent as the test ends: Playwright stops calling route handlers once the page or its context closes. Home starts all its requests up front, so its rows do reach the check.
- The method: `tmdbProxy` answers 405 to anything but GET and HEAD in `index.ts`, which needs Firebase and cannot be imported here. `apiGet` only sends GET.

Two mutants proved the check, each on a new `pnpm build:deploy` and the whole suite of 151 tests, and neither was committed:

- A `region` param on `/movie/upcoming` alone, in `getMovies`, failed 14 tests. No spec asserts on that row, New Releases, so each of them had one error and no other: `tmdbProxy refuses /api/tmdb/movie/upcoming?page=1&region=US: 400 Invalid query parameters`.
- `,keywords` added to `DETAIL_APPEND` in `packages/api/src/core/config.ts` alone failed 31 tests on the details pages and the links into them, with `tmdbProxy refuses /api/tmdb/movie/7?append_to_response=credits%2C…%2Ckeywords: 400 Invalid query parameters` and its `/tv/` twin.

`e2e/movie-detail.spec.ts` runs on fixtures from `e2e/tmdb-mock.ts`, which also answers `image.tmdb.org` and `i.ytimg.com`, so no test reaches a real image host:

1. The five sections stand in order below the hero, and every list stops at its limit.
2. Thumbnails and logos load under the enforced CSP.
3. Videos stay links, with no iframe.
4. A section with nothing to show keeps its heading and says so.
5. The providers follow the browser language, and the empty line names that country.
6. At 320 px, neither a full page, an empty page nor long unbroken text widens the page.
7. From far down the page, a card opens the other movie at the top, cached or not, and Back returns to where the reader was.

`e2e/person.spec.ts` runs on the same fixtures:

1. The page opens from the cast of Movie Detail, from far down the page too, and starts at the top.
2. The facts and sections stand in order, and the photo loads under the enforced CSP.
3. Known for stops at 12 and leaves the talk show out, its cards open a movie, and its button offers the watchlist.
4. The filmography shows 30 rows, then all of them on a press, with focus on the first new row. A press on the bottom edge of the screen works and leaves the reader there. The press adds no history entry and does not move the page. Back from a title shorter than the reader's position finds the list open, at the same row and with no focus on it, and a second Back leaves the page. A shared link opens the whole list at the top, and a person reached from the open list starts with the short one.
5. A row merges the roles on one title and links to its page, and a credit with no date, title or poster takes the last row.
6. A long biography opens and closes, and a short one has no toggle.
7. A person with nothing to show keeps every heading and says so.
8. An unknown id and an id that is not a positive integer reach NotFound, the second with no request. A failed request offers a retry that brings the person.
9. At 320 px, with the biography and the filmography open, neither a full page, an empty page nor long unbroken text widens the page, and each external string stays inside the screen.

`e2e/tv-detail.spec.ts` runs on the same fixtures:

1. A card on TV Shows opens the show, and a direct URL does too.
2. The six sections stand in order below the hero, which shows the seasons and episodes and the watchlist button.
3. Seasons keep the order of TMDB with the specials last, and the creator stands first in the line of directors and writers.
4. A section with nothing to show keeps its heading and says so.
5. An id TMDB does not know and an id that is not a number reach NotFound, and a failed request offers a retry.
6. At 320 px, neither a full page, an empty page nor long unbroken text in every external string widens the page.
7. From far down the page, a card opens the other show at the top.

`e2e/search.spec.ts` runs on the same fixtures:

1. The header icon leaves focus on the input, on a chunk that is new, delayed past the move to `main`, and on one already loaded, and on the open page it drops the search.
2. With no query, nothing is sent. A link opens the same view and survives a reload.
3. A search runs on submit alone, and Back and Forward bring each search and its text back. An empty submit keeps the type.
4. Tabs are links, and only the active one loads, with the skeleton beside the form and the tabs. A new search and a tab tell one and the same live region, empty while they load, and a search in the cache empties it for longer than a frame.
5. A movie, a show and a person each open their details page, and the photo loads under the enforced CSP.
6. Load more adds a page, and a failed one shows inline with no toast.
7. Nothing found names the query and the tab, and a failed search offers a retry with the form still usable.
8. A `q` over the limit reaches the error, and a submit gets out of it.
9. At 320 px, on each tab, neither a 100-character unbroken query, with results or none, nor a 200-character name widens the page.

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
11. A title goes into several folders and shows in the watchlist at once. A details page adds a title too, a person with no folders keeps the title under All titles, and a show is stored as TV, from Home and from TV Shows.
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
26. A double press on Cancel in a folder form, by touch or mouse, reaches no pill, title or toolbar button, and focus stays on the toolbar button. Each press point is first checked to lie on that control.

Titles are seeded through the emulator's REST API only for states the UI cannot produce on demand. `pnpm test:e2e` needs Java as well as `firebase-tools`.

e2e runs on PRs into `main` only, so run it locally before merging a change to the watchlist or to `@repo/firebase`.

## CI

- `quality` job: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test`.
- ✅ e2e: a separate `e2e` job on PRs into `main`, after `build:deploy`. `FIREBASE_CLI` overrides the emulator command there, because CI has no global `firebase-tools`; the job sets up Java 21 for the Firestore emulator.

## Coverage

- Target: **lines and branches ≥ 80%** for `@repo/api`, `@repo/events` and `@repo/ui/src/lib`, with an explicit `coverage.include`.
- Start with a report only. A `coverage.thresholds` gate is added once those packages have their tests.
- Components and pages have no percentage target; the state checklist from §14.4 applies instead.
