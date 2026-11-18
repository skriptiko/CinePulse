🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Figma workflow

How the design lives in Figma and how a change reaches the code. The decision is [ADR-0019](../03-architecture/decisions/ADR-0019-figma-design-source-of-truth.md).

**File:** [CinePulse Design System](https://www.figma.com/design/fhJ2HsroPBivgDcshCTuku) (the owner's personal team, Starter plan).

## Source of truth

| Question | Answered by |
| --- | --- |
| How it looks: colour, type, spacing, radius, layout, states | Figma |
| How it behaves: data, routing, a11y semantics, focus, loading order | Code (`@repo/ui`, the MFEs) and [UX_NOTES](./UX_NOTES.md) |
| Token values | Figma variables, mirrored one to one in `packages/ui/src/theme.css` |

Until the bootstrap epic is done (the file mirrors every component and page, CIN-132…135), the code stays the reference and the Figma file is built from it. From then on a visual change starts in Figma.

## File structure

| Page | Holds |
| --- | --- |
| `Cover` | File name, status, link to this document |
| `Foundations` | Variables and styles, with a specimen of each token group |
| `Primitives` | One section per `components/ui/*` component: Button, Input, DropdownMenu, Dialog, ToggleGroup, Skeleton |
| `Components` | The domain components and the page frame: MovieCard, Hero, Header, Footer, detail sections… |
| `Screens` | One frame per page and breakpoint, built only from component instances |
| `Explorations` | Work in progress. Nothing here is implemented; a design moves to the pages above once it is agreed |

Starter has no branching, so `Explorations` plays the role of a branch: a redesign is drawn there first, then replaces the component or screen it changes.

## Tokens

- **Colour:** collection `Color`, modes `Dark` (default, as the app is dark-first) and `Light`. Each variable is named after its CSS variable without the dashes: `background`, `muted-foreground`, `glass-border`. Code syntax is the Tailwind theme variable, `var(--color-background)`, so `get_design_context` returns the class the code already uses (`bg-background`).
- **Radius:** collection `Radius`: `radius` = 8, `radius-md` = 6, `radius-sm` = 4, mirroring `--radius` and its `calc()` steps.
- **Spacing:** collection `Spacing`, the Tailwind 4 scale (`--spacing` = 4 px): `1` = 4, `2` = 8, `3` = 12, `4` = 16, `6` = 24, `8` = 32, `12` = 48, `16` = 64. A value off the scale in a design is a question, not a new token.
- **Type:** Geist (variable), text styles named after their Tailwind class: `text-sm/medium`, `fluid-heading`… The fluid utilities (`fluid-display`, `fluid-heading`, `fluid-body`) get one style per breakpoint frame (390 and 1440), the ends of their `clamp()`.
- **Effects:** `glass` and `glass-bar` (background blur 20 + their fill and border variables), `shadow-xs`.

A new token is added in Figma and in `theme.css` in the same ticket. Never bind a raw colour in a component; a one-off colour in an exploration is fine until it is agreed.

## Components

- A Figma component carries the name of its code component (`Button`, `MovieCard`) and its file path in the description (`packages/ui/src/components/ui/button.tsx`).
- Variant properties use the names and values of the code props: `variant=default|destructive|outline|secondary|ghost|link`, `size=default|sm|lg|icon|icon-sm|icon-lg`. A state the code draws (`hover`, `focus-visible`, `disabled`) is a `state` property.
- A domain component takes the content of its UI model (`MovieCardData`: title, year, rating, poster) as text and instance-swap properties, not as variants.
- Icons are `lucide-react`, the same as the code, swapped with instance-swap properties.

### Component map

Code Connect needs an Organization or Enterprise plan, so this table does the job: it links each Figma component to its code. Update it when a component is added or renamed, on either side.

| Figma | Code | In Figma |
| --- | --- | --- |
| Button | `packages/ui/src/components/ui/button.tsx` | ⬜ |
| Input | `packages/ui/src/components/ui/input.tsx` | ⬜ |
| DropdownMenu | `packages/ui/src/components/ui/dropdown-menu.tsx` | ⬜ |
| Dialog | `packages/ui/src/components/ui/dialog.tsx` | ⬜ |
| ToggleGroup | `packages/ui/src/components/ui/toggle-group.tsx` | ⬜ |
| Skeleton | `packages/ui/src/components/ui/skeleton.tsx` | ⬜ |
| MovieCard | `packages/ui/src/components/movie-card.tsx` | ⬜ |
| PersonCard | `packages/ui/src/components/person-card.tsx` | ⬜ |
| Hero | `packages/ui/src/components/hero.tsx` | ⬜ |
| ContentRow | `packages/ui/src/components/content-row.tsx` | ⬜ |
| FeaturedGrid | `packages/ui/src/components/featured-grid.tsx` | ⬜ |
| CategoryPills | `packages/ui/src/components/category-pills.tsx` | ⬜ |
| Header | `packages/ui/src/components/header.tsx` | ⬜ |
| Footer | `packages/ui/src/components/footer.tsx` | ⬜ |
| MovieDetailView | `packages/ui/src/components/movie-detail-view.tsx` | ⬜ |
| PersonDetailView | `packages/ui/src/components/person-detail-view.tsx` | ⬜ |
| Detail sections | `packages/ui/src/components/*-section.tsx` | ⬜ |
| NotFound | `packages/ui/src/components/not-found.tsx` | ⬜ |
| Skeletons | `packages/ui/src/components/page-skeletons.tsx` | ⬜ |

## The loop: from a design change to the code

1. **Design.** Draw the change in `Explorations`, by hand or with Claude through the Figma MCP ("make the MovieCard rating a badge on the poster"). Agree on it, then move it into the component or screen it changes.
2. **Ticket.** One Notion ticket per area, as in [CONVENTIONS § MFE workflow](../04-development/CONVENTIONS.md): tokens and components are `@repo/ui` tickets and merge first; a screen that changes a page's layout is a ticket in its MFE. The ticket links the Figma node (`?node-id=…`).
3. **Implement.** Claude reads the node (`get_design_context`, `get_screenshot`), maps it to existing components and tokens through the table above, and changes the code. A token change edits `theme.css` only. The output of `get_design_context` is a reference to adapt, never code to paste: the code keeps its conventions (no JSX spread, `Pick<ComponentProps<…>>`, `cn()`, kebab-case files).
4. **Verify.** The usual checks for the area, plus the page side by side with the Figma frame at 390 and 1440.
5. **Close.** Mark the row in the component map, and set the Figma section's status to *Implemented* with the ticket number.

**Drift rule:** a visual change made in code without a design (a bug fix, an a11y fix) is mirrored in Figma in the same ticket, so the file never falls behind.

## Working with Claude in Figma

- Every Figma task starts a session on the file (`create_session`) and runs one `use_figma` script at a time; parallel writes corrupt state.
- Claude builds with the Plugin API, binding every fill, stroke, gap and radius to a variable.
- Claude never deletes a node it did not create in the same task; a cleanup names the exact nodes.

## Plan limits

The team is on Figma Starter:

- **MCP reads** (`get_design_context`, `get_screenshot`, `get_metadata`…) are capped at about 20 calls a month. Writes (`use_figma`, `create_new_file`) are not rate-limited. The bootstrap fits; regular design-to-code work needs a Professional plan (200 calls a day), or reads spent only on the node a ticket changes.
- **No Code Connect** (Organization and up): the component map above replaces it.
- **No branching:** `Explorations` replaces it.
- **No library publishing:** components live in this one file, which is fine for one product.
