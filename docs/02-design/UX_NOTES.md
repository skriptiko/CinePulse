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
- `CategoryPills` — selectable genre pills (Movies); `CategoryLinks` — the same pills as links (Home: each genre opens `/movies?genre=<id>`)

**Application frame:**
- `Header`, `Footer`, `AppLayout` — page shell
- `PageBoundary` / `AsyncBoundary` (page and section loading + errors), `ShellBoundary` (host), `PageErrorFallback`, `NotFound`
- `PageSkeleton`, `MovieGridSkeleton` (pages) and `HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton` (Home sections) — shown after 300 ms; `SectionErrorFallback` — inline error of one section

Utilities: `cn` (class merging), the `to…Data` mappers in `lib/mappers/` (TMDB → UI models).

## Theme and tokens

The theme is **dark-first**, built on Tailwind CSS variables (`packages/ui/src/styles/globals.css`). Components use semantic tokens rather than raw colors:
- surfaces: `bg-background`, `bg-secondary`, `bg-accent`
- text: `text-foreground`, `text-muted-foreground`
- borders: `border-border`

The theme lives in the shared store (`@repo/events`, `theme`: `light | dark | system`, default `dark`). The header toggle (`aria-pressed`) switches light/dark; `AppLayout` mirrors the resolved theme onto `<html class="dark">`, and `system` follows `prefers-color-scheme`. The choice is not persisted yet (Settings page, CIN-29).

## Style isolation

Each MFE uses **Tailwind scoping with unique ID prefixes** so that one MFE's styles do not conflict with another's when loaded into the shared shell. Each application has its own `styles/globals.css` and root element (`#root`, `#mfe-pages-root`, etc.).

## Mockups

> ⬜ ⚠️ **needs my input.** There are no formal mockups (Figma/Sketch).
> To fill in: links to design files (if any), or a statement that the source of truth is the implementation in `@repo/ui`. If needed, define the design tokens formally (palette, typography, spacing).

## UI states

🟡 Partially unified:
- **Loading:** every page or Home section suspends into a skeleton shaped like it. The layout is reserved at once and the skeleton appears after 300 ms, so fast loads do not flicker.
- **Empty:** implemented in **Movies**: `No movies found for “…”` names the search query, with **Clear search** and **Reset filters**. Other pages have no empty states.
- **Error:** without data, the page boundary shows a plain message with **Try again** (404 → `NotFound`); the host's `ShellBoundary` catches the rest and keeps the header; a failed background refetch keeps the data and shows one toast (bottom right).
- **Offline:** one global banner at the bottom, "You are offline. Showing saved results."

- **Load more** (Movies): the button is disabled with a spinner while a page loads; a failed next page keeps the loaded movies and shows an inline error with **Try again** (no toast); at the end of the list the button gives way to "That's all".

- **Home sections** load and fail independently: each has its own skeleton (`HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton`) and an inline `SectionErrorFallback` with **Try again**; one failed row never blanks the page. All requests start together (`usePrefetchQuery` in the page).

## Movies: search, genre and sort

- Genre and sort are applied by TMDB (`/discover/movie`), not to the loaded pages, so the results and the "N movies found" counter (`total_results`) cover the whole catalog.
- The state lives in the URL: `q` (search, debounced 300 ms, written with replace), `genre` (TMDB genre id) and `sort` (`popular` | `newest` | `rating`), both written with push, so Back/Forward and shared links restore the view. Missing or invalid values fall back to every genre / Popular.
- TMDB search has no genre or sort: while a query is typed, the genre pills and the sort menu are disabled, with a one-line hint. The genre and sort stay in the URL and apply again once the search is cleared.
- "Rating" needs at least 200 votes; "Newest" lists films released by today, not announced ones.
- While new results load, the current ones stay on screen dimmed (`aria-busy`); the counter is a persistent `role="status"` (`<output>`) region.

## Accessibility

> ⬜ No formal a11y audit has been carried out.
- Semantic elements (`<main>`, `<h1>`, `<button type="button">`) and Radix components (with built-in a11y support) are used.
- Not verified: contrast in the dark theme, keyboard navigation across the whole application, focus management. The Movies grid/compact toggle has `aria-label` and `aria-pressed`.
- TODO: run axe / Lighthouse, define the target WCAG level.
