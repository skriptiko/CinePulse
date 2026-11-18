🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Figma workflow

How the design lives in Figma and how a change reaches the code. The decision is [ADR-0019](../03-architecture/decisions/ADR-0019-figma-design-source-of-truth.md).

**File:** [CinePulse](https://www.figma.com/design/fhJ2HsroPBivgDcshCTuku) in the team project `CinePulse` (the owner's team, Professional plan, Full seat).

## Source of truth

| Question | Answered by |
| --- | --- |
| How it looks: colour, type, spacing, radius, layout, states | Figma |
| How it behaves: data, routing, a11y semantics, focus, loading order | Code (`@repo/ui`, the MFEs) and [UX_NOTES](./UX_NOTES.md) |
| Token values | Figma variables, mirrored one to one in `packages/ui/src/theme.css` |

The bootstrap is done (CIN-132…135, 2026-11-18): the file mirrors every token, component and page of the app, so a visual change now starts in Figma. Images in the screens are placeholders until real TMDB images are added.

## File structure

| Page | Holds |
| --- | --- |
| `Cover` | File name, status, link to this document |
| `——— DESIGN SYSTEM ———` | Separator |
| `Foundations` | Variables and styles, with a specimen of each token group in both modes |
| `Primitives` | One section per `components/ui/*` component: Button, Input, DropdownMenu, Dialog, ToggleGroup, Skeleton |
| `Components` | The domain components and the page frame: MovieCard, Hero, Header, Footer, detail sections… |
| `Test Images` | The test image pack that fills every image in the file: posters, backdrops, portraits, provider logos |
| `——— SCREENS ———` | Separator |
| `Home`, `Movies`, `TV Shows`, `Movie Detail`, `TV Detail`, `Person`, `Search`, `Watchlist`, `Profile`, `Settings`, `Login`, `Not Found` | One page per route of `ROUTE_PATHS`: frames at 1920, 1440 and 390 (see [Screen sizes](#screen-sizes)), plus the loading, empty and error states the page has, built only from component instances. A frame is named `<Page> — Desktop 1920 — <state>`, `<Page> — Desktop 1440 — <state>` or `<Page> — Mobile 390 — <state>` |
| `——— WORK ———` | Separator |
| `Explorations` | Work in progress. Nothing here is implemented; a design moves to the pages above once it is agreed |

A new route gets its own page. `Explorations` is where a redesign is drawn before it replaces the component or screen it changes; Figma branching is an Organization feature.

## Screen sizes

The design and the code support three widths; every screen page has a frame for each:

| Frame | Width | What it checks |
| --- | --- | --- |
| Mobile | 390 | The phone layout: one column, the mobile Header and Footer, `fluid-*` text at the bottom of its `clamp()` |
| Desktop | 1440 | The laptop layout from `xl`: `fluid-*` text at the top of its `clamp()` |
| Full HD | 1920 | The `2xl` layout (1536 and up). Capped content stops at `max-w-page` (1800, `--container-page`), so it gains 60 on each side: Header, Footer, the Hero content, the detail views and their sections, Editor's Picks and the account pages. Full-width content grows: a Home row shows more `w-48` cards, a catalog grid keeps 6 columns and its cards widen. `2xl` steps: Cast in 12 columns (`CAST_LIMIT`). Type is the same as at 1440 |

Widths in between are not drawn: the breakpoints of the code decide them. A new screen gets all three frames; its loading, empty and error states are drawn at least at 1440 and 1920.

## States on a screen page

A screen page holds one Figma section per state, so a state is easy to find and every screen size of it sits side by side:

- **Section:** named after the state (`Default`, `Loading`, `Error`…). A screen with several default views, such as the Search tabs, names the view first: `Results, People tab`, `No results, Movies tab`.
- **Columns:** inside a section the frames stand left to right: 390 at x = 160, 1440 at x = 670, 1920 at x = 2230. A state drawn only at 1440 and 1920 leaves the 390 column empty.
- **Order:** sections run top to bottom from the usual view to the rare one: default views, `Loading`, empty states, `Not found`, `Error`, section errors, list states (`Load more`, `End of list`), `Offline`, the forms and dialogs, then the app-level failures (`Remote unavailable`, `App crash`).
- **Frame name:** `<Page> — <Mobile 390|Desktop 1440|Desktop 1920> — <State>`. The app-level failures on `Not Found` are `App — …`, as they are not tied to a route.

Each state copies its text from the code, so the frame shows what the user reads:

| Page | States besides Default |
| --- | --- |
| Home | Loading, Section error (Trending and Editor's Picks fail), Offline (the offline banner) |
| Movies, TV Shows | Loading, Empty search, Empty filters, Error, Load more loading, Load more failed, End of list |
| Movie Detail, TV Detail | Loading, Empty sections (every section shows its `DetailSection` empty text), Not found, Error, and on Movie Detail the watchlist dialog: signed out, folders, saving |
| Person | Loading, Empty sections, Not found, Error |
| Search | Before a query, Loading results, No results (Movies and People tabs), Results error |
| Watchlist | Loading, Empty, Error, Filter empty, Folder rename, Folder move, Folder delete, Remove confirm |
| Profile | Loading, Stats loading, Stats error, Stats empty |
| Settings | Loading |
| Login | Loading, Error, Popup blocked |
| Not Found | Page error, Remote unavailable, App crash |

A new state goes into its own section in this order. A state the code adds is drawn in the same ticket.

## Tokens

- **Colour:** collection `Color`, modes `Dark` (default, as the app is dark-first) and `Light`. Each variable carries the name of its CSS variable without the dashes: `background`, `muted-foreground`, `glass-border`, plus `rating` (`--color-rating`). Code syntax is the Tailwind theme variable, `var(--color-background)`, so `get_design_context` names the class the code already uses (`bg-background`). A frame shows the light theme by setting the `Light` mode on it.
- **Radius:** collection `Radius`: `radius-none` = 0, `radius-sm` = 4, `radius-md` = 6, `radius-lg` = 8 (`--radius` and its `calc()` steps), `radius-full` for pills and avatars.
- **Spacing:** collection `Spacing`, the Tailwind 4 scale (`--spacing` = 4 px), named after the class step: `1` = 4, `2` = 8, `4` = 16, `6` = 24…; a half step is `0-5`, `1-5`, `2-5`. A value off the scale in a design is a question, not a new token.
- **Type:** Geist, text styles named after their Tailwind classes: `text-sm/medium` is `text-sm font-medium`, for `xs`…`3xl` and `6xl` in four weights. The fluid utilities have one style for each end of their `clamp()`: `fluid-heading/mobile` (390 frames) and `fluid-heading/desktop` (1440 and 1920 frames), bold and tight like their headings in code.
- **Effects:** `shadow-xs`, `shadow`, `shadow-md`, `shadow-lg` (the Tailwind 4 values) and `glass-blur`, the `backdrop-filter: blur(20px)` of `glass` and `glass-bar`, used with the `glass`/`glass-bar` fill and the `glass-border` stroke.

A new token is added in Figma and in `theme.css` in the same ticket. Never bind a raw colour in a component; a one-off colour in an exploration is fine until it is agreed.

## Components

- A Figma component carries the name of its code component (`Button`, `MovieCard`) and its file path in the description (`packages/ui/src/components/ui/button.tsx`).
- Variant properties use the names and values of the code props: `variant=default|destructive|outline|secondary|ghost|link`, `size=default|sm|lg|icon|icon-sm|icon-lg`. A state the code draws (`hover`, `focus-visible`, `disabled`) is a `state` property.
- A domain component takes the content of its UI model (`MovieCardData`: title, year, rating, poster) as text and instance-swap properties, not as variants.
- Icons are `lucide-react`, the same as the code: `Icon/<Name>` components at 16 px (`size-4`), swapped with instance-swap properties. An icon the code starts to import is added on the `Primitives` page.
- Components that change with the breakpoint (Header, Footer, Hero, ContentRow, the details views and sections, the skeletons) have a `viewport=desktop|mobile` variant at 1440 and 390. Those whose inner grid changes at 1920 also have `viewport=wide`: MovieDetailView, CastSection, MediaSection, SeasonsSection, MovieGridSkeleton, HeroSkeleton, FeaturedGridSkeleton and ContentRowSkeleton. The others are widened in the 1920 frame.
- Images (posters, backdrops, photos, provider logos) are `Image Placeholder` instances, filled with the test images of the `Test Images` page: soft 3D clay renders with rounded shapes, studio light and soft shadows. Every image has its own subject and its own palette (red, green, pink, teal, purple, orange, blue), so a screen shows how the UI reads next to many colours in both the `Dark` and the `Light` mode; neighbouring cards get different images. 2:3 posters and portraits, 16:9 backdrops (also the media thumbnails) and square provider logos. The art is fictional, so a design never shows a real poster or a real person. A new image in the pack keeps the same style and goes on that page first. An image keeps the size its component has in `@repo/ui` (a Hero or a backdrop fills its frame, a detail poster is `w-64`, a provider logo `size-10`): never reset the overrides of an `Image Placeholder`, it brings back the default 192×288.
- Gradients over images use the dark background color directly: a gradient stop bound to a variable loses its alpha in Figma.
- Components follow the dark spec, as the app is dark-first. Where a component differs in light beyond its tokens (a `dark:` class in code), its description says so.

### Component map and Code Connect

The Professional plan has Code Connect (one framework at a time, React here). It needs the components published as a team library, so it is set up once the components exist (CIN-133/134): then `get_design_context` returns `<Button variant="outline">` from `@repo/ui` instead of fresh markup. Until then, and as the index either way, this table links each Figma component to its code. Update it when a component is added or renamed, on either side.

| Figma | Code | In Figma |
| --- | --- | --- |
| Button, Icon Button | `packages/ui/src/components/ui/button.tsx` | ✅ |
| Input | `packages/ui/src/components/ui/input.tsx` | ✅ |
| Dropdown Menu, Dropdown Menu Radio Item | `packages/ui/src/components/ui/dropdown-menu.tsx` | ✅ |
| Dialog | `packages/ui/src/components/ui/dialog.tsx` | ✅ |
| Toggle Group, Toggle Group Item | `packages/ui/src/components/ui/toggle-group.tsx` | ✅ |
| Skeleton | `packages/ui/src/components/ui/skeleton.tsx` | ✅ |
| Icon/* (20 icons) | `lucide-react`, the icons the app imports | ✅ |
| Logo | `packages/ui/src/components/logo.tsx` | ✅ |
| Image Placeholder | `packages/ui/src/components/image-placeholder.tsx` | ✅ |
| MovieCard, Rating Badge | `packages/ui/src/components/movie-card.tsx` | ✅ |
| PersonCard | `packages/ui/src/components/person-card.tsx` | ✅ |
| Hero | `packages/ui/src/components/hero.tsx` | ✅ |
| ContentRow, Carousel Arrow | `packages/ui/src/components/content-row.tsx` (also MoreLikeThisSection, KnownForSection) | ✅ |
| Featured Tile | `packages/ui/src/components/featured-grid.tsx` | ✅ |
| Category Pill, Category Pills | `packages/ui/src/components/category-pills.tsx` | ✅ |
| Header, Nav Link, Avatar | `packages/ui/src/components/header.tsx` | ✅ |
| Footer | `packages/ui/src/components/footer.tsx` | ✅ |
| MovieDetailView, Genre Chip | `packages/ui/src/components/movie-detail-view.tsx` | ✅ |
| PersonDetailView | `packages/ui/src/components/person-detail-view.tsx`, `biography-section.tsx` | ✅ |
| WatchProvidersSection, CastSection, MediaSection, SeasonsSection, ReviewsSection, FilmographySection | `packages/ui/src/components/*-section.tsx` | ✅ |
| Detail Section Empty | `packages/ui/src/components/detail-section.tsx` | ✅ |
| Section Error Fallback, Page Error Fallback | `section-error-fallback.tsx`, `page-error-fallback.tsx` | ✅ |
| NotFound | `packages/ui/src/components/not-found.tsx` | ✅ |
| HeroSkeleton, ContentRowSkeleton, FeaturedGridSkeleton, MovieDetailSkeleton, MovieGridSkeleton, PageSkeleton | `packages/ui/src/components/page-skeletons.tsx` | ✅ |
| Add to Watchlist | `apps/pages-mfe/src/components/add-to-watchlist.tsx` | ✅ |

## The loop: from a design change to the code

1. **Design.** Draw the change in `Explorations`, by hand or with Claude through the Figma MCP ("make the MovieCard rating a badge on the poster"). Agree on it, then move it into the component or screen it changes.
2. **Ticket.** One Notion ticket per area, as in [CONVENTIONS § MFE workflow](../04-development/CONVENTIONS.md): tokens and components are `@repo/ui` tickets and merge first; a screen that changes a page's layout is a ticket in its MFE. The ticket links the Figma node (*Copy link to selection*, `?node-id=…`).
3. **Implement.** Claude reads the node (see the order below), maps it to existing components and tokens through the table above, and changes the code. A token change edits `theme.css` only. The output of `get_design_context` is a reference to adapt, never code to paste: the code keeps its conventions (no JSX spread, `Pick<ComponentProps<…>>`, `cn()`, kebab-case files).
4. **Verify.** The usual checks for the area, plus the page side by side with the Figma frames at 390, 1440 and 1920.
5. **Close.** Mark the row in the component map, and set the Figma section's status to *Implemented* with the ticket number.

**Drift rule:** a visual change made in code without a design (a bug fix, an a11y fix) is mirrored in Figma in the same ticket, so the file never falls behind.

## Changing the design without drawing

No design skills are needed: describe the change, and Claude makes it in the file.

1. **Point at the element.** In Figma, click the element (a card, a button, a section) and leave a comment on it: "make the rating a yellow badge over the poster", "more space between the rows". Or select it and *Copy link to selection*.
2. **Ask Claude Code.** "Apply the Figma comments" (Claude reads them with `get_comments`), or paste the link with the request. Claude makes the change in `Explorations` first, or in place when it is small, and binds it to tokens and components.
3. **Review in Figma.** Look at it, comment again to adjust. When it is agreed, Claude moves it into the component or screen and opens the "Figma → code" ticket.

Figma's own AI (the *Agents* panel in the file) also edits designs, but it spends Figma AI credits and does not know the repo conventions, the token names or the component map, so design changes go through Claude Code.

## Working with Claude and the Figma MCP

**Setup.** Use the remote server (`https://mcp.figma.com/mcp`): only it writes to the canvas. In Claude Code the official plugin brings the server and Figma's skills (`figma-use`, `figma-generate-library`, `figma-generate-design`, `figma-design-to-code`…):

```bash
claude plugin install figma@claude-plugins-official
```

The desktop server (`127.0.0.1:3845`) reads only and is not needed.

**Tools by job:**

| Job | Tools |
| --- | --- |
| Build or change tokens, components, screens | `use_figma` (Plugin API scripts), after loading the `figma-use` skill and `figma-generate-library` (library assets) or `figma-generate-design` (screens) |
| Find what the file already has | `search_design_system` (after `get_libraries`), a read-only `use_figma` |
| Implement a design | `get_metadata` → `get_design_context` → `get_screenshot` → `download_assets` |
| Read tokens of a selection | `get_variable_defs` |
| Link components to code | `add_code_connect_map`, `get_code_connect_map` |
| Diagrams (flows, architecture) | `generate_diagram` in a FigJam file |

**Rules that keep it fast and inside the limits:**

- Every task opens a session on the file (`create_session`) and passes its id to each call. `use_figma` scripts run one at a time, never in parallel; one script stays under about 48 kB and works on one page.
- Write in steps: foundations, then each component family, then each screen, each step checked by the IDs and counts it returns and one screenshot per composition (`node.screenshot()` inside `use_figma`, which spends no read).
- Bind every fill, stroke, gap and radius to a variable and every text to a style; never paste raw values.
- Never delete a node the task did not create; a cleanup names the exact nodes.
- For design-to-code, link the smallest node that holds the change (a card, a header), not a whole page. On a large frame call `get_metadata` first and `get_design_context` only on the node IDs that matter.
- Images and SVGs that the MCP serves from a localhost source are used as they are; no new icon package and no placeholders.

## Plan limits

The team is on Figma Professional with a Full seat:

- **MCP reads** (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`…): up to 200 a day, 10 a minute. Writes (`use_figma`, `create_new_file`, `add_code_connect_map`) do not count.
- **Pages, variable modes, team library and Code Connect** are available. Branching is not (Organization).
- A Dev seat would not do: it views and inspects, but cannot edit the file, and Claude edits as the seat holder.
