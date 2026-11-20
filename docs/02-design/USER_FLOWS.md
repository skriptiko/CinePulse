🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# User flows F1–F7

How the seven key tasks from [UX_STANDARDS § 1.2](./UX_STANDARDS.md#12-key-flows) work in the current build, step by step, and what the first cognitive walkthrough found. Use this page to plan a change to one of these tasks and to review it: update the flow in the same pull request that changes it, and run the walkthrough again.

Walked through on 2026-11-20 at `bd1e7a5` (CIN-180).

## How to read this page

**This page describes today's build, not the target.** The targets are in UX_STANDARDS; each flow here says whether it meets them. Where a problem matches a proposal in [UX_STANDARDS § Proposed changes](./UX_STANDARDS.md#proposed-changes), it names the proposal number.

**The walkthrough was done on the code, not on the running app.** Each step comes from the components, routes and copy, with `path:line` at `bd1e7a5`. It is the expert check that § 8 asks for before the first round of tests with people; it does not replace those tests.

Each flow has a short header list (persona, entry point, preconditions, success state, step budget, last walkthrough) and one table of steps. **A step** is one press, one typed query or one page change; scrolling does not count but is noted. The Walkthrough column shows Pass when all four NN/g questions pass for that step, or names each question that fails:

- **Q1** Will the user try to reach this result?
- **Q2** Will they notice the right action?
- **Q3** Will they link the action to the result?
- **Q4** Will they see progress after it?

Severity: **blocker** stops the task or loses the person's intent; **major** misses a target or makes the task much harder; **minor** costs effort or clarity.

## Summary

| Flow | Target | Today | Result | Problems |
| --- | --- | --- | --- | --- |
| [F1 Guest saves a title](#f1-guest-saves-a-title) | ≤ 3 presses, no second press after sign-in | 2 presses; the save runs after sign-in (CIN-182) | Meets | 2 minor |
| [F2 What to watch tonight](#f2-what-to-watch-tonight) | ≤ 3 steps to Where to watch | 1 step (plus a scroll on phones) | Meets; the region can be wrong | 1 major, 4 minor |
| [F3 Search → detail → save](#f3-search--detail--save) | Query + 1 + 1 | 4 steps (save needs a confirm press) | Over by 1 | 1 major, 5 minor |
| [F4 Move between folders](#f4-move-between-folders) | ≤ 3 presses, with Undo | Title: 6 steps from its detail page; folder: 5 presses; no Undo | Misses | 2 major, 5 minor |
| [F5 Mark watched](#f5-mark-watched) | 1–2 presses; status on card, detail page and list | 1 press on the list, 3 from a detail page; status on the list only | Partly meets | 2 major, 2 minor |
| [F6 Cross-links](#f6-cross-links) | 1 press per move, real URLs | 1 press per move | Meets | 4 minor |
| [F7 Back to the watchlist](#f7-back-to-the-watchlist) | 1 press from the global navigation | 2 presses signed in, 3 as a guest | Over by 1–2 | 1 major, 3 minor |

**The problems with the largest effect:**

1. **F7: the global navigation has no Watchlist link.** Every path goes through the avatar icon and Profile (proposal 19).
2. **F4 and F5: the watchlist state lives only on the watchlist page.** A title cannot be moved from its row, and no card or detail page shows that a title is saved or watched (proposals 7 and 11).

The third, a guest's save lost at sign-in (F1), was fixed by proposal 3 in CIN-182. Problems that no earlier proposal covered became proposals 19–21 in UX_STANDARDS.

## Flows

### F1 Guest saves a title

- **Persona:** A visitor who is not signed in finds a movie and wants to keep it for later.
- **Entry point:** Movie Detail, `/movies/:id` (for example, reached from Home or Search)
- **Preconditions:** Not signed in (`authStatus` is `anonymous`, no session flag in `localStorage`); a Google account; pop-ups allowed.
- **Success state:** Still on the movie page, at the same scroll position, with the title saved and the toast `{title} is in your watchlist, under All titles`.
- **Step budget:** target ≤ 3 presses on CinePulse's own UI, no second press after sign-in; today 2 presses on the happy path — meets
- **Walkthrough:** 2026-11-20, code walkthrough after CIN-182 — sign-in happens in the dialog, and the save runs on its own when the popup closes with an account.

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | Press `Add to watchlist` (in the hero, under the genres) | The dialog chunk loads (the bookmark icon spins), then a dialog opens: `Sign in to save {title}`, `Sign in with Google, and the title is saved to your watchlist.`, `Continue with Google` and a `Close` button. The dialog loads the Firebase Auth SDK, so the popup can open on the next press; until it has loaded, the button is disabled and the dialog says `Getting sign-in ready...` (`apps/pages-mfe/src/components/watchlist-dialog.tsx:53-56`). Firestore is not loaded yet | `/movies/:id` | Pass |
| 2 | Press `Continue with Google` | The button is disabled and the dialog says `Finish signing in in the Google window.`; the Google popup opens (provider screens not counted). On success the dialog reads `Saving...` and saves the title with no folder, for the account the popup returned (`apps/pages-mfe/src/components/watchlist-dialog.tsx:70-122`). The dialog closes, focus returns to `Add to watchlist`, and a toast says `{title} is in your watchlist, under All titles`. The page does not move | `/movies/:id` | Pass |

**Decision points:**

- Step 1, from a poster card (Home, More like this, Search) instead of the hero: the icon button is named `Add {title} to your watchlist`; the same dialog opens.
- Step 1, a returning user whose session is still restoring (`authStatus` is `loading`): the dialog shows the folder skeleton and becomes the picker on its own (`apps/pages-mfe/src/components/watchlist-dialog.tsx:143-144`).
- Step 1, the person presses `Close` or Escape: the dialog closes and focus returns to `Add to watchlist` (`apps/pages-mfe/src/components/add-to-watchlist.tsx:66`).
- Instead of step 2, the person uses `Sign in` in the header: no `from` state, so after sign-in they land on `/user/profile`, not the movie, and nothing is saved (`packages/ui/src/components/header.tsx:117-119`, `apps/user-mfe/src/pages/login.tsx:21`).
- Step 2, the account already has the title: nothing is written, the title keeps its folders and status, and the toast says `{title} was already in your watchlist`.
- During step 2, the person closes the dialog: the popup stays open; if they finish signing in, the title is still saved and the toast shows.
- After step 2, the person wants a folder: they press `Add to watchlist` again and tick it in the picker.

**Failure and recovery:**

- The dialog chunk fails to load: toast `The watchlist could not be opened. Reload the page and try again.`; the person reloads (`apps/pages-mfe/src/components/add-to-watchlist.tsx:37-41`).
- The popup is closed: nothing is saved, the dialog closes and focus returns to `Add to watchlist` (`apps/pages-mfe/src/components/watchlist-dialog.tsx:77-81`).
- The popup is blocked: inline alert `Allow pop-ups for this site and try again.`, and the button reads `Try again`; the press is kept, so a successful retry saves the title (`apps/pages-mfe/src/components/watchlist-dialog.tsx:84-85`, `packages/firebase/src/errors.ts:33-36`). Focus returns to the button.
- The SDK fails to load: the button is enabled anyway, and the press tries again; a failure then shows the network message.
- Network failure during sign-in: inline alert `Could not reach the server. Check your connection.`; `Try again` retries.
- The save after sign-in fails: toast `{title} was not saved. Press Add to watchlist to try again.`; the person is signed in, so the dialog turns into the folder picker, and its `Add to watchlist` button retries (`apps/pages-mfe/src/components/watchlist-dialog.tsx:110-116`).
- A save from the picker fails: a toast with the error text from `getErrorMessage`, the dialog stays open, `Add to watchlist` is enabled again and gets focus. A Firestore 429 or 5xx reads `The movie service is having trouble. Please try again later.`, which names the wrong service (`packages/api/src/core/error-message.ts:10-11`).

**Problems found:**

1. The header `Sign in` link carries no `from`, so a guest who signs in from there lands on Profile, not the page they were on. Minor. `packages/ui/src/components/header.tsx:117-119`. Proposal 21.
2. A failed Firestore write from the picker can read `The movie service is having trouble.`, which names the wrong service. Minor. `packages/api/src/core/error-message.ts:10-11`. Proposal 2.

The walkthrough at `bd1e7a5` found a blocker (the save did not resume after sign-in) and five more problems on the way through `/auth/login`: the scroll position and focus were lost on return, history held the movie page twice, nothing said what happens next, and a press before the SDK had loaded could get a blocked popup. Proposal 3 (CIN-182) fixed them by keeping sign-in in the dialog.

### F2 What to watch tonight

- **Persona:** A guest who wants to pick something to watch tonight and needs to know where it streams.
- **Entry point:** Home, `/`
- **Preconditions:** Not signed in. TMDB returns trending and row data; the title has watch provider data for the viewer's country.
- **Success state:** The person is on the title's detail page and sees the `Where to watch` section with its Stream, Rent or Buy logos and names.
- **Step budget:** target ≤ 3 steps from Home to a detail page with Where to watch visible; today 1 step on the happy path (plus a scroll on phones) — meets
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — one press reaches the detail page, but the section may show offers for the wrong country without saying which one.

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | Press a card in `Trending Now`, `New Releases`, `Top Rated` or `Popular`, a tile in `Editor's Picks`, or `More Info` (accessible name `More Info about {title}`) in the hero | The detail page opens. Focus moves to `main` and the page starts at the top (`packages/ui/src/components/app-layout.tsx:57-58`). After 300 ms a skeleton shows until the one detail request returns (ADR-0017). The hero shows title, tagline, rating, year, runtime, genres, `Add to watchlist` and the full overview | `/` → `/movies/:id` (or `/tv/:id` from a TV card in Trending Now) | Pass |
| — | Scroll down (not a step; on phones the section is below the first view) | `Where to watch` is the first section under the hero (`apps/pages-mfe/src/pages/movie-detail/movie-detail-page.tsx:53-55`). It lists Stream, Rent and Buy, `See all options on TMDB` and `Streaming data by JustWatch`, or one line: `No streaming, rental or purchase options listed for {country}.` | `/movies/:id` | Q4 fails: the heading does not name the country, and the country is guessed from the browser language, so a `uk` or `en` browser gets US offers |

**Decision points:**

- Hero or row: the hero offers one trending movie through `More Info` (`packages/ui/src/components/hero.tsx:94-103`); the rows offer up to 20 cards each, and `Editor's Picks` 5 tiles. All lead to the same detail page.
- Movie or show: `Trending Now` mixes movies and shows (`apps/pages-mfe/src/pages/home/trending.ts:8-10`); the other rows are movies only. A person who wants a show can also use `TV Shows` in the header and press a card there: 2 steps, still within budget.
- Not this one: the person presses Back. Home comes back at the same scroll position, as a Pop keeps it (`packages/ui/src/components/app-layout.tsx:58`). Each extra title costs 2 more steps (Back and a new press).
- Where to watch has offers or not: with offers the person sees logos and names (logos are not links) and can open TMDB in a new tab; with none, the line names the country.

**Failure and recovery:**

- A Home section fails: it shows `This section could not be loaded.` with `Try again` in place of that row; the other rows still work (`packages/ui/src/components/section-error-fallback.tsx:11-16`). A failed or empty hero is left out (`apps/pages-mfe/src/pages/home/hero-section.tsx:31`).
- The detail request fails: the page shows `Something went wrong`, a message such as `Could not reach the server. Check your connection.`, and `Try again` (`packages/ui/src/components/page-error-fallback.tsx:26-38`).
- An id TMDB does not know: `NotFound` (`apps/pages-mfe/src/pages/movie-detail/movie-detail-page.tsx:25-31`).
- The pages remote does not load: the host shows `This section is unavailable` with `Try again` (`apps/host/src/remotes/remote-unavailable.tsx:12-16`).
- Offline: one global banner, `You are offline. Showing saved results.`; titles already in the cache still open.
- Wrong country: none. There is no region picker, and the section does not say which country it shows when it has offers.

**Problems found:**

1. The country is guessed from the browser language, with the US as the fallback. Many languages name no country (`uk`, `en`), so these readers get US offers. With offers, the heading says only `Where to watch` and never names the country; there is no picker and no `Availability can change`. Q4 fails: the person cannot tell if the offers apply to them. Major. `packages/ui/src/lib/viewer-region.ts:3-6`, `packages/ui/src/components/watch-providers-section.tsx:35`. Proposal 13.
2. On a phone the section sits below the first view: the hero shows the full overview with no clamp, and nothing in the hero links to Where to watch. This misses the § 6 target "Detail on one screen" (Where to watch or a link to it in the first view). Minor. `packages/ui/src/components/movie-detail-view.tsx:95-99`, `packages/ui/src/components/movie-detail-view.tsx:103-104`.
3. Home gives no hint of where a title is available, so comparing options for tonight costs a press and a Back per title. Q1 is weak for a "tonight" task: nothing on Home says which titles the person can watch now. Minor. `packages/ui/src/components/movie-card.tsx:7-20`. Related to proposal 18.
4. `New Releases` is built from TMDB `upcoming`, which lists films that are not out yet; their detail pages often show the empty Where to watch line. Q3 fails: the label suggests films the person can watch now. Minor. `apps/pages-mfe/src/pages/home/home-page.tsx:32`. Proposal 17.
5. With a mouse, a card shows only its poster at rest; the title, rating and year appear on hover or focus. A person scanning a row for tonight has to hover each card. Q2 is weak. Minor. `packages/ui/src/components/movie-card.tsx:42-46`, `packages/ui/src/components/movie-card.tsx:95`.

### F3 Search → detail → save

- **Persona:** A signed-in person who knows the name of a movie and wants to save it.
- **Entry point:** Search, `/search` (the search icon in the header, named `Search`)
- **Preconditions:** Signed in; TMDB has a match for the query; the watchlist may have folders or none.
- **Success state:** The movie page with the toast `{title} is in your watchlist`; Back shows the same results and tab.
- **Step budget:** target query + 1 press on a result + 1 to save; today 4 steps on the happy path (query, result, Add, confirm) — over by 1
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — search and Back work as targeted, but saving needs a confirm press in the dialog, and nothing shows the saved state afterwards.

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | Type a query in `Search by title or name` and press Enter (or `Search`) | The input already has focus (no `q`). Submit pushes `?q=`; the form and the tabs `Movies`, `TV Shows`, `People` stay, a grid skeleton shows, then `N movies found` and the card grid. A hidden live region announces the count 100 ms later | `/search` → `/search?q=dune` | Pass |
| 2 | Press a result card (scroll if needed; `Load more` for later pages) | The poster morphs into the detail poster; the page starts at the top and focus moves to `main`. Hero: title, tagline, rating, year, runtime, genres, `Add to watchlist` | `/movies/:id` | Q2 fails on a fine pointer: card title and year are hidden until hover or focus |
| 3 | Press `Add to watchlist` | A dialog: `Choose folders for {title}`, `With no folder, it stays under All titles.`, a skeleton while folders and items load, then folder checkboxes or `No folders yet. Create them in your watchlist.`, `Add to watchlist` and `Open watchlist` | `/movies/:id` | Pass (the dialog is an extra step, see problem 1) |
| 4 | Press `Add to watchlist` in the dialog | `Saving...`, the dialog closes, focus returns to the trigger, toast `{title} is in your watchlist` | `/movies/:id` | Q4 fails after the toast: the trigger still reads `Add to watchlist` |
| 5 | Press the browser Back button (checks the second target) | Pop to the results. They come from the cache (5-minute stale time), with all loaded pages; the tab comes from `type` in the URL; the input takes the query from the URL; the browser restores the scroll position | `/search?q=dune` | Pass |

**Decision points:**

- After step 1, a tab press (`TV Shows`, `People`) pushes `?q=dune&type=tv` or `type=person`; only that tab loads. A draft not yet submitted is dropped (`apps/pages-mfe/src/pages/search/search-form.tsx:20-24`). Back steps through the tabs.
- Step 1 to step 4 can be shortened: the bookmark icon on a result card (`Add {title} to your watchlist`) opens the same dialog without leaving Search, so the save is query + 2 presses.
- `People` tab: a press on a `PersonCard` opens `/person/:id` (see F6); there is no save on a person.
- Step 3, the title is already saved: the dialog adds `{title} is already in your watchlist.`, the button reads `Save` and stays disabled until a folder tick changes (`apps/pages-mfe/src/components/watchlist-dialog.tsx:146`, `229-231`). With no folders, a saved title gets no button at all, only `Open watchlist` (`:203`).
- Step 3, folders exist: the person can tick folders before step 4; unticked means All titles only.
- The same query submitted again adds no history entry; an empty submit clears `q` (`apps/pages-mfe/src/pages/search/use-search-state.ts:62-70`).

**Failure and recovery:**

- No results: `No movies found for “…”` (per tab) with `Clear search`; the person edits the query or switches tab (`apps/pages-mfe/src/pages/search/search-results.tsx:158-165`).
- Results fail: `SectionErrorFallback` with `Try again` in the place of the results; the form and tabs keep working (`apps/pages-mfe/src/pages/search/search-page.tsx:44-56`).
- `Load more` fails: inline `Couldn't load more movies.` and the button becomes a retry; loaded cards stay (`apps/pages-mfe/src/components/catalog/catalog-grid.tsx:62-77`).
- The detail page fails: the page boundary shows a message with `Try again`; an unknown id shows `NotFound`.
- Folders fail to load in the dialog: `Your folders could not be loaded.` with `Try again` (`apps/pages-mfe/src/components/watchlist-dialog.tsx:85-94`).
- The save fails: a toast with the error text, the dialog stays open and the button gets focus again (`apps/pages-mfe/src/components/watchlist-dialog.tsx:131-134`); offline the write fails at once (`networkMode: 'always'`).
- Back after more than 5 minutes (or after the cache is dropped): the results refetch; the scroll position then depends on the browser restoring it after the content arrives. No e2e test covers Back to Search (`e2e/search.spec.ts` has no `goBack`), so this is not verified.

**Problems found:**

1. Saving needs two presses: `Add to watchlist` opens a dialog, and a second `Add to watchlist` writes. With no folders at all the dialog has nothing to choose, yet still asks for the confirm. Misses "1 press to save" (over by 1). Major. `apps/pages-mfe/src/components/watchlist-dialog.tsx:165-212`. Proposal 20.
2. No saved state on the detail button or on cards. After the toast closes, the trigger still reads `Add to watchlist` (cards: `Add {title} to your watchlist`); the person learns the title is saved only by opening the dialog again. Fails Q4 after step 4. Minor. `apps/pages-mfe/src/components/add-to-watchlist.tsx:52`, `59`. Proposal 11.
3. On a fine pointer, card titles and years are hidden until hover or focus, so the person picks between results with the same poster style or the same name (`Dune` 1984 and 2021) by pointing at each. Fails Q2 at step 2. Minor. `packages/ui/src/components/movie-card.tsx:42-46`, `95-111`.
4. The success toast names the title but not the folder. Minor. `apps/pages-mfe/src/components/watchlist-dialog.tsx:117-118`.
5. Back to the results relies on the browser restoring scroll after the page renders; no test checks it for Search. Minor (unverified risk). `packages/ui/src/components/app-layout.tsx:58`. Proposal 14.
6. A failed Firestore 429 or 5xx reads `The movie service is having trouble.`, which names the wrong service. Minor. `packages/api/src/core/error-message.ts:10-11`. Proposal 2.

### F4 Move between folders

- **Persona:** A signed-in person who keeps titles in folders and wants to put a title, or a whole folder, somewhere else.
- **Entry point:** Watchlist, `/user/watchlist`
- **Preconditions:** Signed in. At least two folders exist; for path A, a title sits in folder X; for path B, the folder to move has a valid target (not its own parent, not inside itself, within 4 levels).
- **Success state:** Path A: the title is listed under folder Y and no longer under X. Path B: the folder appears under its new parent in the folder tree.
- **Step budget:** target ≤ 3 presses (menu → Move to… → folder), no reload, with Undo; today path A takes 5 presses plus 1 to return (6), path B takes 5 presses — over by 3 (A) and by 2 (B); no Undo on either path
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — a folder can be moved from the watchlist, but a title cannot: the only way is the folder picker on the title's detail page, and neither path has Undo.

**Path A: move a title from folder X to folder Y**

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| A1 | Press the title's row (the whole row is its link) | The detail page opens at the top, focus on `main` | `/user/watchlist?folder=X` → `/movies/:id` or `/tv/:id` | Q2 fails: the row offers only the status switch and `Remove`; nothing says that moving happens on the detail page |
| A2 | Press `Add to watchlist` | The dialog loads on the first press (spinner icon) and opens: `Choose folders for {title}`, `With no folder, it stays under All titles.`, the line `{title} is already in your watchlist.` and one checkbox per folder, named `{folder}, level {n}` | `/movies/:id` | Q3 fails: the button still says `Add to watchlist` for a saved title |
| A3 | Untick folder X | The box clears; nothing is written yet | `/movies/:id` | Q1 fails: the person thinks "move", the dialog thinks "pick folders"; a person who skips this step ends with the title in both folders |
| A4 | Tick folder Y | The box fills; `Save` becomes enabled | `/movies/:id` | Pass |
| A5 | Press `Save` | `Saving...`, then the dialog closes, focus returns to `Add to watchlist`, and a toast says `{title} is in your watchlist` | `/movies/:id` | Q4 fails: the toast does not name Y and offers no Undo |
| A6 | Press Back | The watchlist returns to folder X (the folder is in the URL); the title is gone from X after the refetch | `/user/watchlist?folder=X` | Pass |

**Path B: move folder F into folder P**

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| B1 | Press folder F in the `Folders` tree | The heading changes to F; the toolbar shows `New folder`, `New subfolder`, `Rename`, `Move`, `Delete` | `/user/watchlist` → `?folder=F` (push) | Q2 fails: on `All titles` the toolbar shows only `New folder`, so nothing hints that folder actions appear after a folder is chosen |
| B2 | Press `Move` | The toolbar gives way to a form: label `Move F to`, a select with focus, `Move` and `Cancel`. The folder list refetches | `?folder=F` | Pass |
| B3 | Open the select | Options are `Top level` (only if F is not at the top already) and each valid folder as a path, such as `Films / Drama`. The current parent, F's own branch and targets past 4 levels are left out | `?folder=F` | Q3 fails: a missing target has no reason shown, and the current place is not marked `Current` |
| B4 | Choose P | The select shows P | `?folder=F` | Pass |
| B5 | Press `Move` | The buttons lock while the write runs; then the form closes, focus returns to the `Move` button, and the tree shows F under P after the refetch | `?folder=F` | Q4 fails: no status message and no Undo; a screen reader user hears only the focused button |

**Decision points:**

- Path A or B: titles have no move control on the watchlist (`apps/user-mfe/src/pages/watchlist/title-list.tsx:118-146`); folders do (`apps/user-mfe/src/pages/watchlist/folder-actions.tsx:106`).
- One folder or several: a title can sit in many folders (`folderIds`), so the dialog adds and removes folders rather than moving the title (`apps/pages-mfe/src/components/watchlist-dialog.tsx:141-146`). Leaving X ticked keeps the title in both.
- Target `Top level`: if F is nested, `Top level` is the first and default option, so B3 and B4 can be skipped (3 presses) (`apps/user-mfe/src/pages/watchlist/folder-actions.tsx:205-207`).
- No valid target: the form shows `There is nowhere to move this folder.` with `Cancel` only (`apps/user-mfe/src/pages/watchlist/folder-actions.tsx:219-235`).
- Cancel: the form closes and focus returns to the toolbar button that opened it (`apps/user-mfe/src/pages/watchlist/folder-actions.tsx:51-55`, `:86`).
- No folders: the dialog says `No folders yet. Create them in your watchlist.` (`apps/pages-mfe/src/components/watchlist-dialog.tsx:165-168`).

**Failure and recovery:**

- A write fails (offline or refused): a toast, `Could not reach the server. Check your connection.` or `Something went wrong. Please try again.` (`packages/api/src/query-client/create-query-client.ts:76-80`). The form or dialog stays open with its choice, `Move` or `Save` takes focus again, and the tree refetches; the person presses again (`apps/user-mfe/src/pages/watchlist/use-folder-write.ts:27-36`, `apps/pages-mfe/src/components/watchlist-dialog.tsx:122-134`). Lite has no write queue, so offline fails at once.
- The folders do not load in the dialog: `Your folders could not be loaded.` with `Try again` (`apps/pages-mfe/src/components/watchlist-dialog.tsx:85-93`).
- The dialog code does not download: toast `The watchlist could not be opened. Reload the page and try again.` (`apps/pages-mfe/src/components/add-to-watchlist.tsx:37-41`).
- The target folder was deleted in another tab: the refetch on opening `Move` drops it from the select (`apps/user-mfe/src/pages/watchlist/folder-actions.tsx:46-48`, `:206-207`).
- A wrong move: none. There is no Undo; the person repeats the whole path in reverse.

**Problems found:**

1. A title cannot be moved from the watchlist. The row has only the status switch and `Remove`; the person must open the title, open `Add to watchlist`, untick, tick and save, then come back: 6 steps against a target of ≤ 3. Q2 fails at A1. Major. `apps/user-mfe/src/pages/watchlist/title-list.tsx:118-146`. Proposal 7.
2. No Undo after either move, against the F4 target. A mistaken move has to be redone by hand. Major. `apps/user-mfe/src/pages/watchlist/use-folder-write.ts:38-44`, `apps/pages-mfe/src/components/watchlist-dialog.tsx:116-118`.
3. A "move" in the dialog is really "add to Y, remove from X". The dialog does not say so; the button reads `Add to watchlist` for a saved title, and the toast `{title} is in your watchlist` does not name the folder. Q1, Q3 and Q4 are weak. Minor. `apps/pages-mfe/src/components/add-to-watchlist.tsx:59`, `apps/pages-mfe/src/components/watchlist-dialog.tsx:117-118`. Related to proposal 11 and open question 2.
4. A folder move takes 5 presses (choose folder, `Move`, open select, choose, `Move`), 2 over the target. Minor. `apps/user-mfe/src/pages/watchlist/folder-actions.tsx:238-266`. Proposal 7.
5. The folder toolbar appears only after a folder is chosen; on `All titles` it shows only `New folder`, with no hint. Q2 fails at B1. Minor. `apps/user-mfe/src/pages/watchlist/folder-actions.tsx:101-114`.
6. Targets that cannot be chosen (current parent, own branch, too deep) are left out silently, instead of being disabled with `Current` or a reason. Q3 fails at B3. Minor. `apps/user-mfe/src/pages/watchlist/folder-actions.tsx:203-205`, `packages/firebase/src/watchlist-tree.ts:95-103`. Proposal 7.
7. A folder move gives no status message: the form closes, focus goes to `Move`, and the tree changes only after a refetch. Q4 fails at B5, above all for a screen reader user. Minor. `apps/user-mfe/src/pages/watchlist/folder-actions.tsx:51-55`, `apps/user-mfe/src/pages/watchlist/use-folder-write.ts:27-31`.

### F5 Mark watched

- **Persona:** A signed-in person who has just watched a saved title and wants to mark it as watched.
- **Entry point:** Watchlist, `/user/watchlist` (the only page with a status control)
- **Preconditions:** Signed in. The title is in the watchlist with the status `Planned` (every new title starts as `Planned`, `packages/firebase/src/watchlist-store.ts:183`).
- **Success state:** The row's switch shows `Watched`; the same status should show on the catalog card and the detail page.
- **Step budget:** target 1–2 presses, with the status on the card, the detail page and the list; today 1 step on the happy path from the list, 3 from a detail page — meets on the list, over by 1 from a detail page; the status shows on the list only
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — one press marks a title watched on the list, but no catalog card or detail page shows the status.

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | Press `Watched` in the row's switch (group `Status of {title}`, segments `Planned` and `Watched`) | The segment turns selected at once, with no spinner and no disabled state, and focus stays on it (ADR-0015). The write runs; on success the cache is patched without a new read. No message. Under the `Planned` filter the row stays until the folder or filter changes | `/user/watchlist` (with any `?folder=` and `?status=`) | Pass |
| 2 | Check: press the title's row to open it | The detail page shows `Add to watchlist`, the same as for an unsaved title; nothing shows the status | `/movies/:id` or `/tv/:id` | Q4 fails: the status the person set is not shown |
| 3 | Check: press `Add to watchlist` | The dialog says `{title} is already in your watchlist.` and lists folders; it shows no status and offers no status control | `/movies/:id` | Q4 fails: no status |
| 4 | Check: go to Home or Movies and find the title's card | The card shows the same bookmark icon, named `Add {title} to your watchlist`, saved or not, planned or watched | `/`, `/movies`, `/tv`, `/search` | Q4 fails: no saved or watched state |

Steps 2–4 check the target "the status shows on the card, the detail page and the list". They are not part of the happy path.

**Decision points:**

- Where the person starts: from the watchlist, 1 press. From a detail page or a card there is no status control, so the person goes `Profile` → `Open watchlist` → finds the row → `Watched`: 3 presses and maybe a folder choice (see F7).
- Filter on or off: under `?status=planned` the changed row stays in place, so a second tap cannot hit the next row (`apps/user-mfe/src/pages/watchlist/use-status-filter.ts:36-50`). It leaves when the view changes.
- Press the selected segment again: nothing happens; one segment always stays selected (`packages/ui/src/components/ui/toggle-group.tsx:22-25`).
- Back to `Planned`: the same switch, 1 press. This is the only undo.

**Failure and recovery:**

- The write fails (offline, network, rules): a toast, `Could not reach the server. Check your connection.` or `Something went wrong. Please try again.` (`packages/api/src/query-client/create-query-client.ts:76-80`). The segment goes back to the saved status, and the list refetches (`apps/user-mfe/src/pages/watchlist/use-title-status.ts:33-35`). The person presses again.
- The title was removed in another tab: the write is refused and the refetch removes the row (`packages/firebase/src/watchlist-store.ts:203-205`).
- Several fast presses: writes of one title run in order, so the last press wins (`apps/user-mfe/src/pages/watchlist/use-title-status.ts:16-17`).
- The watchlist does not load: the page shows `Something went wrong` with `Try again` (`packages/ui/src/components/page-error-fallback.tsx:26-38`).

**Problems found:**

1. Catalog cards never show the saved state or the status: the button keeps the bookmark icon and the name `Add {title} to your watchlist`. The F5 target "status shows on the card" is missed. Major. `apps/pages-mfe/src/components/add-to-watchlist.tsx:52`, `apps/pages-mfe/src/components/add-to-watchlist.tsx:58`. Proposal 11.
2. The detail page shows no status either: the button still reads `Add to watchlist`, and the dialog says only `{title} is already in your watchlist.` and has no status control. The F5 target "status shows on the detail page" is missed, and a person who has just watched something on the detail page cannot mark it there. Major. `apps/pages-mfe/src/components/add-to-watchlist.tsx:59`, `apps/pages-mfe/src/components/watchlist-dialog.tsx:160-164`. Proposal 11.
3. From a detail page, marking watched takes 3 presses (`Profile`, `Open watchlist`, `Watched`) plus finding the row, 1 over the target, because the watchlist has no link in the global navigation. Minor. `packages/ui/src/components/header.tsx:22-27`.
4. The switch gives no sign that the write landed: no spinner (by design, ADR-0015) and no message; only a failure speaks, through a generic toast. A screen reader user hears the segment change, not the save. Q4 is weak. Minor. `apps/user-mfe/src/pages/watchlist/use-title-status.ts:20-31`, `apps/user-mfe/src/pages/watchlist/title-list.tsx:119-134`.

### F6 Cross-links

- **Persona:** A person who liked an actor in a movie and wants to see what else they made, then find something like it.
- **Entry point:** Movie Detail, `/movies/:id`
- **Preconditions:** Signed in or not (no difference); the movie has cast, the person has credits, the second title has recommendations or similar titles.
- **Success state:** A third title page reached from More like this, each move a real URL that Back undoes.
- **Step budget:** target 1 press for each move between title, person and similar titles; today 3 steps on the happy path (one per move) — meets
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — each move is one press on a link to a stable URL; the weak points are hidden card titles on a fine pointer and dead ends on titles with no cast or similar titles.

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | Scroll past Where to watch to Cast; press a cast card (photo, name, character) | The person page loads with one skeleton; it starts at the top and focus moves to `main`. Hero: photo, name, known for, born/died/place lines, Biography (`Show more` over 600 characters); below: Known for (a row of up to 12 cards) and Filmography (30 rows, `Show all N credits`) | `/movies/:id` → `/person/:id` | Pass |
| 2 | Press a card in Known for (scroll the row sideways if needed), or a title row in Filmography | The title page opens at the top; a TV credit opens `/tv/:id`. The poster morphs from the card | `/movies/:id2` or `/tv/:id2` | Q2 fails on a fine pointer: Known for card titles are hidden until hover or focus |
| 3 | Scroll to More like this (after Where to watch, Cast, Videos and images); press a card | The other title opens at the top, focus on `main` | `/movies/:id3` | Q2 fails on a fine pointer: same hidden card titles |
| — | Back (not counted) | Pop: each page returns from the cache at the scroll position the browser restores; on Person an open Filmography stays open through `?credits=all` | previous URL | Pass |

**Decision points:**

- Step 1, the crew line above the cast (`Directors and writers`): each name is a text link to `/person/:id` with all their jobs; on TV Detail creators come first as `Creator`.
- Step 1, the person the reader wants is not in the first 12 by billing: there is no full cast list and no other link to them (`packages/ui/src/lib/mappers/credits.ts:7`, `21`).
- Step 2, Known for or Filmography: Known for has the 12 titles with the most votes; Filmography lists every credit and links each row by media type (`packages/ui/src/lib/mappers/person-credits.ts:115`). `Show all N credits` writes `?credits=all` with replace and moves focus to the first new row.
- Step 3, More like this shows recommendations, or similar titles when there are none, at most 12, of the same media type (`packages/ui/src/lib/mappers/more-like-this.ts:4`, `17`).
- Any card in Known for or More like this also has the bookmark button `Add {title} to your watchlist`, which opens the save dialog instead of navigating (see F1, F3).
- Genres in the hero are plain text, not links, so there is no move from a title to its genre list (`packages/ui/src/components/movie-detail-view.tsx:80-91`).

**Failure and recovery:**

- A page fails to load: the page boundary shows a message with `Try again`; an unknown id shows `NotFound`. Back returns to the previous page.
- A movie with no cast and no similar titles: Cast says `No cast listed yet.` and More like this `No similar titles yet.`; the page offers no link to another entity, only the header (`packages/ui/src/components/cast-section.tsx:51-52`, `packages/ui/src/components/more-like-this-section.tsx:16-21`).
- A person with no credits: `No titles to show yet.` and `No credits listed.`; again only the header (`packages/ui/src/components/known-for-section.tsx:16-21`).
- Offline: the global banner `You are offline. Showing saved results.`; pages already in the cache still open.

**Problems found:**

1. On a fine pointer, card titles and years in Known for and More like this are hidden until hover or focus, so the reader chooses by poster alone. Fails Q2 at steps 2 and 3. Minor. `packages/ui/src/components/movie-card.tsx:42-46`, `95-111`.
2. A title with no cast and no recommendations, or a person with no credits, is a dead end: its sections keep their headings over one muted line and offer no link. Misses "no entity page is a dead end: ≥ 2 links to other entities". Minor. `packages/ui/src/components/cast-section.tsx:51-52`, `packages/ui/src/components/more-like-this-section.tsx:16-21`, `packages/ui/src/components/known-for-section.tsx:16-21`.
3. Only the first 12 cast members link to their pages, with no full cast list, so a supporting actor cannot be reached from the title. Minor. `packages/ui/src/lib/mappers/credits.ts:7`, `21`.
4. Hero genres are plain text, not links to `/movies?genre=<id>`, though Home already links genres that way. A missed cross-link, not a failed target. Minor. `packages/ui/src/components/movie-detail-view.tsx:80-91`.

### F7 Back to the watchlist

- **Persona:** A person browsing the catalog who wants to see their watchlist; either already signed in or a guest who has one from an earlier session.
- **Entry point:** Any catalog page, such as Movie Detail `/movies/:id`, Movies `/movies` or Home `/`
- **Preconditions:** Path A: signed in. Path B: not signed in in this browser, with a Google account that has a watchlist.
- **Success state:** The Watchlist page with the heading `Watchlist`, the `Folders` tree and the title count.
- **Step budget:** target 1 press from the global navigation; today 2 presses signed in, 3 as a guest (the Google screens do not count) — over by 1 (A) and by 2 (B)
- **Walkthrough:** 2026-11-20, code walkthrough at `bd1e7a5` — the header has no Watchlist link, so every path goes through Profile, and the entry is an avatar icon named `Profile` or `Sign in`.

**Path A: signed in**

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| A1 | Press the avatar icon in the header (accessible name `Profile`) | Profile opens: `User Profile`, name, email, a `Watchlist` section with counts and `Open watchlist`, then `Settings` and sign out | `/movies/:id` → `/user/profile` | Q2 fails: nothing in the header is named Watchlist, and the main nav holds only `Home`, `Movies`, `TV Shows` |
| A2 | Press `Open watchlist` | The Watchlist page opens at `All titles`; focus moves to `main` | `/user/profile` → `/user/watchlist` | Q4 is weak: no header item is marked current on this page |

**Path B: guest**

| # | User action | System response | URL | Walkthrough |
| --- | --- | --- | --- | --- |
| B1 | Press the icon in the header (accessible name `Sign in`) | Sign in opens: `Sign in`, `Keep your watchlist with your Google account.`, `Continue with Google` | `/movies/:id` → `/auth/login` | Q2 fails: nothing says this is the way to the watchlist |
| B2 | Press `Continue with Google`, finish in the popup | The button locks while the popup is open; after sign-in the page sends the person to Profile, as the header link passed no return path | `/auth/login` → `/user/profile` (replace) | Q3 fails: the person wanted the watchlist and lands on Profile |
| B3 | Press `Open watchlist` | The Watchlist page opens | `/user/profile` → `/user/watchlist` | Pass |

**Decision points:**

- Phone or desktop: the avatar icon stays visible outside the menu on every width (`packages/ui/src/components/header.tsx:117-139`); the phone menu lists only `Home`, `Movies`, `TV Shows` (`packages/ui/src/components/header.tsx:154-163`).
- Footer: its `Account` column lists `Profile` and `Settings`, no Watchlist (`packages/ui/src/components/footer.tsx:26-32`). Same 2 presses, after a scroll to the bottom.
- From a card or the detail page (signed in): `Add to watchlist` → dialog → `Open watchlist` is also 2 presses, once the folders load (`apps/pages-mfe/src/components/watchlist-dialog.tsx:214-223`).
- A typed or bookmarked `/user/watchlist`: a guest is sent to Sign in with the return path and comes back to the watchlist after sign-in (`apps/user-mfe/src/components/require-auth.tsx:17-19`, `apps/user-mfe/src/pages/login.tsx:21`).
- A guest who presses `Add to watchlist` gets `Sign in` in the dialog, which returns to the catalog page, not the watchlist (`apps/pages-mfe/src/components/watchlist-dialog.tsx:61-73`).

**Failure and recovery:**

- Popup closed: nothing happens and no message shows; the button unlocks and the person can press it again (`packages/firebase/src/auth.ts:53`, `apps/user-mfe/src/pages/login.tsx:24-33`).
- Popup blocked: `Allow pop-ups for this site and try again.` under the button (`packages/firebase/src/errors.ts:33-36`, `apps/user-mfe/src/pages/login.tsx:43-47`).
- Sign-in fails for another reason: a message such as `Could not reach the server. Check your connection.`; the person presses again.
- The session is still restoring: the header already links to Profile; the page shows a skeleton until the state is known, then the page or Sign in (`apps/user-mfe/src/components/require-auth.tsx:16-19`).
- The watchlist does not load: `Something went wrong` with `Try again` (`packages/ui/src/components/page-error-fallback.tsx:26-38`). On Profile the counts fail on their own with a section error, and `Open watchlist` still works (`apps/user-mfe/src/pages/profile/profile-page.tsx:56-64`).
- The account remote does not load: `This section is unavailable` with `Try again` (`apps/host/src/remotes/remote-unavailable.tsx:12-16`).

**Problems found:**

1. The global navigation has no Watchlist link, on desktop, in the phone menu or in the footer. A signed-in person needs 2 presses through Profile, against a target of 1, and Q2 fails at the first step. Major. `packages/ui/src/components/header.tsx:22-27`, `packages/ui/src/components/footer.tsx:26-32`. It misses the § 2 targets "Primary navigation" and "Watchlist reach". Proposal 19.
2. The header's `Sign in` link passes no return path, so a guest lands on Profile after sign-in and needs a third press for the watchlist. Q3 fails at B2. Minor. `packages/ui/src/components/header.tsx:117-118`, `apps/user-mfe/src/pages/login.tsx:21`. Proposal 21.
3. The only entry is an avatar icon named `Profile` (or `Sign in`); on the Watchlist page no header item is current, so the person gets no "you are here" cue from the navigation. Q2 and Q4 are weak. Minor. `packages/ui/src/components/header.tsx:119`.
4. After a closed popup, the sign-in page says nothing, and focus may drop to the page because the locked button lost it. § 1.3 asks that focus return to the control the person pressed. Minor. `apps/user-mfe/src/pages/login.tsx:40`, `packages/firebase/src/auth.ts:53`. Related to proposal 3.
