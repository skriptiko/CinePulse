🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# UX Notes

Design and UX notes. The design system is implemented in code (`packages/ui`) and can be treated as the source of truth; there are no formal mockups (Figma).

## Design system components


The design system lives in `@repo/ui` (`packages/ui/src`). Stack: **Shadcn UI + Radix UI + Tailwind CSS**, icons from `lucide-react`.

**Primitives (UI kit):**
- `Button` (+ `buttonVariants`), `Input`
- `DropdownMenu` (`Trigger`, `Content`, `RadioGroup`, `RadioItem`)
- `Skeleton`

**Domain components (movies):**
- `MovieCard` — movie card (UI model `MovieCardData` from `toMovieCardData` / `toTvCardData`)
- `Hero` — main banner
- `ContentRow` — horizontal row of cards
- `FeaturedGrid` — grid of curated picks ("Editor's Picks")
- `CategoryPills` — selectable genre pills (Movies, TV Shows); `CategoryLinks` — the same pills as links (Home: each genre opens `/movies?genre=<id>`)
- `MovieDetailView` — the hero of a details page, with a slot below it for sections
- `WatchProvidersSection`, `SeasonsSection`, `CastSection`, `MediaSection`, `MoreLikeThisSection`, `ReviewsSection` — the sections of a details page, built on `DetailSection`, with neutral names: Movie Detail and TV Detail share them, and `SeasonsSection` is on TV Detail only
- `ExternalLink` — opens in a new tab with `rel="noopener noreferrer"` and says so to a screen reader

**Application frame:**
- `Header`, `Footer`, `AppLayout` — page shell
- `PageBoundary` / `AsyncBoundary` (page and section loading + errors), `ShellBoundary` (host), `PageErrorFallback`, `NotFound`
- `PageSkeleton`, `MovieGridSkeleton` (pages) and `HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton` (Home sections) — shown after 300 ms; `SectionErrorFallback` — inline error of one section

Utilities: `cn` (class merging), the `to…Data` mappers in `lib/mappers/` (TMDB → UI models).

## Theme and tokens

The theme is **dark-first**, built on Tailwind CSS variables (`packages/ui/src/theme.css`). Components use semantic tokens rather than raw colors:
- surfaces: `bg-background`, `bg-secondary`, `bg-accent`
- text: `text-foreground`, `text-muted-foreground`
- borders: `border-border`

The theme lives in the shared store (`@repo/events`, `theme`: `light | dark | system`, default `dark`). The header toggle (`aria-pressed`) switches light/dark; `AppLayout` mirrors the resolved theme onto `<html class="dark">`, and `system` follows `prefers-color-scheme`. The choice is not persisted yet (Settings page, CIN-29).

## Style isolation

In the integration the host builds one stylesheet for every remote, so MFE styles cannot conflict; see [ADR-0009](../03-architecture/decisions/ADR-0009-tailwind-4-style-isolation.md). Each application has its own `styles/globals.css`, used for standalone development in the remotes.

## Mockups

> ⬜ ⚠️ **needs my input.** There are no formal mockups (Figma/Sketch).
> To fill in: links to design files (if any), or a statement that the source of truth is the implementation in `@repo/ui`. If needed, define the design tokens formally (palette, typography, spacing).

## UI states

🟡 Partially unified:
- **Loading:** every page or Home section suspends into a skeleton shaped like it. The layout is reserved at once and the skeleton appears after 300 ms, so fast loads do not flicker.
- **Empty:** implemented in **Movies** and **TV Shows**: `No movies found for “…”` names the search query, with **Clear search** and **Reset filters**, and a long query wraps. The watchlist says `No titles here yet.`, or `No watched titles here.` under a filter, which the All pill right above it clears. Each section of **Movie Detail** and **TV Detail** keeps its heading over one muted line. Other pages have no empty states.
- **Error:** without data, the page boundary shows a plain message with **Try again** (404 → `NotFound`); the host's `ShellBoundary` catches the rest and keeps the header; a failed background refetch keeps the data and shows one toast (bottom right).
- **Offline:** one global banner at the bottom, "You are offline. Showing saved results."

- **Load more** (Movies, TV Shows): the button is disabled with a spinner while a page loads; a failed next page keeps the loaded titles and shows an inline error with **Try again** (no toast); at the end of the list the button gives way to "That's all".

- **Home sections** load and fail independently: each has its own skeleton (`HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton`) and an inline `SectionErrorFallback` with **Try again**; one failed row never blanks the page. All requests start together (`usePrefetchQuery` in the page).

## Movies and TV Shows: search, genre and sort

Both pages are built from `apps/pages-mfe/src/components/catalog/`, so they differ only in their words, genre list and requests.

