🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Design approach

The design ideas behind the CinePulse Figma file and `@repo/ui`, and the industry standards they follow. Read this before you draw a new screen or component: it explains *why* the file looks the way it does. The rules for working in the file (names, pages, tokens, the loop to code) are in [FIGMA_WORKFLOW](./FIGMA_WORKFLOW.md); behaviour is in [UX_NOTES](./UX_NOTES.md).

The approaches were drawn out of a design review of the file on 2026-11-18 (CIN-144) and checked against the standards below on 2026-11-19 (CIN-152). The same day they were compared with the UI trends of 2026, and the trends that fit became rules (CIN-168): see [Trends of 2026](#trends-of-2026). Where the file or the code does not yet follow a rule, the gap and its ticket are in [Known gaps](#known-gaps).

## Standards we follow

A rule in this document that cites a standard follows it. Where we go further than the standard, the rule says so.

| Standard | Version | What it governs here |
| --- | --- | --- |
| [WCAG](https://www.w3.org/TR/WCAG22/) | 2.2, level AA (= [ISO/IEC 40500:2025](https://www.w3.org/WAI/news/2025-10-21/wcag22-iso)) | Contrast, focus, target size, reflow, motion, states. The EU baseline: [EN 301 549 v4.1.1](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/) moved to WCAG 2.2 AA |
| [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) | current | Roles and keyboard behaviour of dialogs, menus, radio groups, tabs (through Radix) |
| [ISO 24495-1](https://www.iso.org/standard/78907.html) | 2023 | Plain language in every UI text, error and empty state |
| [W3C Design Tokens Format](https://www.designtokens.org/tr/2025.10/) | 2025.10 (first stable) | How tokens are named, typed and grouped |
| [Material Design 3](https://m3.material.io/) | current | Dark theme, elevation, window size classes, 4 dp grid, motion |
| [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) | current | Touch targets, type size on phones, translucent materials (Liquid Glass) |
| [CSS View Transitions](https://www.w3.org/TR/css-view-transitions-1/) | Level 1, same-document ([Baseline 2025](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)) | Motion between pages |
| [Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/) | 10 heuristics, response time limits | States, feedback, consistency, error messages |
| [Atomic Design](https://atomicdesign.bradfrost.com/) | — | Layers of the component library |

## 1. Visual language

**Posters carry the colour.** The palette is near-black with a slight blue tint (`background`, `card`, `surface`, `surface-elevated`) and has only three saturated colours: blue `accent`/`ring`/`highlight`, red `destructive` and yellow `rating`. A catalog shows hundreds of posters, so the interface stays neutral and lets the art stand out.

**Dark first, never pure black.** `Dark` is the default mode of the `Color` collection, and components are drawn to the dark spec. Surfaces are dark grey, not `#000`, as Material's dark theme asks: pure black makes light text smear on many screens. Every colour also has a `Light` value, because the app ships light, dark and system themes, and both themes must meet the same contrast rules.

**Depth comes from lightness, not shadow.** On dark, a raised surface is a lighter one: `background` → `card`/`surface` → `surface-elevated` → `popover` (Material: elevation by tonal surface). Shadows barely show on near-black; use them only where a surface would otherwise merge with the page.

**Glass is only for chrome over content.** `glass` (60 % opaque) is for small chips on images, such as the "Top Rated" badge on a Featured Tile. `glass-bar` (90 % opaque) is for the scrolled Header. Both take the `glass-border` stroke and `glass-blur`. Choose between them by contrast, not by looks. This is the restrained form of Apple's Liquid Glass: glass never sits behind reading text, a form or a dialog, because blur over a bright image is where Liquid Glass lost contrast. When the user asks for less transparency or more contrast (`prefers-reduced-transparency: reduce`, `prefers-contrast: more`), glass becomes a solid `surface-elevated` with no blur and keeps its border.

**Text on an image sits on a gradient.** Every image with text on it has a gradient from `background` to transparent, so it is dark in the dark theme and light in the light one: bottom-up on cards and tiles (a Featured Tile 0 → 80 % at 65 % of the height → 100 %, at 80 % opacity, 90 % on hover), bottom-up (0 → 60 % at 80 % of the height → 100 %) and left-to-right on the Hero, a heavier one on the detail hero (70 → 90 → 100 %). Secondary text on the Hero, a Featured Tile and the detail hero (year, tagline, metadata, overview) is `foreground` at 80 %, not `muted-foreground`, which fails on a bright image. Long text is clamped only where the full text is one step away: the Hero overview at 3 lines (4 from `sm`) and the Featured Tile title at 2; headings are never clamped. Contrast is checked from 320 to 1920 wide, at viewport heights from 568 to 1440, with WCAG 1.4.12 text spacing. Never put text straight on an image. Text on an image meets the same contrast as text on a page, measured on the worst image (white and black).

**Colour is never the only signal** (WCAG 1.4.1). A state, an error or a choice also has text, an icon or a shape: the rating star has its number, an invalid field has a message.

**Contrast** (WCAG 1.4.3, 1.4.11):

| What | Minimum |
| --- | --- |
| Text under 24 px (under 18.66 px bold) | 4.5:1 |
| Larger text | 3:1 |
| Icons, borders of controls, focus rings, chart marks | 3:1 against what is next to them |
| Placeholder and disabled text | Disabled is exempt; placeholder meets 4.5:1 |

**Test art is fictional and many-coloured.** The `Test Images` page holds soft 3D clay renders, each with its own palette. They test the UI against many colours and keep real posters and real people out of the file. Names of people (cast, crew, reviewers, users) are made up too.

## 2. Typography

**One family, styles named after classes.** Geist only. A text style is named after its Tailwind classes (`text-sm/medium` = `text-sm font-medium`), so a developer reads the class from the style name. Geist loads as one variable font file (`@fontsource-variable/geist`, `wght` axis), so a weight costs no extra download; still, use only the weights of the type scale (regular, medium, semibold, bold), and never animate the weight.

**Text people read is 16 px.** Material (body-large) and Apple (body, 17 pt) set reading text at 16 px or more. Overviews, biographies, reviews and state messages are 16 px; 14 px is for secondary text and controls; 12 px only for short labels and metadata.

**Readable lines** (WCAG 1.4.8, 1.4.12): reading text has a line height of at least 1.5 and lines of at most 75 characters (`max-w-prose`). A layout keeps working when a user sets line height 1.5, paragraph spacing 2×, letter spacing 0.12 em and word spacing 0.16 em.

**Fluid type is drawn at both ends and grows with zoom.** `fluid-display`, `fluid-heading` and `fluid-body` each have a `/mobile` style (390 frames) and a `/desktop` style (1440 and 1920 frames). Each `clamp()` has a `rem` part, so text still doubles at 200 % zoom (WCAG 1.4.4); a size in `vw` alone does not grow with zoom. Display and heading styles are bold and tight (`tracking-tight`, −2.5 %).

**One loud title per page.** Each page has one `h1`, and headings do not skip a level (WCAG 1.3.1). Below the title the hierarchy stays calm and even:

| Level | Style |
| --- | --- |
| Page title (`h1`) | `fluid-display` or `fluid-heading`, bold, tight |
| Section title (`h2`) | `heading-section`: `text-xl` → `text-2xl` from `md`, semibold, tight |
| Reading text | `text-base` (overviews: `fluid-body`), line height ≥ 1.5, at most `max-w-prose` |
| Secondary text, controls | `text-sm` |
| Metadata, labels | `text-xs`, `muted-foreground`; on an image `foreground/80` |

## 3. Layout and grid

**One spacing scale on a 4 px grid.** Every gap, padding and margin is a step of the Tailwind 4 scale (4 px), kept as the `Spacing` collection; this is Material's 4 dp grid. Prefer steps of 8 for layout and keep 4 for small parts. A value off the scale is a question to settle, not a new token.

**Design for each width class; the code decides between them.** Material 3 asks for a layout per window size class, not per device. We draw:

| Frame | Width | Class (Material 3) | Tailwind |
| --- | --- | --- | --- |
| Mobile | 390 | Compact (< 600) | base |
| Tablet | 768 | Medium (600–839) | `sm`, `md` |
| Desktop | 1440 | Large (≥ 1200) | `xl` |
| Full HD | 1920 | Extra-large | `2xl` |

A component whose layout changes with the width has a `viewport` variant (`mobile`, `desktop`, `tablet` where its layout changes at `md`, and `wide` where its inner grid changes at `2xl`). On touch widths (390, 768) cards show their title at rest.

**Every layout reflows at 320 px** (WCAG 1.4.10): at 320 CSS px wide, which is also 1280 at 400 % zoom, nothing needs side scrolling except carousels, which scroll on purpose. The 390 frame is drawn; 320 is checked, not drawn.

**One page gutter, one left edge.** The Header, the page title and the first card start on the same left edge at every width: 16 below 640, 24 from 640, 48 from 1024 (Material margins are 16 at compact and 24 at medium).

**Content is capped; rows bleed right.** From `2xl`, all content sits in `max-w-page` (1800) with the gutter inside, so the left edge stays at 108 on a 1920 screen. A horizontal row starts on that edge and runs to the right edge of the screen, so it shows more cards and hints that it scrolls. Category pill rows (`CategoryPills`, `CategoryLinks`) use the same row start (`ROW_GUTTER`), so the first pill lines up with the first card. Pills inside a block that already has its padding (the catalog filters, the Watchlist column) start on the edge of that block at every width, with no extra 48: in code, `CategoryPills` takes `gutter={false}`.

**Columns come from content; grids are a guide.** Frames use auto layout; a catalog grid is 2 cards per row at 390 and 6 at 1440 and 1920. Each `Default` frame carries the layout grid of its width class (4, 8 or 12 columns), hidden by default, to align new work.

**Bento is for one featured block, not for every list.** `FeaturedGrid` is a bento grid: the first tile spans 2 × 2 from `sm`, the rest are single tiles. A page has at most one such block, and its biggest tile is its most important item. Tiles keep the reading order of the list: the grid places them, it never reorders them, so keyboard and screen reader order match what the eye sees (WCAG 1.3.2, 2.4.3). A catalog list stays an even grid.

**Even vertical rhythm.** Sections on Home and the detail pages are 48 apart (`gap-12`), a section title is 16 above its content (`mb-4`), and a page starts at 112 or 144 (`pt-28`, `pt-36`) to clear the fixed Header.

## 4. Components

**Three layers, mirrored from the code** (Atomic Design: atoms, molecules and organisms, templates, pages). `Primitives` (one section per `components/ui/*` file) → `Components` (domain parts and the page frame) → screens built only from instances. A change to a component reaches every screen.

**Props, not copies.** Variant properties use the names and values of the code props (`variant`, `size`, `state`). Content (title, year, rating, image) is a text or instance-swap property, not a variant. A variant is only for a real visual mode.

**Every interactive component has its states**: `default`, `hover`, `focus-visible`, `pressed` or `selected` where it has one, `disabled`. A state the user can reach is drawn.

**Behaviour follows WAI-ARIA patterns.** A dialog, a menu, a radio group or a tab list behaves as its [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) says: focus moves into a dialog and back, Escape closes it, arrow keys move inside a group. Radix gives this in code; a new component that has no Radix base follows the pattern by hand.

**Each component is documented.** Its Figma description holds the code path, one sentence on what it is for, when not to use it, and its role and keys.

**One icon set, one image component.** Icons are the `lucide-react` icons the code imports, as `Icon/<Name>` at 16 px, swapped by property. An icon without text has an accessible name. Every image is an `Image Placeholder` instance that keeps the size of its slot; an image says whether it has alt text or is decorative (WCAG 1.1.1).

**Essential information is never hover-only.** A title, a price or a rating that the user needs is visible without a pointer: touch screens have no hover. Hover may reveal extras (WCAG 1.4.13 then applies: the extra content can be dismissed, hovered and stays until the pointer leaves).

**Tokens follow the W3C format.** A token has a name, a type (`color`, `dimension`, `fontFamily`, `shadow`…) and a value per mode, as the Design Tokens Format 2025.10 defines. Names are semantic (`background`, `muted-foreground`), the same in Figma and in the token files `packages/ui/tokens/*.tokens.json`, from which the CSS is built (ADR-0020).

## 5. States

**Every state is drawn, with the real text.** Each screen page has one section per state, from the usual view to the rare one: default, loading, empty, not found, error, list states, offline, dialogs, app failures (NN/g: visibility of system status). A state uses the strings from the code, so the frame shows what the user reads.

**Loading follows the response time limits** (NN/g: 0.1 s, 1 s, 10 s). Under 300 ms nothing shows, so fast loads do not flicker; then a skeleton with the shape of what it replaces, so the page does not jump when data arrives. A wait that can pass 10 s, such as an upload, shows progress.

**Errors stay local and say what to do.** One failed Home row shows `Section Error Fallback` and the rest of the page works; only a failed remote or a crash takes the whole app. An error message says what happened and how to fix it, in plain words, with an action such as **Try again** (WCAG 3.3.1, 3.3.3; NN/g error message guidelines).

**Status messages are announced.** A toast, the offline banner and a list that loaded more items reach screen readers through a live region without moving focus (WCAG 4.1.3). A toast with an action stays until it is dismissed (WCAG 2.2.1).

## 6. Motion

**Motion explains, it does not decorate.** A transition shows where something came from or what changed: a card grows into its detail page, a dialog rises from its trigger, a toast slides in from its corner. Motion with no such meaning is left out. This is Material's and Apple's current advice, and it keeps the calm look of the catalog.

**Page changes use View Transitions.** Going from a card to its Movie or TV Detail page, the poster morphs into the detail hero; other page changes inside a remote cross-fade. In code this is React 19.3 `<ViewTransition>` or the `viewTransition` option of React Router 7, on top of the browser's View Transition API (Chrome and Edge 111, Safari 18, Firefox 144). A browser without it changes the page at once, which is fine.

- **Inside one remote only.** A path that loads another remote shows its skeleton first, so it has no shared element to morph.
- **The skeleton takes part.** `PageBoundary` shows a page skeleton on every new path, so an element that morphs also exists in the skeleton, with the same `view-transition-name`. Without it, the page falls back to a cross-fade.
- **Focus does not move with the motion.** Focus and the scroll position behave as they do without a transition.

**One set of durations and curves.** Small state changes (colour, opacity) take 150–200 ms, larger moves (a dialog, a page) 250–300 ms, an ease-out on entry and an ease-in on exit. These become motion tokens in `theme.css`, next to the colour tokens. Material 3 Expressive's spring motion is not adopted: it draws the eye away from the posters.

**Reduced motion turns it off.** Under `prefers-reduced-motion: reduce`, page changes have no transition and nothing scales or slides. The global reduced-motion rule in `theme.css` matches elements through `*`, which does not reach the `::view-transition-*` pseudo-elements, so they need a rule of their own.

## 7. Accessibility in the visuals

The target is **WCAG 2.2 AA**.

- **Focus is visible and never hidden.** Every control has a drawn focus state (WCAG 2.4.7): a 3 px `ring` on Button and Input, a two-colour ring on images, a 2 px ring inside a control in a scroller (`focus-ring-inset`). The ring has 3:1 contrast against its surroundings, as WCAG 2.4.13 (AAA) asks. A focused control is never fully covered by the fixed Header, a banner or a toast (WCAG 2.4.11).
- **Targets are 44 px on touch, at least 24 px everywhere.** WCAG 2.5.8 asks for 24 × 24 CSS px or enough space around a target. On touch screens we give 44 × 44 (`touch-target`), as Apple's HIG and WCAG 2.5.5 (AAA) ask; Material asks for 48 dp, which we do not adopt.
- **Motion is optional.** Transitions last 300 ms or less and stop under `prefers-reduced-motion` (WCAG 2.3.3, AAA). Nothing flashes more than 3 times a second (2.3.1), and nothing moves on its own for more than 5 s without a pause control (2.2.2). The rules for transitions are in [Motion](#6-motion).
- **Forced colours keep focus and borders.** In Windows high contrast, shadows and backgrounds go away, so focus is a solid outline and filled controls keep a border.
- **Designs carry accessibility notes.** A screen's default frame at 1440 has an `A11y` layer that marks headings, landmarks (`header`, `nav`, `main`, `footer`), focus order, accessible names of icon buttons, and alt text or "decorative" for images. This is the W3C WAI practice for designers handing work to developers.
- **Sign-in needs no memory test** (WCAG 3.3.8): it is a Google popup, with no password to recall and no puzzle.

## 8. How the file is organised

- **Page order tells the story:** Cover → design system (Foundations, Primitives, Components, Test Images) → one page per route → Explorations.
- **Names match the code:** variables carry the CSS variable names, components the code names and file paths.
- **Explore first, then move.** A redesign is drawn in `Explorations` and moves into the real component once agreed.
- **No drift.** A visual fix made in code is mirrored in Figma in the same ticket.
- **Every library release says what changed.** A publish of the team library has a note with the change and the ticket number, so a reader can trace any change.

## Trends of 2026

We compared the approaches above with the UI trends of 2026 on 2026-11-19. A trend that fits a catalog of posters became a rule; the others are listed with the reason, so the question is not asked again. Features built on AI are out of scope.

| Trend | Decision | Where |
| --- | --- | --- |
| Calm interfaces: fewer effects, clear structure, muted palette | Already ours | [Visual language](#1-visual-language) |
| Dark first, semantic tokens in the W3C format | Already ours | [Visual language](#1-visual-language), [Components](#4-components) |
| Accessibility from the start | Already ours | [Accessibility in the visuals](#7-accessibility-in-the-visuals) |
| Translucent layers (Apple Liquid Glass) | Taken in a restrained form, with a solid fallback | [Visual language](#1-visual-language) |
| Motion that explains a change, View Transitions | Taken | [Motion](#6-motion) |
| Bento grids | Taken for one featured block per page | [Layout and grid](#3-layout-and-grid) |
| Variable fonts | Taken for loading; the type scale stays | [Typography](#2-typography) |
| Material 3 Expressive: bold shapes, spring motion | Not taken: it competes with the posters | — |
| 3D and spatial interfaces | Not taken: a catalog has nothing to explain in depth | — |

## Known gaps

The file or the code does not yet follow these rules. Each gap is a ticket in Notion:

| Gap | Ticket |
| --- | --- |
| MovieCard and Hero have no image property: a poster is a fill override on its `Image Placeholder` | none yet |
| No motion tokens; no View Transition styles or reduced-motion rule for them | CIN-170 |
| Card → detail page has no View Transition | CIN-171 |

When a gap is closed, remove its row and update the section above if the rule changed.
