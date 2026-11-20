🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Design benchmarks

Target numbers for how CinePulse looks, moves and behaves. Each target comes from a standard, from user research, or from measurements of reference sites. Use this page to tune the site and to check a design or a pull request. It holds numbers and behaviours only, not styles to copy.

The ideas behind the design are in [DESIGN_APPROACH](./DESIGN_APPROACH.md), the agreed behaviour of each screen is in [UX_NOTES](./UX_NOTES.md). The interaction, accessibility and performance standards, with their targets, are in [QUALITY_BENCHMARKS](./QUALITY_BENCHMARKS.md). Standards for whole tasks and UI content are in [UX_STANDARDS](./UX_STANDARDS.md). Where this page and those documents differ, those documents still decide. The difference is a proposal, listed in [Proposed changes](#proposed-changes) and decided in its own ticket.

Measured and compiled on 2026-11-20 (CIN-176).

## How to read the tables

| Column | Meaning |
| --- | --- |
| **Reference sites** | What we measured on live sites (see [Reference sites](#reference-sites)). A range when sites differ. |
| **Standard** | The value in a standard or design system, with its source. |
| **Target** | The value CinePulse aims for. |
| **Tolerance** | The range that still passes a review. Outside it, the value needs a reason. |
| **How to check** | How to measure the value in our own build. |

**Only the frontend is in scope.** We do not control how fast TMDB, Firebase Auth or Firestore answer, so no target here is a server response time. Where a result depends on a server, the target says what the frontend does while it waits: cache, prefetch, skeleton, keeping old data, retry, timeout.

Sources are tagged: **[S]** a normative standard (W3C, WCAG, Core Web Vitals), **[G]** a design system or vendor guideline, **[R]** user research, **[M]** our measurement of a reference site.

## Reference sites

We measured 8 sites in Chrome at 1440 × 756 (Apple TV at 1200 × 626). Five of them are media catalogs like CinePulse. Linear and Vercel are well known for their interface quality and their type, so they serve as a benchmark for motion and type only.

| Site | Page | Why it is a reference |
| --- | --- | --- |
| Apple TV | tv.apple.com, home | Dark media catalog, card rows, row arrows |
| Netflix | a title page (signed out) | Dark media catalog, title page, motion tokens |
| JustWatch | /us/movies | Movie catalog with filters and a poster grid |
| Letterboxd | /films/popular | Film community, dense poster grid |
| Mubi | /en/films | Curated film catalog, light theme |
| Linear | home | Product interface benchmark: motion, type, glass header |
| Vercel | home, /docs | Geist type benchmark, dialog motion |

Two kinds of measurement:

- **Static.** A script read the computed styles of every visible element: font sizes and line heights weighted by characters, poster sizes and gaps, radii, transition durations and curves, and the `prefers-reduced-motion` blocks in the style sheets.
- **Live.** A recorder polled `document.getAnimations()` every 16 ms while we hovered a card, opened and closed a menu or a dialog, clicked a row arrow and opened a title. It captured the real duration, delay, curve and keyframes of each transition. For smooth scrolling we sampled `scrollLeft` every 16 ms.

[How to measure our own build](#how-to-measure-our-own-build) shows how to repeat both on CinePulse.

## 1. Motion

### 1.1 Perception limits

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Feedback starts after an input | Hover and press start at once on every site [M] | 100 ms feels instant [R] (NN/g, Miller 1968); RAIL: respond within 100 ms, handle input in ≤ 50 ms [G] | The visible change starts ≤ 100 ms after hover, press or a key | 0–100 ms | Performance panel: input event → first frame with the change |
| Shortest animation | 100 ms on Apple TV, Linear, Mubi [M] | ~100 ms is the lowest noticeable motion [R] (NN/g) | 100 ms; anything shorter changes at once | 70–100 ms | Recorder |
| Longest user-triggered animation | 300 ms (Vercel dialog), 400 ms (Netflix) [M] | ≥ 500 ms feels slow [R]; most UI 100–400 ms [R] | ≤ 300 ms (DESIGN_APPROACH § 7); research allows up to 400 ms for a full-screen move | hard cap 400 ms | Recorder |
| Step between durations | — | 250 → 300 ms is a noticeable difference [R] (NN/g) | Tune in 50 ms steps | ± 25 ms | — |
| How often it is seen | Hover states: 100–200 ms everywhere [M] | The more often an animation is seen, the shorter it is [R][G] | Hover, press, row scroll ≤ 200 ms; keyboard focus moves have no animation | — | Review |

### 1.2 Duration scale

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Duration steps | Apple TV 100/200/250/300; Netflix 250 dominant, 200/300/400; Linear 100/120/160/200; Vercel 150/200/300 [M] | M3 50–400 in steps of 50; Fluent 50/100/150/200/250/300/400; Atlassian 100/150/200/250/400; Primer 100/200/300 [G] | 100, 150, 200, 250, 300, 400 ms. Today's tokens: `duration-state` 200, `duration-move` 300; curves `ease-enter` `cubic-bezier(0, 0, 0.2, 1)`, `ease-exit` `cubic-bezier(0.4, 0, 1, 1)` | ± 25 ms per step | `theme.css` |
| Exit vs enter | Apple TV, JustWatch, Linear, Vercel: exit = enter [M]; Netflix: separate exit curve [M] | Atlassian 150/100, 250/200; NN/g popup 300 in / 200–250 out [G][R] | Exit = enter − 50 ms (at least 100 ms) for overlays; symmetric for hover | exit 66–100 % of enter | Recorder |
| Larger or farther = longer | — | Fluent: larger elements get more time [G]; NN/g: travel distance → longer [R] | ≤ 100 px of travel: 150–200 ms; up to half the viewport: 250–300 ms; full screen: 300–400 ms | — | Review |

### 1.3 Curves

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Enter (decelerate) | Netflix `(0.32, 0.94, 0.6, 1)`; Letterboxd `(0.19, 1, 0.22, 1)`; Apple TV `(0, 0, 0.2, 1)` and `(0.33, 1, 0.68, 1)`; Vercel `(0.16, 1, 0.3, 1)` [M] | M3 decelerate `(0, 0, 0, 1)`, emphasized decelerate `(0.05, 0.7, 0.1, 1)` [G]; Carbon `(0, 0, 0.38, 0.9)` [G] | `ease-enter`: a strong ease-out such as `(0, 0, 0, 1)` or `(0.05, 0.7, 0.1, 1)` | any curve with x1 ≤ 0.35 and y1 ≥ 0.7 | `theme.css`; recorder |
| Exit (accelerate) | Netflix `(0.4, 0, 0.68, 0.06)`; JustWatch `(0.8, 0, 1, 1)` [M] | M3 accelerate `(0.3, 0, 1, 1)` [G]; Carbon `(0.2, 0, 1, 0.9)` [G] | `ease-exit`: `(0.3, 0, 1, 1)` | ease-in with y2 ≥ 0.9 | `theme.css`; recorder |
| Moves on screen (stays visible) | Linear `(0.25, 0.46, 0.45, 0.94)`; Vercel `(0.4, 0, 0.2, 1)` [M] | M3 standard `(0.2, 0, 0, 1)`; CSS `ease` [G][S] | `(0.2, 0, 0, 1)` for a row scroll or a sheet that stays near | — | Recorder |
| Hover and opacity | `ease` or `ease-in` at 100–200 ms on Apple TV, JustWatch, Linear [M] | Primer hover `ease` [G] | `ease` or the enter curve | — | Recorder |
| Overshoot | Only Vercel's dialog: `(0.175, 0.885, 0.32, 1.1)` [M] | M3 Expressive springs (not adopted, DESIGN_APPROACH § 6) | No overshoot | 0 % | Recorder |
| Linear | Apple TV row arrows fade, 250 ms linear [M] | Fluent: only for constant motion [G] | Spinners, progress, shimmer only | — | Review |

### 1.4 Each animation type

Measured on the reference sites with the recorder. "In" is the opening or the hover, "out" the closing or the leave.

| Pattern | Reference sites (in / out) | Standard | Target in / out | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Card hover | Apple TV: scrim opacity 200 / 200 ms `ease`, inner glow 100 ms `ease-in`, context button fade 200 ms; no scale. JustWatch, Netflix: no animation [M] | Atlassian hover 150 ms [G]; NN/g start ≤ 100 ms [R] | 150–200 ms opacity, same in and out; no lift or scale by default | 100–200 ms; scale ≤ 1.03 if used | Recorder on a `MovieCard` |
| Button and link hover | Linear 100 ms colour and background, `(0.25, 0.46, 0.45, 0.94)`; Vercel 150 ms; Mubi 150 ms [M] | Atlassian 100–150 ms [G] | 150 ms colour and background | 100–200 ms | Recorder |
| Press | Apple TV scale 100 ms [M] | Atlassian press 100 ms; Carbon 70 ms [G] | 100 ms in, 150 ms out; `scale(0.97)` on buttons, none on large cards | scale 0.95–0.98 | Recorder; `:active` styles |
| Focus ring | Appears at once on every site [M] | Atlassian: focus is instant [G] | 0 ms | 0 | Tab through a page |
| Row arrows show on row hover | Apple TV 250 ms linear [M] | — | 150–200 ms opacity | 100–250 ms | Recorder |
| Row scroll by an arrow | Apple TV: smooth scroll, one card (276 px) in ~350 ms, ease-out, snap `x mandatory`. Netflix: snap `x mandatory`, scroll `auto` [M] | Browser smooth scroll ≈ 300–500 ms [G] | Native `scroll-behavior: smooth` (the browser times it); under reduced motion `auto` | 250–500 ms | Sample `scrollLeft` every 16 ms |
| Menu, dropdown, popover | Linear: scale 0.98 → 1 + opacity, 180 / 180 ms `ease`. JustWatch: opacity only, 300 / 300 ms `ease` [M] | Atlassian 150 / 100 ms [G]; shadcn fade + zoom 95 % [G] | 150 / 100 ms; opacity + scale 0.96–0.98 → 1 from the trigger side | in 120–200, out 75–150 | Recorder on the sort `DropdownMenu` |
| Dialog | Vercel: panel scale 0.96 → 1 + opacity 300 / 300 ms, overlay to 80 % 300 ms [M] | Atlassian 250 / 200 ms, scale 0.95 ↔ 1 [G]; NN/g 200–300 ms [R] | Panel 250 / 200 ms, scale 0.96 → 1; overlay 200 / 150 ms | in 200–300, out 150–250 | Recorder on `AddToWatchlist` dialog |
| Tooltip | — | Atlassian: fade only [G] | 150 / 100 ms fade, optional ≤ 4 px slide | 100–200 ms | Recorder |
| Toast | — | Carbon 240 ms; Atlassian flag 250 / 200 ms [G] | 250 ms slide ≤ 16 px + fade, out 200 ms fade; the stack reflows in 200 ms | 200–300 ms | Recorder on `notification:show` |
| Expand (Show more, accordion) | Vercel height 200 ms [M] | Carbon 150 ms small, 400 ms large [G] | 200 ms up to 200 px of height, 250–300 ms beyond, or at once | 0–300 ms | Recorder |
| Image fade-in | Apple TV 100 ms `ease-in`; Mubi 600 ms [M] | Carbon fades 110 ms [G] | 200 ms opacity, only for images that load after the first paint | 100–300 ms | Recorder; throttle the network |
| Skeleton pulse | Mubi pulse 750 ms [M] | MUI pulse 2 s `ease-in-out`, opacity 1 → 0.4 → 1 [G] | 1.5–2 s cycle, opacity range ≥ 0.5 | 1.2–2 s | Recorder |
| Page cross-fade | Apple TV, JustWatch: no transition, the page swaps at once [M] | View Transitions default 250 ms `ease` [S]; Atlassian page 400 ms [G] | 200–250 ms cross-fade | 200–300 ms | Recorder; DevTools Animations panel |
| Card → detail poster morph | None of the sites morph a card; JustWatch ships view-transition rules but swaps at once [M] | M3 container transform ~300 ms [G]; NN/g ≤ 400 ms for large moves [R] | 300 ms with the enter curve (`duration-move`); Back 250 ms | 250–350 ms | DevTools Animations panel at 10 % speed |
| Theme switch | — | — | At once (no per-property transitions) | 0–250 ms | Toggle the theme |
| Stagger of a row or grid | None on the sites [M] | Fluent, Material: short delays, no number [G] | None by default; if used, 30 ms per item, last item ≤ 150 ms after the first, first load only | 20–50 ms per item | Recorder |

### 1.5 View Transitions

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Default duration and curve | — | `::view-transition-group(*)` 250 ms `ease` [S] (CSS View Transitions 1) | Root cross-fade 200–250 ms; named poster 300 ms | See § 1.4 | DevTools Animations panel |
| Named elements per navigation | — | Two elements with one name abort the transition [S] | 1 (the poster); never more than 3 | 1–3 | Console: `ViewTransition` `ready` must not reject |
| Waiting before the morph | — | The page is frozen while the update callback runs [G] (Chrome docs) | The new page renders in ≤ 100 ms when the detail data is cached; otherwise the skeleton takes part | ≤ 100 ms | Performance panel |
| Poster shape | — | A changed aspect ratio animates width and height, which runs layout each frame [G] | Card poster and detail poster both 2:3, so only `transform` animates | same ratio | Compare the two boxes |
| Card off screen | — | — | No morph from an element outside the viewport: cross-fade instead | — | Scroll the card out, then go Back |
| Hidden tab | — | `startViewTransition()` in a hidden document is skipped [S] | No error in the console | — | Switch tabs during a navigation |

### 1.6 Reduced motion

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Support at all | `prefers-reduced-motion` blocks: Netflix 60, Linear 52, Vercel 29, Letterboxd 11, Apple TV 7, JustWatch 2, Mubi 0 [M] | WCAG 2.3.3 (AAA): motion from an interaction can be turned off [S] | Every movement has a reduced-motion rule | — | DevTools → Rendering → emulate `prefers-reduced-motion: reduce` |
| What goes | — | Parallax, zoom, slide, scroll-linked movement, autoplay video [S][G] | No slide, scale, morph, shimmer sweep, smooth scroll, autoplay | none left | Emulate and record |
| What stays | — | "Reduced motion is not no motion" [G] (Chrome docs); Apple: cross-fade instead of movement [G] | Colour and hover changes stay; overlays and pages may cross-fade in ≤ 150 ms; DESIGN_APPROACH § 6 turns page transitions off | 0–150 ms fades | Emulate and record |
| View Transition pseudo-elements | — | `*` does not match `::view-transition-*` [S] | A separate rule for the pseudo-elements | — | Emulate and navigate |

## 2. Behaviour timing

### 2.1 Response limits and Core Web Vitals

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| LCP (p75) | — | Good ≤ 2.5 s [S] | ≤ 2.0 s on mobile, Home and Detail | must stay ≤ 2.5 s | Lighthouse (mobile), web-vitals in the field |
| INP (p75) | — | Good ≤ 200 ms [S] | ≤ 150 ms (search typing, watchlist toggle, menu open) | must stay ≤ 200 ms | web-vitals; Performance panel |
| CLS (p75) | — | Good ≤ 0.1 [S] | ≤ 0.05; 0 on catalog lists | must stay ≤ 0.1 | Lighthouse; Performance panel layout shifts |
| FCP | — | Good ≤ 1.8 s [G] | ≤ 1.5 s (our static files and the first render; TTFB of the API is out of scope) | — | Lighthouse |
| Long tasks | — | A long task is > 50 ms [S] | No task > 50 ms during a View Transition or a scroll | ≤ 50 ms | Performance panel |
| Data-backed update | — | Doherty threshold 400 ms [R] | Feedback ≤ 100 ms after the press; a cached answer renders ≤ 100 ms; an uncached one keeps the old results and follows § 2.2 | — | Performance panel |
| Attention limit | — | 10 s [R] (NN/g) | A request is aborted at ~10 s and shows the error state with **Try again** | 8–15 s | Throttle to offline mid-request |

### 2.2 Loading

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Delay before a skeleton | — | NN/g: nothing under 1 s [R]; TanStack Router `pendingMs` 1000 ms [G] | 300 ms (UX_NOTES) | 200–500 ms | Throttle to "Fast 4G"; record the first skeleton frame |
| Shortest time a skeleton stays | — | TanStack Router `pendingMinMs` 500 ms [G]; React 19 throttles a Suspense fallback ~300 ms [G] | 400–500 ms once shown | 300–500 ms | Throttle; record |
| Skeleton or spinner | — | NN/g: skeleton for a page, spinner for one module, progress bar over 10 s [R] | Page and section: skeleton with the final shape. Load more and buttons: inline spinner | — | Review |
| Skeleton size | — | CLS ≤ 0.1 [S] | Same size as the content it replaces | 0 shift | Performance panel |
| Old content during a refetch | — | React `useTransition`, TanStack `keepPreviousData` [G] | Filters, sort and search keep the old results until the new ones arrive | — | Change a filter on a slow network |

### 2.3 Prefetch on intent

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Hover or focus delay | — | TanStack Router intent 50 ms [G]; instant.page 65 ms [G] | 100 ms of hover or focus, cancelled on leave (the header now waits 200 ms, see [Proposed changes](#proposed-changes)) | 50–200 ms | Network panel while hovering links |
| Touch | — | TanStack Router: preload on `touchstart` [G] | Prefetch on `pointerdown` | — | Device emulation |
| Data saver | — | `navigator.connection.saveData` [G] | No speculative prefetch when it is on or on 2G | — | Emulate |

### 2.4 Search

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Debounce (Movies and TV Shows filter field) | — | Common guideline 150–300 ms [G]; average typists press a key every ~200–300 ms [R] | 300 ms (UX_NOTES) | 200–300 ms | Network panel: one request per pause |
| Minimum length (filter field) | — | 1–3 characters across systems [G] | 1 character is fine for TMDB; an empty field shows the default list | 1–3 | Type one letter |
| Search page | — | — | Runs on Enter or the button only (UX_NOTES), so it has no debounce | — | Type without Enter: no request |
| Out-of-order answers | — | Abort the old request [G] (TanStack `signal`) | Only the latest query shows | — | Throttle and type fast |
| Enter | — | — | Enter sends the search at once | — | Keyboard |
| Results announced | — | WCAG 4.1.3 [S] | One polite announcement after the results settle, not one per key | — | Screen reader |

### 2.5 Tooltips and hover reveals

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Open delay | — | NN/g 300–500 ms [R]; Radix `delayDuration` 700 ms [G] | 500 ms | 300–700 ms | Stopwatch in the recorder |
| Skip delay between triggers | — | Radix `skipDelayDuration` 300 ms [G] | 300 ms | 0–300 ms | Move across icons |
| Close | — | NN/g: ~0.5 s grace for hover menus [R] | Tooltip closes at once on leave; a hover menu waits 300 ms | — | Recorder |
| Keyboard and Escape | — | WCAG 1.4.13 [S] | Opens on focus with no delay; Escape closes; the pointer can move onto it | — | Keyboard |
| Touch | — | — | No tooltips; labels are visible | — | Device emulation |

### 2.6 Toasts and status messages

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Duration | — | sonner 4 s [G]; Material 4–10 s [G]; React Spectrum ≥ 5 s, Fluent 7 s [G]; reading speed ~238 words a minute [R] | max(5 s, 1.5 s + 300 ms per word), at most 10 s | 5–10 s | Stopwatch |
| With an action | — | WCAG 2.2.1 [S] | Stays until dismissed (DESIGN_APPROACH § 5); the timer pauses on hover and focus | — | Hover a toast |
| How many | — | sonner 3 [G]; Material 1 [G] | ≤ 3 visible; the same message once | 1–3 | Trigger several errors |
| Announcement | — | WCAG 4.1.3 [S] | `status` (polite); `alert` only for a failed action the user started | — | Screen reader |
| Offline banner | — | `offline` event [S] | Shows ≤ 1 s after going offline; hides and refetches on `online`; does not time out | ≤ 1 s | DevTools → Network → Offline |

### 2.7 Lists, scroll and focus

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Load more | — | Baymard: Load more is the best balance [R] | Button; 20 items per press (one TMDB page); shows "That's all" at the end | 20–40 | Press it to the end |
| Busy Load more | — | — | Spinner in ≤ 100 ms; the button keeps its width | 0 shift | Throttle |
| Focus after Load more | — | APG feed pattern [G] | Focus stays on the button or moves to the first new card; the new count is announced | — | Keyboard + screen reader |
| Scroll after Back | Apple TV, JustWatch: a new page opens at the top [M] | `history.scrollRestoration` [S] | Back returns to the same place, with the loaded pages; a new page starts at the top | ≤ one row off | Open a title from page 3, go Back |
| Focus after navigation | Apple TV, JustWatch: focus stays on `body` [M] | Gatsby / Fable Tech Labs study: focus a heading or the main region [R]; WCAG 2.4.3 [S] | Focus moves to `main` on a new path (UX_NOTES); not on Back | — | Tab once after a navigation |
| Anchor under the header | — | WCAG 2.4.11 [S] | `scroll-padding-top` ≥ header height + 8 px | — | Focus a link under the header |
| Row keyboard | — | APG carousel [G] | Cards are links in tab order; the focused card scrolls fully into view, ring not clipped | — | Tab through a row |

### 2.8 Actions, errors and retries

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Optimistic update | — | TanStack optimistic updates, React `useOptimistic` [G] | Watchlist status changes in ≤ 100 ms; rolls back with an error message on failure | ≤ 100 ms | Throttle; toggle |
| Repeat presses | — | — | Ignored while a write is pending; the control keeps focus (`aria-disabled`) | — | Double click |
| Remove | — | NN/g: Undo beats a confirmation for a reversible action [R] | UX_NOTES asks first; Undo is the alternative (see [Proposed changes](#proposed-changes)) | — | Review |
| Automatic retries | — | TanStack 3 with backoff [G]; retry only 408, 429, 5xx [G] | ≤ 2 retries for network and 5xx errors, ~1 s then ~2 s | total ≤ ~5 s before the error shows | Fail the proxy in MSW |
| Error in a section | — | NN/g error messages [R]; WCAG 3.3.1, 3.3.3 [S] | The section shows its error and **Try again**; the rest of the page works | — | Fail one row |
| Sign-in popup | — | The browser allows a popup only right after a click [S] | `signInWithPopup` runs in the click handler with the SDK already loaded; a closed popup resets silently | 0 ms of async work before it | Click sign-in on a slow network |
| Form validation | — | Inline validation after leaving a field cut errors by 22 % [R]; WCAG 3.3.1 [S] | Check on blur, then live while fixing; on submit focus the first error | — | Keyboard |

## 3. Typography

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Body text | 16 px on JustWatch, Vercel; 14–15 px on Netflix, Apple TV, Mubi, Linear [M] | Body ≥ 16 px for reading [G] (M3, HIG ~17 pt) | 16 px; 17–18 px for long prose at ≥ 768 px | 16–18 px | Computed style |
| Secondary text | 13–14 px [M] | — | 14 px | 13–15 px | Computed style |
| Labels | 12–13 px; uppercase 12–13 px with +5–7.5 % tracking (Mubi, Letterboxd) [M] | — | 12 px floor; 11 px only for uppercase badges at weight ≥ 500 | 11–12 px | Computed style |
| Line height, body | 1.5 (JustWatch, Netflix, Vercel, Linear 14 px); Mubi 1.71 [M] | WCAG 1.4.12 tests 1.5 [S] | 1.5 | 1.45–1.6 | Computed style |
| Line height, headings | 1.0–1.33 [M] | — | 1.2 for h1–h2, 1.25 for h3–h4, 1.1 for 40 px and up | 1.0–1.35 | Computed style |
| Tracking by size | Linear −2.2 % at 48–64 px, −1.2 % at 20 px; Vercel −4 % at 24 px, −6 % at 56–64 px (Geist); Mubi −1.6 % at 32 px [M] | — | −1.5 % at 20–24, −2 % at 28–32, −2.5 % at 40–48, −3 % at 56+; 0 for body; +6 % for uppercase labels | ± 0.5 %; Geist display may go to −4 % | Computed style |
| Line length | Linear ~82 characters; Netflix cards ~38 [M] | 45–75 characters [G]; WCAG 1.4.8 ≤ 80 (AAA) [S] | ~65 characters (`max-width: 65ch`); hero synopsis 48–56ch | 45–75 | Count characters in a line |
| Type scale ratio | — | Common modular scales 1.2 / 1.25 [G] | 1.2 on phones, 1.25 on desktop; fluid between 360 and 1280 px | — | Compare steps |
| Weights | Linear 400/510/590 [M] | — | 400 body, 500 labels and buttons, 600 headings, 700 display; no weight below 400 on dark | ≤ 4 weights | Computed style |
| Numbers | — | — | `tabular-nums` on ratings, years, runtimes and counts | — | Computed style |
| Clamps | — | WCAG 1.4.12: no clipping with extra spacing [S] | Clamp by lines (UX_NOTES: 6 and 3 lines), never by a fixed height | — | Apply the 1.4.12 bookmarklet |
| Input text | — | iOS zooms an input under 16 px [G] | ≥ 16 px | hard rule | Computed style |
| Font swap | — | CLS ≤ 0.1 [S] | Swap adds ≤ 0.01 CLS (metric-matched fallback) | ≤ 0.01 | Performance panel |

## 4. Layout

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Page gutter | Apple TV 41, JustWatch 64, Netflix 152 (centred), Linear ~80 at 1440 [M] | M3 16 / 24 [G] | 16 below 640, 24 from 640, 48 from 1024 (DESIGN_APPROACH); optional 64 from 1920 | 40–64 from 1024 | Measure the first card's left edge |
| Poster card at 1440 | Apple TV 168 × 252, JustWatch 174 × 247, Letterboxd 70 × 105 (dense) [M] | — | 6 per row: ~204 × 306 | 160–240 px wide | Measure |
| Cards per row at 1920 | JustWatch 7 at 1440 [M] | — | 6 (DESIGN_APPROACH: 6 × 264); 7 (~236 × 355) proposed | 6–8 | Measure |
| Gap between cards | Apple TV 22, JustWatch 16, Netflix 12, Letterboxd 10, Mubi 4 [M] | — | 12 / 16 / 24 (sm / md / lg) | ± 4 | Measure |
| Peek of the last card in a row | Apple TV 19 px, Netflix 271 px (~0.8 card) [M] | — | 25–45 % of a card on touch; ≥ 16 % (≥ 32 px) on desktop | never 0 % or ≥ 50 % | Measure |
| Row snapping | Apple TV, Netflix `x mandatory` [M] | — | `x proximity`, `snap-align: start`, `scroll-padding-inline-start` = gutter; an arrow moves one page minus one card | — | Computed style |
| Section gap | — | Proximity: space between groups ≥ 2 × space inside [G] | 48 (DESIGN_APPROACH); 64 from 1024 proposed | 40–64 | Measure |
| Header height | Linear 73, Netflix 72, Letterboxd 72, Vercel 64, JustWatch 61, Mubi 51 [M] | — | UX_NOTES: 76 at the top, 60 as glass; ≤ 10 % of the viewport height | 56–76 | Measure at the top and after scroll |
| Header behaviour | Linear: always fixed glass, `blur(20px)`, 1 px border at white 8 %, no change on scroll; Vercel sticky 64 [M] | — | Glass after 20 px of scroll (UX_NOTES); never hides while focus is inside | — | Scroll and record |
| Corner radius | Apple TV cards 14; Netflix 8 / 16; JustWatch posters 5; Letterboxd 2–8 (scales with the poster); Mubi 2; Linear 6–12 [M] | — | 4 badges, 8 poster cards and buttons, 12 large cards and menus, 16 dialogs, full for pills | one step either way | Computed style |
| Button height | Apple TV 36, Netflix 40 / 48, JustWatch 32, Vercel 32, Linear 24–32 [M] | — | 32 / 40 / 48 (sm / md / lg) | ± 4 | Measure |
| Target size | — | WCAG 2.5.8 ≥ 24 × 24 [S]; Apple 44 pt, M3 48 dp [G] | ≥ 24 everywhere, ≥ 44 on touch | 24 hard floor | Measure the hit area |
| Dialog width | Vercel search ~640 [M] | — | Watchlist dialog 448 (FIGMA_WORKFLOW); scale 400 / 512 / 640 / 960, at most `100vw − 32` | ± 32 | Measure |
| Toast | — | sonner 356 px, offset 24 (16 on mobile) [G] | 356 px wide, bottom right (UX_NOTES); full width minus 32 below 640 | 320–420 | Measure |
| Reflow | — | WCAG 1.4.10: 320 px with no side scroll [S] | 0 px of page overflow at 320 | 0 | Resize to 320 |

## 5. Colour and contrast

| Parameter | Reference sites | Standard | Target | Tolerance | How to check |
| --- | --- | --- | --- | --- | --- |
| Dark background | Linear rgb(8,9,10), JustWatch rgb(6,13,23), Letterboxd rgb(20,24,28), Apple TV rgb(31,31,31), Vercel #000 [M] | M3 dark surface #121212 [G] | OKLCH L 16–19 %, light blue tint (C 0.01–0.02); not pure black | L 14–21 % | Token value |
| Surface steps | — | M3 tonal elevation [G] | 4 steps, ΔL +3.5–5 each (background → card → raised → popover) | ΔL 3–6 | Token values |
| Primary text on dark | Apple TV white 92 %, Linear rgb(247,248,248), Vercel rgb(237,237,237) [M] | WCAG 1.4.3 ≥ 4.5:1 [S] | L 92–95 %, not pure white for paragraphs; ≥ 7:1 | L 90–96 | Contrast checker |
| Secondary text on dark | Apple TV white 64 %, Linear rgb(138,143,152), Vercel rgb(161,161,161) [M] | ≥ 4.5:1 [S]; APCA Lc ≥ 60, ≥ 75 for body [G, draft] | L 75–80 % (opaque colour on surfaces) | ≥ 4.5:1 and Lc ≥ 60 | Contrast checker + APCA |
| Non-text contrast | — | WCAG 1.4.11 ≥ 3:1 [S] | Input borders, selected-tab marks, rating stars, focus ring ≥ 3:1 | — | Contrast checker |
| State layers | Linear hover background white 8 % [M] | M3 hover 8 %, focus 10 %, pressed 10 %, dragged 16 %; disabled 38 % / 12 % [G] | Same as M3 | 6–12 % | Computed style |
| Focus ring | — | WCAG 2.4.7, 2.4.13 [S] | 3 px solid outline, offset 2 px; a double ring on images; an `outline`, so it survives forced colours | 2–4 px | Tab; Windows forced colours emulation |
| Text on images | — | ≥ 4.5:1 on the worst backdrop [S] | Scrim ≥ 55–60 % behind body text, ≥ 65 % behind 80 % text, ≥ 45 % behind a large title alone | — | Test against the brightest backdrop |
| Glass | Linear header: transparent + `blur(20px)` [M] | — | 60 % glass only under 100 % text ≥ 14 px at 500; 80 % text needs ≥ 70 % glass; 90 % for menus | α 0.6–0.9; blur 12–20 px | Contrast checker on a white poster behind |
| Rating yellow on light | — | ≥ 3:1 for icons [S] | A darker amber on the light theme | ≥ 3:1 | Contrast checker |
| Theme switch flash | — | — | 0 frames of the wrong theme on load | 0 | Reload with the other theme |

## Documented behaviours and their benchmarks

Every behaviour, animation and visual number that the documentation describes, with its benchmark. "Not set" means the docs describe the behaviour but give no number. **Pass** means the documented value is inside the tolerance. **Set** means the target fills a gap. **Change** means the documented value is outside the tolerance; it is listed in [Proposed changes](#proposed-changes).

Sources: UX = [UX_NOTES](./UX_NOTES.md), DA = [DESIGN_APPROACH](./DESIGN_APPROACH.md), FW = [FIGMA_WORKFLOW](./FIGMA_WORKFLOW.md), ADR = `docs/03-architecture/decisions/`, AR = `docs/03-architecture/ARCHITECTURE.md`, API = `docs/03-architecture/API_SPEC.md`, TS = `docs/05-testing/TEST_STRATEGY.md`.

### Loading and skeletons

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Skeleton delay for a page or Home section (UX, DA § 5) | 300 ms | NN/g: nothing under 1 s; common practice 200–500 ms [R][G] | 300 ms | Pass |
| Shortest time a skeleton stays | Not set | TanStack `pendingMinMs` 500 ms; React 19 throttle ~300 ms [G] | 400–500 ms | Set |
| Skeleton keeps the shape of the content (DA § 5) | No CLS figure | CLS ≤ 0.1 [S] | ≤ 0.05; 0 on lists | Set |
| Skeleton pulse (`Skeleton`) | Not set | MUI 2 s; Mubi 750 ms [G][M] | 1.5–2 s cycle, opacity ≥ 0.5 range; static under reduced motion | Set |
| Home sections load and fail on their own (UX) | — | NN/g: errors stay local [R] | Each section shows by itself as its data arrives | Pass |
| Detail and Person pages come from one request (ADR-0017) | 1 request | LCP ≤ 2.5 s [S] | One skeleton, whole page at once, LCP ≤ 2.0 s | Pass |
| Old Movies / TV results stay dimmed while new ones load (UX) | Dim level and timing not set | React `useTransition` [G] | Opacity 0.6, fade 150 ms, only after the same 300 ms delay | Set |
| Search tab shows a grid skeleton (UX) | — | Same as the page skeleton | 300 ms delay, same shape as the grid | Pass |
| First visit to the other remote shows the page skeleton (ADR-0011) | — | LCP ≤ 2.5 s [S] | Same 300 ms delay; remote download ≤ 1 s on Fast 4G | Set |
| A wait over 10 s shows progress (DA § 5) | 10 s | NN/g 10 s [R] | 10 s | Pass |
| Load more spinner rotation | Not set | Material and Apple indicators ≈ 1 turn a second [G] | 0.75–1 s a turn, linear; still spins under reduced motion (it shows progress, not movement of content) | Set |
| `AddToWatchlist` spinner while the dialog code loads (ADR-0014) | Not set | INP ≤ 200 ms [S]; feedback ≤ 100 ms [R] | Pressed state ≤ 100 ms; spinner after 300 ms; dialog ≤ 1 s on Fast 4G | Set |
| Performance goal (PRD) | LCP < 2.5 s, Lighthouse ≥ 90 | Core Web Vitals [S] | LCP ≤ 2.0 s, INP ≤ 150 ms, CLS ≤ 0.05 | Pass (targets tighter) |

### Navigation and focus

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Navigation moves focus to `main` and starts at the top; Back keeps the restored place (UX, DA § 6) | — | Gatsby / Fable Tech Labs study [R]; WCAG 2.4.3 [S]. Apple TV and JustWatch leave focus on `body` [M] | As documented; focus moves in the same frame as the new content | Pass (better than the sites) |
| Search with no query focuses its input (UX) | — | APG combobox practice [G] | As documented | Pass |
| Search tabs are links with `aria-current` and never move focus (UX) | — | APG: links when each tab is a URL [G] | As documented | Pass |
| More like this opens at the top; Back returns to the place (UX) | — | `history.scrollRestoration` [S] | Back ≤ one row off | Set |
| Filmography shows 30 rows, then **Show all** moves focus to the first new row (UX) | 30 rows | APG feed practice [G]; Baymard batch size [R] | As documented | Pass |
| After Remove, focus moves to the heading without scrolling (UX, ADR-0015) | — | WCAG 2.4.3 [S] | As documented | Pass |
| Dialog takes focus on open, Escape closes, focus returns to the opener (DA § 4, ADR-0014) | — | APG Dialog [G]. Linear and JustWatch return focus to the trigger [M] | As documented | Pass |
| Fixed header does not cover focus (UX) | `scroll-padding-top: 6rem` (96 px), header 76 / 60 px | WCAG 2.4.11 [S] | Header height + 8 px or more | Pass (96 ≥ 84) |
| Toast or offline banner does not cover focus (UX) | `scroll-padding-bottom: 5rem` (80 px), banner ≤ ~78 px | WCAG 2.4.11 [S] | Banner height + 8 px or more | Change: 80 < 86 |
| Grid links scroll clear of the sticky filters (UX) | `scroll-mt-52` (208 px) | WCAG 2.4.11 [S] | Filter bar + header + 8 px | Pass if the bar is ≤ 140 px |
| Focus never stops on a cut-off card in a row (ADR-0014) | `scroll-px` = card width | WCAG 2.4.11 [S] | As documented | Pass |
| Tab reaches every control, no trap; skip link; `aria-current` in the nav (UX, TS) | — | WCAG 2.1.2, 2.4.1, 2.4.7 [S] | As documented | Pass |
| Focus ring on Button and Input (UX, DA § 7) | 3 px, 5.27:1 dark, 4.57:1 light | WCAG 2.4.13: ≥ 2 px, 3:1 [S] | 3 px, ≥ 3:1 | Pass |
| Focus ring on images (UX) | 2 px band + 3 px ring, ~18:1 apart | Double ring [G] | As documented | Pass |
| `focus-ring-inset` in scrollers (UX) | 2 px inside | WCAG 2.4.7 [S] | 2–3 px, ≥ 3:1 | Pass |
| `aria-invalid` ring (UX) | 4.9:1 dark, 5.1:1 light | WCAG 1.4.11 [S] | ≥ 3:1 | Pass |
| Focus over the header scrim (UX) | ≥ 8.13:1 | WCAG 1.4.11 [S] | ≥ 3:1 | Pass |

### Header and scroll

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Scrim at the top of the page (UX) | As tall as the header, fades over 28 px | — (no site uses a scrim header; Linear is glass from the start [M]) | As documented | Pass |
| Header icons and links over the scrim (UX) | 6.38:1 dark, 7.02:1 light | WCAG 1.4.3 [S] | ≥ 4.5:1 | Pass |
| Header turns to glass (UX) | After 20 px of scroll | Common practice 8–20 px [G] | 20 px | Pass |
| Scrim → glass change | Not set | A state change: 150–200 ms [G] | 200 ms (`duration-state`) opacity, `ease` | Set |
| Header height change, 76 → 60 px (UX) | Timing not set | Moves ≤ 100 px: 150–200 ms [G] | 200 ms, standard curve; at once under reduced motion | Set |
| `glass-bar` and `glass` (UX, DA § 1) | 0.9 bar; 0.6 dark / 0.7 light chips; blur 20 px | Linear header blur 20 px [M]; glass α 0.6–0.9 [G] | As documented | Pass |
| Nav text on `glass-bar` (UX) | 4.83:1 dark, 5.96:1 light | WCAG 1.4.3 [S] | ≥ 4.5:1 | Pass |
| Profile chip gradient (UX) | ends 0.8 opaque, ≥ 3.53:1 | WCAG 1.4.11 [S] | ≥ 3:1 | Pass |
| Sticky filters on Movies / TV Shows (UX) | — | Header ≤ 10–12 % of the viewport [G] | Header + filters ≤ 25 % of the viewport height | Set |
| Page starts below the header (DA § 3) | `pt-28` / `pt-36` | 4 px grid [G] | As documented | Pass |
| Phone menu open and close (UX) | ~257 px tall, timing not set | Sheet that stays near: 250 / 200 ms [G] | 250 ms in, 200 ms out, height or `clip-path`, standard curve | Set |

### Hover and press

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Header prefetch on hover or focus (API, ADR-0011) | 200 ms | TanStack 50 ms, instant.page 65 ms [G] | 100 ms | Change |
| Card hides title, year and rating until hover or focus on a fine pointer (FW, DA § 4) | — | WCAG 1.4.13 [S]. Apple TV reveals a scrim on hover [M] | As documented; shown at rest on touch | Pass |
| Card hover reveal | Not set | Apple TV 200 ms in and out, `ease` [M]; Atlassian 150 ms [G] | 200 ms (`duration-state`) opacity, same in and out, no delay | Set |
| Card hover scale or lift | Not set, no scale stated | Apple TV, JustWatch, Netflix: none [M] | None | Set |
| Featured Tile gradient on hover (DA § 1) | 80 % → 90 % | M3 hover layer + 8–10 % [G] | As documented | Pass |
| Featured Tile gradient change | Not set | Same as card hover | 200 ms opacity | Set |
| Button, pill and link hover and press (DA § 6) | 150–200 ms | Linear 100 ms, Vercel 150 ms [M]; Atlassian 100–150 ms [G] | 150 ms hover; press 100 ms in, 150 ms out | Pass |
| Destructive Button and Rating Badge layers (FW) | 60 % / 100 % fill, hover 90 %, tint 10 % | M3 state layers 8–12 % [G] | As documented | Pass |
| Target sizes (UX, DA § 7) | 44 on touch, ≥ 24 everywhere; card button, segments, phone logo 32; Settings segments 28; header buttons 36; row arrows 40 | WCAG 2.5.8 24 px [S]; Apple 44 pt [G] | As documented | Pass |
| Hover styles also fire on tap (ADR-0009) | — | — (a decision) | No content that only hover shows | Pass |
| Whole card opens the title, its watchlist button does not (TS) | — | Fitts' law [R] | As documented | Pass |

### Cards and rows

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Row bleeds to the right edge (DA § 3) | Row starts at the gutter | Apple TV peek 19 px, Netflix 271 px [M]; peek 25–45 % on touch, ≥ 16 % on desktop [G] | A peek in that range at each breakpoint | Set |
| Row arrows (UX, FW) | 40 × 40; out of Tab order; distance not set | Apple TV moves one card [M]; practice: one page minus one card [G] | One page minus one card | Set |
| Row scroll on an arrow press | Not set | Apple TV ~350 ms ease-out, native smooth [M] | Native smooth scroll; `auto` under reduced motion | Set |
| Arrows show on row hover and hide at the ends | Not set | Apple TV 250 ms linear [M] | 200 ms opacity | Set |
| Genre pills over the hero (UX) | 32 px below `sm`, 64 px from `sm` | 4 px grid [G] | As documented | Pass |
| Gutter (DA § 3) | 16 / 24 / 48; max 1800 | Apple TV 41, JustWatch 64 [M]; M3 16 / 24 [G] | As documented | Pass |
| Grid columns (DA § 3) | 2 at 390, 4 at 768, 6 at 1440 and 1920 | Card 160–240 px wide; JustWatch 7 at 1440 [M] | 7 at 1920 | Change |
| Section gap and title gap (DA § 3) | 48 and 16 | Proximity ≥ 2 : 1 [G] | 48; 64 from 1024 proposed | Pass |
| Gradients under text (DA § 1) | Hero 0 → 60 % at 80 % → 100 %; tiles 0 → 80 % at 65 % → 100 %; detail 70 / 90 / 100 % | ≥ 55–60 % behind body text [G]; WCAG 1.4.3 on the worst image [S] | As documented | Pass |
| Secondary text on images (DA § 1) | `foreground` 80 % | ≥ 4.5:1 on the worst image [S] | Scrim ≥ 65 % under it | Pass |
| Text clamps (DA, FW, UX) | Hero 3 / 4 lines, tile title 2, reviews 6, season 3 | Clamp by lines [S] (1.4.12) | As documented | Pass |
| Bento: first tile 2 × 2 from `sm` (DA § 3) | — | WCAG 1.3.2 [S] | As documented | Pass |
| Detail grids (FW) | Cast 6 (12 at 2xl), videos 2, images 3, seasons 2; poster 256 | — | As documented | Pass |

### Dialogs and menus

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Dialog code loads on the first press (ADR-0014) | ~16 kB | INP ≤ 200 ms [S] | Open ≤ 200 ms on a cached chunk, ≤ 1 s on Fast 4G | Set |
| One dialog at a time; presses during the download are ignored (ADR-0014) | — | APG [G] | As documented | Pass |
| Dialog ignores presses right after it opens (ADR-0014) | 350 ms | Android double-tap timeout 300 ms; Windows double-click 500 ms [G] | 350 ms | Pass |
| A press outside does not close it (ADR-0014) | — | APG: optional [G] | As documented | Pass |
| Only the save button saves (ADR-0014) | — | APG [G] | As documented | Pass |
| Sign-in offer waits while the session restores (ADR-0014) | Not set | Feedback ≤ 100 ms, skeleton after 300 ms [R] | A skeleton inside the dialog after 300 ms while the session restores | Set |
| Dialog size and overlay (FW) | 448 wide; overlay `background/80` | Vercel overlay 80 % [M] | As documented | Pass |
| Dialog open and close (DA § 6) | 250–300 ms, `duration-move` | Vercel 300 / 300 ms [M]; Atlassian 250 / 200 ms [G] | 250 ms in, 200 ms out, scale 0.96 → 1 + opacity | Pass (exit shorter) |
| Dialog overlay fade | Not set | Vercel 300 ms [M] | 200 ms in, 150 ms out | Set |
| Sort menu (`DropdownMenu`) open and close | Not set | Linear 180 / 180 ms, JustWatch 300 / 300 ms [M]; Atlassian 150 / 100 ms [G] | 150 ms in, 100 ms out, scale 0.96 → 1 + opacity | Set |
| Remove asks first in an inline question (UX, ADR-0015) | — | NN/g: Undo beats a confirmation [R] | As documented | Pass (Undo noted as an option) |
| Folder forms are inline, Delete still asks (FW) | — | — | As documented | Pass |
| Menu items show an outline in forced colours (TS) | — | WCAG 2.4.7 [S] | As documented | Pass |

### Toasts and status messages

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Toast place and size (UX, FW) | Bottom right, 356 wide, 24 from the edges; below 600 full width minus 16 | sonner 356 px, offset 24 / 16 [G] | As documented | Pass |
| Toast slides in from its corner (DA § 6) | Not set | Carbon 240 ms; Atlassian 250 / 200 ms [G] | 250 ms slide ≤ 16 px + fade; 200 ms fade out | Set |
| Toast closes by itself; with an action it stays (UX, DA § 5) | Time not set | sonner 4 s; React Spectrum ≥ 5 s [G]; reading speed [R]; WCAG 2.2.1 [S] | max(5 s, 1.5 s + 300 ms per word), at most 10 s; pauses on hover and focus | Set |
| Toast stack (UX) | — | sonner 3 [G] | ≤ 3 visible, gap 14 px | Set |
| Toast only on top of data; mutations always toast (UX, AR) | — | NN/g: feedback near the action [R] | As documented | Pass |
| Live region announcements (DA § 5) | — | WCAG 4.1.3 [S] | As documented | Pass |
| Search live count filled after the results (UX) | 100 ms | Screen readers miss a region changed in the same frame; common practice 100–150 ms [G] | 100 ms; check in NVDA and VoiceOver | Pass |
| Result counters are `role="status"` `<output>` (UX) | — | WCAG 4.1.3 [S] | As documented | Pass |

### Forms and search input

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Movies / TV query goes to the URL after a pause (UX) | 300 ms | 150–300 ms [G]; keystroke interval ~200–300 ms [R] | 300 ms | Pass |
| Genre and sort are disabled while a query is typed (UX) | — | NN/g: say why a control is off [R] | As documented, with the one-line hint | Pass |
| Search runs on submit only (UX) | — | — | As documented | Pass |
| Search input limit (UX) | 100 characters | — | As documented | Pass |
| Theme applies at once, no Save (UX) | — | NN/g: instant apply for settings [R] | As documented | Pass |
| Empty states with actions (UX) | — | NN/g empty states [R] | As documented | Pass |

### Lists and Load more

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Load more: spinner, inline error, "That's all" (UX) | — | Baymard: Load more [R] | As documented; spinner ≤ 100 ms after the press | Pass |
| Page size (TS) | 20 | Baymard 20–40 a step [R] | 20 | Pass |
| List limits (UX) | Cast 12, videos 6, backdrops 12, More like this 12, reviews 3, Known for 12, filmography 30 | One or two rows of the grid [G] | As documented | Pass |
| Biography Show more (UX) | Over 600 characters, 6 lines | ~65 characters a line × 6 ≈ 400–600 [G] | As documented | Pass |
| Biography and filmography expand | Not set | Carbon 150–400 ms [G] | At once (long lists are layout-heavy); focus moves to the first new row | Set |
| Grid / compact switch (UX) | Timing not set | — | At once | Set |
| A changed Watchlist row stays until the filter changes (UX) | — | Free undo [R] | As documented | Pass |

### Theme

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Theme applied before the first paint (UX, ADR-0008) | — | — | 0 frames of the wrong theme | Set |
| `system` follows `prefers-color-scheme` (UX) | — | Media Queries 5 [S] | As documented | Pass |
| Visual change on a theme switch | Not set ("at once") | — | At once | Set |

### Offline and errors

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Offline banner at the bottom (UX, AR) | ≤ ~78 px tall | `offline` event [S] | Shows ≤ 1 s after the event; stays until online | Set |
| Offline banner appears and goes | Not set | A small enter: 200–250 ms [G] | 200 ms fade + slide ≤ 16 px in, 150 ms out | Set |
| Page error with **Try again**; 404 → `NotFound` (UX) | — | NN/g error messages [R] | As documented | Pass |
| Section error stays in its section (UX) | — | NN/g [R] | As documented | Pass |
| Retries and cache (AR, API) | `staleTime` 5 min; ≤ 2 retries, network / 5xx / 429 | TanStack backoff ~1 s, 2 s [G]; retry 408 / 429 / 5xx [G] | As documented, with ~1 s and ~2 s delays | Set (delays) |
| Stale chunk reload, shell error, remote unavailable (AR) | Cooldown 60 s | — | As documented | Pass |

### Page transitions

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Card poster morphs into the detail poster (DA § 6) | 300 ms (`duration-move`) | M3 container transform ~300 ms [G]; none of the sites morph [M] | 300 ms, enter curve | Pass |
| Other page changes cross-fade (DA § 6) | 300 ms (`duration-move`) | View Transitions default 250 ms [S]; Apple TV and JustWatch swap at once [M] | 200–250 ms | Change |
| Only a new path animates (DA § 6) | — | — | As documented | Pass |
| Transitions stay inside one remote; skeleton takes part (DA § 6) | — | — | As documented | Pass |
| One name, set on the opened card (DA § 6) | — | A doubled name aborts the transition [S] | As documented | Pass |
| Focus and scroll do not move with the motion (DA § 6) | — | WCAG 2.4.3 [S] | As documented | Pass |
| Browsers without the API change the page at once (DA § 6) | Chrome 111, Safari 18, Firefox 144 | Baseline [S] | As documented | Pass |
| Motion tokens (DA § 6) | 200 ms, 300 ms; ease-out in, ease-in out; no curve values | See § 1.2–1.3 | Add the curve values and `duration-fast` 150 ms | Change |
| Upper bound of a transition (DA § 7) | ≤ 300 ms | NN/g up to 400 ms [R] | ≤ 300 ms | Pass |
| No spring motion; no animated font weight (DA) | — | — | As documented | Pass |

### Reduced motion and other preferences

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Reduced motion: no page transitions, nothing scales or slides (DA § 6) | Durations "shortened", value not set | WCAG 2.3.3 [S]; Netflix 60 rules, Linear 52 [M] | Movement 0.01 ms; fades ≤ 150 ms may stay | Set |
| The 350 ms early-press guard still works (ADR-0014) | 350 ms | — | As documented | Pass |
| No flashing; no auto-moving content without a pause (DA § 7) | ≤ 3 a second; ≤ 5 s | WCAG 2.3.1, 2.2.2 [S] | As documented | Pass |
| Reduced transparency or more contrast: solid glass (DA, UX) | 1 px border | Media Queries 5 [S]; Apple Reduce Transparency [G] | As documented | Pass |
| Forced colours (UX, DA) | — | CSS Color Adjust [S] | As documented | Pass |
| Contrast minima (DA § 1) | 4.5:1, 3:1 | WCAG 1.4.3, 1.4.11 [S] | As documented; 7:1 for primary text | Pass |
| Reading text (DA § 2) | 16 / 14 / 12, line height ≥ 1.5, ≤ 75 characters | § 3 | As documented | Pass |
| Fluid type grows with zoom (DA § 2) | `clamp()` with `rem` | WCAG 1.4.4 [S] | Max / min ≤ 2.5 per step | Pass |
| Reflow at 320 (DA § 3) | 320 px | WCAG 1.4.10 [S] | 0 px of page overflow | Pass |

### Images

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Images keep their slot (DA § 4) | 2:3, 16:9, square | CLS [S] | 0 shift | Pass |
| Image appears when it loads | Not set | Apple TV 100 ms, Mubi 600 ms [M]; Carbon 110 ms [G] | 200 ms opacity; none for an image already in the cache | Set |
| Lazy or eager loading | Not set | Chrome lazy margin 1250–2500 px; `fetchpriority` [G] | Hero and detail poster eager + `fetchpriority="high"`; the first visible row eager; the rest lazy | Set |
| Text on images sits on a gradient (DA § 1) | — | WCAG 1.4.3 [S] | As documented | Pass |
| Videos open YouTube; links open a new tab and say so (UX) | — | WCAG 3.2.5 [S] | As documented | Pass |

### Watchlist writes

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Status switch writes at once, no spinner, keeps focus (UX, ADR-0015) | — | Feedback ≤ 100 ms [R] | Pressed state ≤ 100 ms | Pass |
| Cache keeps only what the server accepted (ADR-0015) | — | — | The pressed state shows until the answer; the answer renders in the same frame | Set |
| Writes of one title run in order (ADR-0015) | — | — | As documented | Pass |
| Rows ignore presses after a removal (ADR-0015) | 400 ms | Double-tap 300–500 ms [G]; removal motion ≤ 300 ms | 400 ms | Pass |
| Removal patches the cache, the row goes at once (ADR-0015) | — | — | The row leaves at once (no exit animation, so the next row does not move under the finger) | Set |
| Folder picker shows `saving` (FW) | Not set | Feedback ≤ 100 ms [R] | Busy state ≤ 100 ms after the press | Set |
| Writes do not queue offline (ADR-0013) | — | — | As documented | Pass |
| Profile counts load and fail on their own (UX) | — | NN/g [R] | As documented | Pass |

### Sign-in

| Behaviour | Documented | Benchmark | Target | Verdict |
| --- | --- | --- | --- | --- |
| Session restores before the first render; anonymous visitors load no Firebase (ADR-0010) | ~51 kB SDK only when signed in | LCP [S] | The SDK starts loading before the first render (no extra wait from our side) | Pass |
| Login prepares sign-in on mount, so the popup opens on the click (ADR-0010) | — | HTML user activation [S] | 0 ms of async work before the popup | Pass |
| Google popup only; no cognitive test (UX, DA) | — | WCAG 3.3.8 [S] | As documented | Pass |
| Protected pages return to the same page after sign-in (ADR-0014, `RequireAuth`) | — | — | As documented | Pass |

## Proposed changes

Values where the documentation and the benchmark disagree. Each needs a decision and its own ticket; until then the documentation decides.

1. **Motion tokens get new curves and one more step.** `ease-enter` changes from `cubic-bezier(0, 0, 0.2, 1)` to `cubic-bezier(0, 0, 0, 1)`, `ease-exit` from `cubic-bezier(0.4, 0, 1, 1)` to `cubic-bezier(0.3, 0, 1, 1)`; add `ease-standard` = `cubic-bezier(0.2, 0, 0, 1)` and `duration-fast` 150 ms (hover, press, menus). Today the curves live only in `theme.css`: DESIGN_APPROACH § 6 names them without values.
2. **Page cross-fade 250 ms, not 300 ms.** The browser default is 250 ms, and the reference catalogs swap at once. The poster morph keeps 300 ms.
3. **Overlays exit 50 ms faster than they enter:** dialog 250 / 200 ms, menu 150 / 100 ms, toast 250 / 200 ms.
4. **Header prefetch after 100 ms of hover, not 200 ms.** It wins about 100 ms before the click and stays cheap.
5. **7 cards per row at 1920.** 6 gives 264 px cards, above the 160–240 px band of the reference catalogs.
6. **`scroll-padding-bottom` ≥ banner height + 8 px** (about 86 px instead of 80 px).
7. **Section gap 64 from 1024** (48 below), to keep the 2 : 1 ratio next to the 48 px gutter.

## How to measure our own build

Run the checks on a production build (`pnpm build:deploy`, then `pnpm emulators` or a preview channel), not on `pnpm dev`: the dev server is slower and changes timing.

1. **Durations and curves.** Paste the recorder below into the DevTools console, then hover, open or click within 3 seconds. Read the result with `copy([...new Set(window.__rec)].join('\n'))`. Each line is: kind (T transition, A animation), property, duration, delay, curve, target, keyframes.

   ```js
   window.__rec = [];
   {
     const seen = new Set();
     const tick = () => {
       for (const a of document.getAnimations()) {
         if (seen.has(a)) continue;
         seen.add(a);
         const t = a.effect.getTiming();
         const k = a.effect.getKeyframes();
         window.__rec.push([a.constructor.name, a.transitionProperty || a.animationName, Math.round(t.duration), Math.round(t.delay), t.easing, a.effect.pseudoElement || a.effect.target?.className, JSON.stringify([k[0], k.at(-1)])].join(' | '));
       }
     };
     for (const a of document.getAnimations()) seen.add(a);
     clearInterval(window.__ri);
     window.__ri = setInterval(tick, 16);
     setTimeout(() => clearInterval(window.__ri), 3000);
   }
   ```

2. **View Transitions.** DevTools → Animations panel, set the speed to 10 %, open a title from a card. The panel shows each `::view-transition-*` animation with its duration and curve.
3. **Smooth scroll.** Sample `row.scrollLeft` every 16 ms after an arrow press; the time from the first to the last change is the scroll duration.
4. **Loading delays.** Network throttling "Fast 4G", Performance panel with screenshots: the first frame with a skeleton minus the navigation start is the delay; the last skeleton frame minus the first is the time it stays.
5. **Core Web Vitals.** Lighthouse in mobile mode for LCP, CLS and TBT; the Performance panel's live metrics for INP while typing and pressing.
6. **Reduced motion and other preferences.** DevTools → Rendering: emulate `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and `forced-colors`, then run the recorder again: no line may show `transform`, `translate` or `scale`.
7. **Contrast.** DevTools colour picker (WCAG and APCA values) on the worst-case image: a white and a black poster behind the text.
8. **Sizes.** The Elements panel box model, or `getBoundingClientRect()` on cards, gaps, buttons and the header, at 320, 390, 768, 1440 and 1920 px.