- Genre and sort are applied by TMDB (`/discover/movie`, `/discover/tv`), not to the loaded pages, so the results and the "N movies found" counter (`total_results`) cover the whole catalog.
- The state lives in the URL: `q` (search, debounced 300 ms, written with replace), `genre` (TMDB genre id) and `sort` (`popular` | `newest` | `rating`), both written with push, so Back/Forward and shared links restore the view. Missing or invalid values fall back to every genre / Popular.
- TMDB search has no genre or sort: while a query is typed, the genre pills and the sort menu are disabled, with a one-line hint. The genre and sort stay in the URL and apply again once the search is cleared.
- "Rating" needs at least 200 votes; "Newest" lists films released by today and shows first aired by today, not announced ones.
- While new results load, the current ones stay on screen dimmed (`aria-busy`); the counter is a persistent `role="status"` (`<output>`) region.

## Movie Detail: sections

- Under the hero, in this order: Where to watch, Cast, Videos and images, More like this, Reviews. They come from one request, so they arrive together with the hero and share its skeleton and its **Try again** ([ADR-0017](../03-architecture/decisions/ADR-0017-detail-page-sections.md)).
- **Empty:** a section is never hidden. It keeps its heading and one muted line, so the page has the same shape for every title. The line of Where to watch names the country.
- **Where to watch:** the region comes from the browser language, with the US as the fallback and no picker. It shows Stream, Rent and Buy, with logos and names, a link to the page on TMDB, and `Streaming data by JustWatch`, which the terms of TMDB require. A country with only ad-supported or free offers counts as empty.
- **Cast:** the first 12 by billing order, each linking to the person. Above them, one line of directors and writers, with each person once and all their jobs. With crew but no cast, the crew stays and the empty line follows it.
- **Videos and images:** YouTube trailers, then teasers, official first, at most 6, each a link that opens YouTube. No player runs on the page. The first 12 backdrops open the original image in a new tab.
- **More like this:** recommendations, or similar titles when there are none, at most 12. It is a Home row, on the gutter of this page.
- **Reviews:** the first 3, as plain text clamped to six lines. Markdown stays as the author typed it, and `Read the full review` opens the original.
- External text is rendered as text, and a link from TMDB that is not https is left out.
- A press on a card in More like this opens the other movie at the top of the page. Back returns to where the reader was.

## TV Detail: sections

Everything under Movie Detail holds here too, with TV cards in More like this. What differs:

- Under the hero, in this order: Where to watch, Seasons, Cast, Videos and images, More like this, Reviews.
- **Hero:** the year is of the first air date. Where a movie has its runtime, a show has its seasons and episodes, such as `3 seasons, 24 episodes`, with correct singulars. A count TMDB does not know, or sends as 0, is left out.
- **Seasons:** poster, name, air year, episode count and an overview clamped to three lines, in the order of TMDB with season 0 (Specials) last. Empty: `No seasons listed.`
- **Cast:** each creator stands first in the line of directors and writers, as `Creator`, because a show usually lists no director. A person who also directs or writes shows once, with both jobs.

## Watchlist: status

- A row has a two-segment switch under its title, which writes at once. It has no spinner and is never disabled, so focus stays on it (ADR-0015).
- The filter uses pills, so it does not look like the switch.
- A row changed under a filter stays until the folder or the filter changes, as a free undo and so that a double tap cannot reach the next row.
- `Remove` sits beside the switch and asks first, because a removal has no undo: `addedAt` and the status would be lost. Focus then moves to the heading, and the page does not scroll.
- `<output>` above the list always holds the count or the empty message, and is the live region for a filter press.
- In forced colours, a chosen segment or pill takes the system highlight, as forced colours would remove its fill and ring.

## Profile

- The account comes from `globalStore` and shows at once. The watchlist counts load and fail on their own, with a section error and `Try again`, so a Firestore failure leaves the account and the links working.
- The counts use the queries of the watchlist page, so visiting both reads every title once within the stale time.
- With no titles, the section says so and links to Movies instead of showing zeros.

## Settings

- A theme applies at once and stays between sessions, with no Save button. `System` follows the device, and the header toggle changes the same value.

## Accessibility

> ⬜ No formal a11y audit has been carried out.
- Semantic elements (`<main>`, `<h1>`, `<button type="button">`) and Radix components (with built-in a11y support) are used.
- A navigation to another page moves focus to `main` and starts that page at the top. Back keeps the position the browser restores, and a change of the query alone moves neither.
- Not verified: contrast in the dark theme, keyboard navigation across the whole application, focus management. The grid/compact switch of Movies and TV Shows is a radio group with an `aria-label`.
- TODO: run axe / Lighthouse, define the target WCAG level.
