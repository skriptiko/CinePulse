🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Design approach

The design ideas behind the CinePulse Figma file and `@repo/ui`. Read this before you draw a new screen or component: it explains *why* the file looks the way it does. The rules for working in the file (names, pages, tokens, the loop to code) are in [FIGMA_WORKFLOW](./FIGMA_WORKFLOW.md); behaviour is in [UX_NOTES](./UX_NOTES.md).

The approaches were drawn out of a design review of the file on 2026-11-18 (CIN-144). Where the file does not yet follow an approach, the gap and its ticket are listed in [Known gaps](#known-gaps).

## 1. Visual language

**Posters carry the colour.** The palette is near-black with a slight blue tint (`background`, `card`, `surface`, `surface-elevated`) and has only three saturated colours: blue `accent`/`ring`/`highlight`, red `destructive` and yellow `rating`. A catalog shows hundreds of posters, so the interface stays neutral and lets the art stand out.

**Dark first.** `Dark` is the default mode of the `Color` collection, and components are drawn to the dark spec. Every colour also has a `Light` value, because the app ships light, dark and system themes.

**Depth comes from lightness, not shadow.** On dark, a raised surface is a lighter one: `background` → `card`/`surface` → `surface-elevated` → `popover`. The shadow styles are the stock Tailwind ones and barely show on near-black; use them only where a surface would otherwise merge with the page.

**Glass is only for chrome over content.** `glass` (60 % opaque) is for small chips on images, such as the "Top Rated" badge on a Featured Tile. `glass-bar` (90 % opaque) is for the scrolled Header. Both take the `glass-border` stroke and `glass-blur`. Choose between them by contrast, not by looks: text must stay readable on any image (UX_NOTES § Accessibility).

**Text on an image sits on a gradient.** Every image with text on it has a gradient from `background` to transparent: bottom-up on cards and tiles, bottom-up and left-to-right on the Hero, a heavier one on the detail hero. Never put text straight on an image.

**Test art is fictional and many-coloured.** The `Test Images` page holds soft 3D clay renders, each with its own palette. They test the UI against many colours and keep real posters and real people out of the file.

## 2. Typography

**One family, styles named after classes.** Geist only. A text style is named after its Tailwind classes (`text-sm/medium` = `text-sm font-medium`), so a developer reads the class from the style name.

**Fluid type is drawn at both ends.** `fluid-display`, `fluid-heading` and `fluid-body` each have a `/mobile` style (390 frames) and a `/desktop` style (1440 and 1920 frames). Display and heading styles are bold and tight (`tracking-tight`, −2.5 %).

**One loud title per page.** Each page has one large title: `fluid-display` on the Hero, `fluid-heading` on a detail page. Below it the hierarchy stays calm and even:

| Level | Style |
| --- | --- |
| Page title | `fluid-display` or `fluid-heading`, bold, tight |
| Section title | `text-xl` → `text-2xl` from `md`, semibold, tight |
| Body | `text-sm` (overviews: `fluid-body`) |
| Metadata | `text-xs`, `muted-foreground` |

## 3. Layout and grid

**One spacing scale.** Every gap, padding and margin is a step of the Tailwind 4 scale (4 px), kept as the `Spacing` collection. A value off the scale is a question to settle, not a new token.

**Three drawn widths; the code decides the rest.** Screens are drawn at 390, 1440 and 1920. Widths in between follow the breakpoints of the code. A component whose layout changes with the width has a `viewport` variant (`mobile`, `desktop`, and `wide` where its inner grid changes at `2xl`).

**Chrome is capped, content is full width.** At 1920, the Header, Footer, Hero content, detail views and account pages stop at `max-w-page` (1800). Rows and catalog grids keep growing: a Home row shows more cards, and a catalog grid keeps 6 columns with wider cards.

**Columns come from content, not layout grids.** Frames use auto layout; a catalog grid is 2 cards per row at 390 and 6 at 1440 and 1920.

**Even vertical rhythm.** Sections on Home and the detail pages are 48 apart (`gap-12`), a section title is 16 above its content (`mb-4`), and a page starts at 112 or 144 (`pt-28`, `pt-36`) to clear the fixed Header.

## 4. Components

**Three layers, mirrored from the code.** `Primitives` (one section per `components/ui/*` file) → `Components` (domain parts and the page frame) → screens built only from instances. A change to a component reaches every screen.

**Props, not copies.** Variant properties use the names and values of the code props (`variant`, `size`, `state`). Content (title, year, rating, image) is a text or instance-swap property, not a variant. A variant is only for a real visual mode.

**One icon set, one image component.** Icons are the `lucide-react` icons the code imports, as `Icon/<Name>` at 16 px, swapped by property. Every image is an `Image Placeholder` instance that keeps the size of its slot.

## 5. States

**Every state is drawn, with the real text.** Each screen page has one section per state, from the usual view to the rare one: default, loading, empty, not found, error, list states, offline, dialogs, app failures. A state uses the strings from the code, so the frame shows what the user reads.

**Skeletons match the layout.** A skeleton has the shape of what it replaces (`HeroSkeleton`, `ContentRowSkeleton`, `MovieGridSkeleton`…), so the page does not jump when data arrives.

**Errors stay local.** One failed Home row shows `Section Error Fallback` and the rest of the page works. A page shows `Page Error Fallback`, a missing title shows `NotFound`, and only a failed remote or a crash takes the whole app.

## 6. Accessibility in the visuals

- **Focus is visible.** Controls have a drawn focus state: a 3 px `ring` on Button and Input. On an image the ring has two colours, and in a scroller it sits inside (`focus-ring-inset`).
- **Contrast is decided, not hoped for.** The scrim, `glass-bar` and the gradients exist so text stays readable on any image; the numbers are in UX_NOTES § Accessibility.
- **Touch targets are 44 px.** Icon buttons and pills get a 44 × 44 hit area on touch screens (`touch-target`), even where the drawn control is smaller.

## 7. How the file is organised

- **Page order tells the story:** Cover → design system (Foundations, Primitives, Components, Test Images) → one page per route → Explorations.
- **Names match the code:** variables carry the CSS variable names, components the code names and file paths.
- **Explore first, then move.** A redesign is drawn in `Explorations` and moves into the real component once agreed.
- **No drift.** A visual fix made in code is mirrored in Figma in the same ticket.

## Known gaps

The review found places where the file does not yet follow these approaches. Each is a ticket in Notion:

| Gap | Ticket |
| --- | --- |
| The watchlist dialog on Movie Detail overflows its panel; dialogs and the offline banner are local frames, not `Dialog` instances | CIN-145 |
| No screen is drawn in the light theme; image gradients use raw dark stops; muted metadata is hard to read on bright images | CIN-146 |
| Section titles, overviews and biography text have no text style; many paddings, gaps and radii are not bound; `Spacing` lacks `28` and `36` | CIN-147 |
| Focus states are missing on Icon Button, pills, nav links, toggle items and cards; no on-image Button variant; mobile frames do not show the 44 px targets | CIN-148 |
| Mobile frames show only the default view; the refresh toast is not drawn; section order differs from FIGMA_WORKFLOW on 9 pages; file clean-up | CIN-149 |
| Three page gutters (`px-4 md:px-8`, `px-4 sm:px-6 lg:px-12`, `px-4 sm:px-6 md:px-8`), so the logo, the page title and the first card do not line up | CIN-150 |
| Card titles show only on hover or focus, so on a touch screen a card shows only the poster | CIN-151 (needs a decision) |

When a gap is closed, remove its row and update the section above if the approach changed.
