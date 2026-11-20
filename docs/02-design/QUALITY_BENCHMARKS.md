🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# UX, accessibility and performance benchmarks

The standards CinePulse follows for interaction, accessibility and speed, and the target numbers we take from them. Use this page to review a design, a pull request or a release. It is the companion of [DESIGN_BENCHMARKS](./DESIGN_BENCHMARKS.md), which holds the numbers for look, motion and behaviour timing. Standards for whole tasks (flows, navigation, first run, watchlist, account, discovery, trust, UX measurement and UI content) are in [UX_STANDARDS](./UX_STANDARDS.md).

The agreed behaviour of each screen is in [UX_NOTES](./UX_NOTES.md) and [DESIGN_APPROACH](./DESIGN_APPROACH.md). Where this page and those documents differ, those documents still decide. Each difference is listed in [Proposed changes](#proposed-changes) and is decided in its own ticket.

Compiled and measured on 2026-11-20 (CIN-177).

## How to read this page

**Only the frontend is in scope.** We do not control how fast TMDB, Firebase Auth or Firestore answer, so no target here is a server response time. Where a metric includes server time (LCP, FCP), the target is set on the part the frontend controls: bytes, request order, priorities, rendering. The full metric is tracked as an outcome.

Sources are tagged as in DESIGN_BENCHMARKS: **[S]** a normative standard (ISO, W3C, WCAG, law), **[G]** a design system or vendor guideline, **[R]** research or survey data, **[M]** our measurement of a reference site. **(unverified)** marks a value we could not check on the primary source; check it before it becomes a hard rule.

Verdicts compare the **documented** behaviour with the benchmark. We did not audit the code.

| Verdict | Meaning |
| --- | --- |
| **Pass** | The documented behaviour matches the benchmark. |
| **Set** | The docs say nothing; the target fills the gap. |
| **Change** | The documented behaviour differs; see [Proposed changes](#proposed-changes). |

## 1. Interaction standards (UX)

### 1.1 Which standards apply

| Standard | What it gives CinePulse | Status |
| --- | --- | --- |
| ISO 9241-11:2018 [S] | The definition of usability: effectiveness, efficiency and satisfaction for given users, goals and context. Every benchmark ticket names its user, goal and context ("keyboard user adds a title to a folder on a 320 px phone"). | In force |
| ISO 9241-110:2020 [S] | 7 interaction principles with 21 categories of recommendations. It is our review checklist ([§ 1.2](#12-iso-9241-110-review-checklist)). The numbered recommendations and the Annex A checklist are paywalled; we use the category level. | Confirmed 2025 |
| ISO 9241-112:2017 [S] | 6 principles for presenting information: detectability, freedom from distraction, discriminability, unambiguous interpretability, conciseness, consistency. | In force (ISO pages disagree on the status) |
| ISO 9241-125:2017 and 9241-143:2012 [S] | Visual presentation and forms. Their detailed clauses are paywalled and not checked; the concrete numbers come from WCAG 2.2 ([§ 3](#3-accessibility)). | Pointer only |
| ISO 9241-210:2019 [S] | Human-centred design process: understand users, involve them, evaluate, iterate. A process, not a product check: each UI ticket ends with a keyboard, screen reader and phone check. | Process |
| ISO/IEC 25010:2023 [S] | Quality model. "Usability" is now **interaction capability**, with 8 sub-characteristics, among them inclusivity, user error protection and self-descriptiveness (secondary sources). | Label only |
| ISO 24495-1 [S] | Plain language. Already the rule for every text (CLAUDE.md). | In force |
| Nielsen's 10 heuristics, Shneiderman's 8 rules [G] | A quick heuristic review of a screen ([§ 1.3](#13-heuristics)). | — |
| Laws of UX, Baymard Institute [R] | Numbers for targets, lists, filters and search ([§ 1.4](#14-numbers-from-research)). Baymard studies shops; we use its findings as analogies. | — |
| DSA art. 25, FTC and EDPB reports [S][G] | Rules against deceptive design ([§ 1.5](#15-deceptive-design)). | Benchmark |
| W3C Internationalization [G] | Text expansion, language and direction of TMDB strings, dates and numbers ([§ 1.6](#16-internationalisation)). | — |

### 1.2 ISO 9241-110 review checklist

The principles are not ranked. Where we trade one for another on purpose, we write it down in the ticket or an ADR (ISO 9241-110 § 4.5).

| Principle and category | Review check for CinePulse | Target | Verdict |
| --- | --- | --- | --- |
| **Suitability for the user's tasks.** Identify the task | A reader sees at once what the page is for; an empty Home section is left out, not shown empty | 0 empty sections | Pass |
| Optimise effort | Open a title from Home: 1 press. Add a title to the watchlist: ≤ 3 presses. Change a status: 1 press, no confirm. Back returns to the place in the list | ± 1 press; 0 extra scrolls | Pass |
| Defaults | New title is `planned`; default sort is popularity; rating sort has a vote floor; theme default with `system` available | — | Pass |
| **Self-descriptiveness.** Information is present and obvious | Nothing needs hover only: on touch the card title shows at rest; on keyboard focus shows the same as hover; applied filters and the query are visible | 0 hover-only information | Pass |
| Processing status | Every wait has a visible and an announced state: skeleton, dimmed old results, Load more spinner, saving state, offline banner | See DESIGN_BENCHMARKS § 2.2 | Pass |
| **Conformity with user expectations.** Expected behaviour | Back works as in any site: scroll restored, filters in the URL, the same query adds no history entry. The add dialog does not close on an outside press, so its close button must be obvious | 0 Back surprises | Pass |
| Consistency | One pattern for one job: inline **Try again** for sections and pages, a toast only on top of data; one term for one thing (watchlist, folder) | 0 mixed terms | Pass |
| Change of context of use | Behaviour adapts to pointer type, motion, transparency, contrast, colour scheme and offline | Every preference query tested | Pass |
| **Learnability.** Discovery, exploration, retention | Rows bleed to the edge so they look scrollable; **Show all N credits** states the count; More like this and Back return to the same place; theme and filters are kept | — | Pass |
| **Controllability.** Interruption | The user can leave any wait: navigate during a skeleton, Escape closes the dialog, controls stay usable while results load | 0 blocking waits | Pass |
| Flexibility, individualisation | Keyboard and pointer for every action; grid or compact view; theme light, dark or system; OS preferences; browser text size | — | Pass |
| **Use error robustness.** Avoidance | Double-press guards; one dialog at a time; Remove asks first with Cancel focused; the 100-character limit is stated before input | Guard ≥ the OS double-click time ([§ 1.4](#14-numbers-from-research)) | Change (guard length) |
| Tolerance | An over-long `q` from the URL is cut, not a crash. A Tab press that drops an unsent search draft is a tolerance risk | 0 silent data loss | Change (draft) |
| Recovery | Every error has a next step: Try again, Reload, Clear search, Reset filters; a failed write keeps the form | 0 dead ends | Pass |
| **User engagement.** Motivation, trust, involvement | Poster-led layout; motion never delays content; writes show only what the server accepted; external links say they open a new tab; browsing works signed out | 0 deceptive patterns | Pass |

### 1.3 Heuristics

A screen review asks each question once. A "no" is a finding with the screen and the step.

| Heuristic (Nielsen, NN/g; Shneiderman) | Question for a CinePulse screen |
| --- | --- |
| Visibility of system status; informative feedback | Does every press change something on screen within 0.1 s, and does every wait over 1 s show a skeleton or spinner? |
| Match with the real world | Are all words plain, with no codes, and are dates and runtimes in the reader's format? |
| User control and freedom; easy reversal | Is there always a way out (Escape, Close, Cancel, Back), and can a status change be undone with one press? |
| Consistency and standards | Do links look and act like links, and does the same error look the same everywhere? |
| Error prevention | Are destructive actions the only ones that ask first? |
| Recognition rather than recall | Are applied filters, the query and counts visible, so the reader does not have to remember them? |
| Flexibility and efficiency | Do shortcuts exist for frequent users: prefetch on intent, Enter to submit, skip link? |
| Aesthetic and minimalist design | Is anything on screen that competes with the content without helping the task? |
| Help users recover from errors | Does every error say what failed and give one action? |
| Help and documentation | Is help inline, next to the control (hints, limits), rather than on a separate page? |
| Dialogs yield closure (Shneiderman) | Does every flow end with a visible and an announced result? |
| Reduce short-term memory load (Shneiderman) | Is state in the URL, so a reload or a shared link keeps it? |

### 1.4 Numbers from research

| Rule | Source | Target for CinePulse | Verdict |
| --- | --- | --- | --- |
| Response time limits | NN/g: 0.1 s feels instant, 1 s keeps the flow, 10 s keeps attention [R] | The UI's own reaction ≤ 0.1 s; an indicator only for waits over the 300 ms delay; a message after 10 s | Pass |
| Doherty threshold | < 400 ms keeps the user in flow [R] | The UI's reaction to input (state change, focus move, transition start) ≤ 400 ms; network waits show a placeholder | Pass |
| Progress indicator | NN/g: < 1 s none; 2–10 s looped animation; ≥ 10 s percent-done [R] | A percent is not possible for a network request: after 10 s show "Still loading…" and **Try again** | Pass |
| Fitts's law, target size | WCAG 2.5.8 24 px [S]; 44 px on touch [G] | The whole card is the hit area; targets ≥ 24 px, 44 px under `pointer: coarse` | See [§ 3.5](#35-target-size-and-text) |
| Hick's law | Choice time grows with the number of options [R] | Sort menu ≤ 5 options; filter types ≤ 6–8 in a horizontal bar (Baymard) | Pass (2 filter types) |
| Gestalt proximity | Near items read as a group [R] | Space inside a group ≤ half the space between groups | Pass |
| Double-click interval | Windows default 500 ms, Android double tap 300 ms (unverified) | A press guard ≥ 500 ms catches a Windows double click; 350 ms does not | Change (dialog guard 350 ms) |
| Items per load | Baymard: desktop 50–150 for visual lists, phone 15–30 [R] | 20 per press (one TMDB page) on phones; ≥ 40 on desktop before the first Load more | Change |
| Back to the same place | Baymard: 87 % of sites return to the same position; going to the top causes abandonment [R] | Back after 3 Load more presses restores every loaded page and the scroll position | Set for Movies / TV (documented only for filmography) |
| Applied filters | Baymard: 28–32 % of sites lack an applied-filter overview [R] | Applied genre, sort and status stay visible in the sticky bar, with one-press reset | Pass |
| Essential sort types | Baymard: popularity, rating (with a vote floor), newest [R] | As documented | Pass |
| Autocomplete (if added) | Baymard: ≤ 10 suggestions on desktop, 4–8 on phones; arrows move, Enter submits [R] | Follow these numbers and the APG combobox | — (no autocomplete) |
| No-results page | Baymard: about half are poor; tips alone are not enough [R] | Message + **Clear search** + at least one more path (genres, trending) | Change (one path today) |

### 1.5 Deceptive design

DSA art. 25 binds **online platforms** that share user content with the public. CinePulse keeps private watchlists only, so it is probably not one; we use the article as a benchmark anyway. This is our reading, not legal advice.

| Rule | Source | Target for CinePulse | Verdict |
| --- | --- | --- | --- |
| No option is pushed by prominence | DSA art. 25(3)(a) [S] | In the sign-in offer, "Sign in" and the way to dismiss are equally easy to see and reach | Pass |
| No repeated asking | DSA 25(3)(b) [S]; FTC "nagging" [G] | Sign-in appears only after a user's press, never on load or again after a dismiss | Pass |
| Leaving as easy as joining | DSA 25(3)(c) [S]; FTC "immortal accounts" [G] | Sign-out as easy as sign-in; deleting the account and its watchlist is as easy as signing up | Set (deletion not documented) |
| No forced registration | FTC [G] | Every catalog page works signed out | Pass |
| No auto-play, no disguised ads | FTC [G] | Videos are links; provider logos name the data source and are not ranked by payment | Pass |
| No emotional or confusing copy | EDPB 03/2022 (6 categories, secondary sources) [G] | No guilt copy on dismiss; privacy information ≤ 1 press from Sign in and Profile, in the UI language | Set |
| Storage without consent | ePrivacy art. 5(3) (unverified) [S] | Theme and the session flag are functions the user asked for; a consent banner is needed only if analytics are added | Pass |

### 1.6 Internationalisation

The UI is English only, but TMDB titles, names and overviews come in any language.

| Rule | Source | Target for CinePulse | Verdict |
| --- | --- | --- | --- |
| Text expansion | W3C: labels ≤ 10 characters grow 200–300 %, long text 130–160 % [G] | Buttons, pills, tabs, toasts and the header hold 2–3 × the label length; a card holds a 60-character German title in 2 lines | Set |
| Long words | — | `overflow-wrap: anywhere` on titles; 0 horizontal overflow at 320 px | Set |
| Language of parts | WCAG 3.1.2 [S] | An original title, overview or review in another language carries `lang` from TMDB (`original_language`); unknown language stays unmarked | Set |
| Text direction | W3C bidi [G] | Every TMDB string of unknown direction sits in `<bdi>` or `dir="auto"`, including the query echoed in "No movies found for …" | Set |
| Dates | W3C [G] | Month names or `Intl.DateTimeFormat`; never `03/04/02`; a year alone on cards is fine | Set |
| Numbers | — | Ratings, vote counts and runtimes through `Intl.NumberFormat` | Set |

## 2. Behaviour patterns from design systems

We compared each documented behaviour with GOV.UK, Carbon, Primer, Atlassian, Fluent 2, React Spectrum / React Aria, BBC GEL, Vercel's guidelines, Inclusive Components, the WAI-ARIA Authoring Practices (APG) and Android TV focus guidance. "Consensus" is what most of them agree on.

| Pattern | Consensus [G] (and [S] where APG or WCAG) | Target for CinePulse | Verdict |
| --- | --- | --- | --- |
| Card link | One primary link, the title; the rest of the card is a click area; a secondary button sits above it; no dead zones (Inclusive Components, Vercel) | The link's name is the title; the watchlist button does not open the title | Pass |
| Card hover and focus | The same change for hover and keyboard focus; TV systems scale 1.025–1.1 (Android TV) | Hover and `:focus-visible` look the same; scale ≤ 1.05 | Set |
| Row arrows | Real buttons, labelled with the destination ("Next, 3 to 5 of 10"), in Tab order, disabled at the ends (BBC GEL, APG) | Keep cards in Tab order **and** make the arrows labelled buttons, or document why the arrows stay hidden | Change |
| Row semantics | A labelled group with a list of items, so the size is announced (BBC GEL); carousel roles only for a rotating carousel (APG) | Row = heading + `<ul>` of cards | Set |
| Row scroll step | Half the row width; smooth, instant under reduced motion (BBC GEL) | One page of whole cards or half the row; see DESIGN_BENCHMARKS § 1.4 | Set |
| Auto-rotation | None, or pause on focus and hover with a stop button (APG, BBC GEL, WCAG 2.2.2) | No auto-rotation | Pass |
| Search tabs | Links with `aria-current` that change the URL, not ARIA tabs; Back returns to the previous tab (GOV.UK, APG, Primer) | As documented | Pass |
| Filters | Instant for one selection; state in the URL; result count in an always-present `role="status"` region (Carbon, Vercel, Primer) | As documented | Pass |
| Disabled controls | Avoid disabled controls unless research supports them (GOV.UK) | Filters disabled while a query is active: defensible (TMDB search ignores them); the hint must be visible | Pass (with reason) |
| Search | Submit for large data; always show the count, zero included; a clear control in the field (Carbon) | Submit search; count announced; add an in-field clear | Set (clear) |
| Search autofocus | Autofocus the single input on desktop, rarely on phones (Vercel) | Focus the input on desktop; do not open the keyboard on page open on touch | Change |
| Load more | A button, not infinite scroll (GOV.UK, Carbon); keep the label and add a spinner (Vercel); move focus to the first new item (Primer) | Spinner + "Load more"; focus the first new card, as filmography does | Change (label and focus) |
| Empty states | A short message, one next step; replace the empty structure, so a screen reader does not read an empty grid (Carbon) | As documented; no empty grid behind the message | Set |
| Skeleton delay and minimum | Show after 150–300 ms; once shown, keep 300–500 ms (Vercel); skeleton for pages, spinner for actions (Carbon, Primer) | 300 ms delay; 400–500 ms minimum (DESIGN_BENCHMARKS § 2.2) | Pass |
| Loading under reduced motion | Keep loading animation subtle; do not stop it (Primer) | Skeleton pulse slows to opacity only; the spinner keeps turning | Set |
| Toast duration | ≥ 5 s (React Spectrum); 7 s (Fluent); 5 s, ≥ 10 s with an action (Polaris, unverified) | **≥ 5 s**; pause on hover and focus | Set |
| Toast with an action | Never times out (Spectrum, Carbon, Fluent) | As documented | Pass |
| Failed write | Never time out an error that matters (Atlassian, Carbon, WCAG 2.2.4); GOV.UK and Primer use inline messages | A failed watchlist write shows its message next to the row or form, or in a toast that stays until dismissed | Change |
| Toast stack | ≤ 4 visible (Fluent); newest at the edge | ≤ 3 visible (DESIGN_BENCHMARKS § 2.6) | Pass |
| Toast keyboard path | A "Notifications" landmark reachable with F6; focus restored when the last toast closes (Spectrum) | Action toasts reachable by keyboard without hunting | Set |
| Offline | One persistent banner until the problem is solved; its region mounted while online (Primer, GOV.UK, Inclusive Components) | As documented | Pass |
| Dialog | Escape closes; Tab stays inside; focus returns to the opener; a transactional dialog does not close on an outside press (APG, Carbon) | As documented; `overscroll-behavior: contain` | Pass |
| Menus | Enter, Space or Down opens on the first item; arrows move; Escape closes (APG); items that open a follow-up end with "…" (Vercel) | Radix defaults; "Rename…", "Move…" | Set (ellipsis) |
| Toggle and segmented control | A radio group: one Tab stop, arrows select (APG); a toggle keeps its label and changes `aria-pressed` (Inclusive Components) | As documented; the theme toggle's name does not change with its state | Pass |
| Disclosure (Show more) | A button with `aria-expanded`; opened only by the user (APG, Carbon) | Add `aria-expanded`; expand at once or with opacity, not by animating height | Set |
| Destructive actions | Confirm with the least destructive action focused, or offer Undo (APG, Vercel) | Inline confirm with Cancel focused | Pass |
| Optimistic update | Update at once, reconcile, roll back with a message (Vercel) | As documented; loading labels end with "…" ("Saving…") | Pass |
| Hover on touch | A tap must not leave hover styles (React Aria; Tailwind 4 limits `hover:` to `(hover: hover)`) | Keep the `(hover: hover)` guard | Change |
| Tooltips | A delay on the first, none for its neighbours, instant on focus; none on touch (React Aria, Vercel) | DESIGN_BENCHMARKS § 2.5 | Pass |
| Theme | `color-scheme` on `<html>` and a matching `theme-color` (Vercel); no colour transition during the switch | Set both per theme; switch at once | Set |
| Page title | `<title>` reflects the page (Vercel, WCAG 2.4.2) | See [§ 3.4](#34-rules-for-cinepulse-patterns) | Set |

## 3. Accessibility

### 3.1 Target and legal frame

**Target: WCAG 2.2 level AA, 55 success criteria (31 A + 24 AA), on every page in every state.** "Every state" means loading, empty, error, offline, a dialog or menu open, signed in and signed out (WCAG 2.2 § 5.2). 4.1.1 Parsing is obsolete in 2.2.

| Frame | Requirement | For CinePulse |
| --- | --- | --- |
| European Accessibility Act, Directive 2019/882 [S] | Since 28 June 2025, for e-commerce, access to audiovisual media and other listed services; micro enterprises (< 10 staff, ≤ € 2 million) are exempt for services | Probably out of scope: we sell nothing and host no media (our reading, not legal advice). Check again if we add ads, paid plans, affiliate links or a video player |
| EN 301 549 v4.1.1 [S] | Published 2 September 2026; web content (clause 9) = WCAG 2.2 AA. Not yet cited in the Official Journal (expected January 2027) | Our benchmark now |
| EN 301 549 clause 7 [S] | Captions and audio description controls for video | Does not apply while videos are YouTube links; applies in full if a player is embedded |
| EN 301 549 clause 11.7 [S] | Follow the user's platform preferences | Honour `prefers-color-scheme`, `prefers-contrast`, `forced-colors`, `prefers-reduced-motion`, `prefers-reduced-transparency` and browser text size |
| EN 301 549 clause 12 [S] | Documentation of accessibility features | Publish an accessibility statement: target, known limits (Google sign-in pages, YouTube) |
| ADA Title III (US) [G] | Courts use WCAG 2.1 AA | Covered by WCAG 2.2 AA |
| ISO/IEC 40500:2025 [S] | WCAG 2.2 as an ISO standard (unverified edition) | Same content |

### 3.2 Criteria with the highest risk for CinePulse

All 55 criteria apply; the media criteria 1.2.x do not, as we host no audio or video. These are the criteria where the documented behaviour most needs a check, with the pass condition we test.

| Criterion | Pass condition for CinePulse | How to test | Verdict |
| --- | --- | --- | --- |
| 1.1.1 Non-text content (A) | A poster inside a card link with the title as text has `alt=""`; a poster that is the link's only content has the title as `alt`; backdrops are decorative; provider logos have the provider's name | axe `image-alt`, `link-name`; screen reader reads each card once | Set |
| 1.3.1 Info and relationships (A) | Each Home row has a heading; rows and grids are lists; landmarks `header`, `nav`, `main`, `footer` | Screen reader headings and landmarks lists | Set |
| 1.4.3 Contrast (AA) | Text ≥ 4.5:1, large text ≥ 3:1, measured on the **lightest pixel** behind text on images, in both themes | axe `color-contrast` in a real browser; manual pick on the hero | Pass (DESIGN_BENCHMARKS § 5) |
| 1.4.10 Reflow (AA) | At 320 CSS px no page-level horizontal scroll; rows scroll inside themselves and each card fits the viewport | Playwright: `scrollWidth <= innerWidth` | Pass |
| 1.4.11 Non-text contrast (AA) | Borders, selected states, toggles, rating stars, focus rings and icons on images ≥ 3:1 | Manual picker, both themes | Pass |
| 1.4.12 Text spacing (AA) | With line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em and word spacing 0.16 em nothing is cut; clamped text stays reachable (Show more or the full text elsewhere) | Text spacing bookmarklet; Playwright injects the CSS | Set |
| 1.4.13 Content on hover or focus (AA) | The card details shown on hover or focus can be dismissed with Escape if they cover anything, can be hovered and stay until the pointer or focus leaves | Keyboard and mouse | Set |
| 2.2.1 Timing adjustable (A) | A toast that closes by itself pauses on hover **and** keyboard focus, and its information stays available after it closes; error toasts do not time out | Stopwatch; screen reader hears the whole message | Change (see § 2, toasts) |
| 2.4.1 Bypass blocks (A) | The skip link is the first Tab stop and moves focus to `main`; each Home row has a heading to jump past it | Keyboard; count Tab stops from top to footer | Pass |
| 2.4.2 Page titled (A) | Every route sets `document.title`, for example "Dune: Part Two (2024) – CinePulse", before focus moves | Read the tab title after each navigation | Set |
| 2.4.3 Focus order (A) | Focus moves as documented: `main` on a new path, the first new item after Load more and Show all, the heading after Remove, back to the opener after a dialog | Playwright `document.activeElement` after each step | Pass |
| 2.4.4 Link purpose (A) | Repeated links say what they open: "More info about Dune", the video's name, "Backdrop 3 of 12, opens in a new tab" | Screen reader links list | Set |
| 2.4.11 Focus not obscured (AA) | No focused element is entirely hidden by the header, sticky filters, toasts, the offline banner or the phone menu, at 320 px, 1280 px and 200 % zoom | Playwright compares the focused rectangle with those layers | Pass (scroll padding documented) |
| 2.5.3 Label in name (A) | The accessible name starts with the visible label; "Add Dune to watchlist" for a button labelled "Add to watchlist" | Voice Control: "click More Info" | Set |
| 2.5.8 Target size (AA) | ≥ 24 × 24 CSS px, or 24 px spacing; standalone footer links need the spacing | axe `target-size`; DevTools at 320 px | Pass |
| 3.1.2 Language of parts (AA) | See [§ 1.6](#16-internationalisation) | Screen reader switches voice | Set |
| 3.3.4 Error prevention (AA) | Removing a title and deleting a folder ask first or can be undone | Manual | Pass |
| 3.3.8 Accessible authentication (AA) | CinePulse adds no cognitive test; the Google popup has a visible popup-blocked state with steps and **Try again**; focus returns to the page after the popup closes | Keyboard only, password manager, popups blocked | Pass |
| 4.1.2 Name, role, value (A) | Every icon button has a name; toggles use `aria-pressed` with a fixed name; the phone menu and sort menu use `aria-expanded` | axe `button-name`, `aria-*`; screen reader | Pass |
| 4.1.3 Status messages (AA) | Every toast, count and banner is announced without moving focus; the region exists **before** the first message | Screen reader on the **first** toast of a session | Set (the toast region loads lazily) |

### 3.3 AAA criteria we adopt

| Criterion | Target |
| --- | --- |
| 1.4.6 Contrast (enhanced) | ≥ 7:1 for body text on plain surfaces; text on images stays at AA |
| 1.4.8 Visual presentation | Text blocks ≤ 75 characters a line, line height ≥ 1.5, never justified |
| 2.2.4 Interruptions | No toast on page load; toasts only on top of data and for failed writes |
| 2.3.3 Animation from interactions | Under `prefers-reduced-motion` no scale, slide, morph or smooth scroll; fades may stay |
| 2.4.12 Focus not obscured (enhanced) | No part of the focused element is hidden |
| 2.4.13 Focus appearance | Ring ≥ 2 px around the element and ≥ 3:1 between focused and unfocused pixels (ours: 3 px) |
| 2.5.5 Target size (enhanced) | ≥ 44 × 44 CSS px under `pointer: coarse` |
| 2.5.6 Concurrent input | A touch laptop gets both hover reveal and touch behaviour |
| 3.2.5 Change on request | "Opens in a new tab" in the name of every external link and the Google sign-in button |

### 3.4 Rules for CinePulse patterns

| Pattern | Rule | Source |
| --- | --- | --- |
| Live regions | The region is in the DOM before its text changes; it is visually hidden, not `display: none` or `hidden`; `role="status"` (polite) by default, `alert` only for a failed action the user started; the same text twice is cleared and set again after ~100 ms | WAI-ARIA 1.2 [S]; Sara Soueidan, TetraLogical [G] |
| `<output>` counters | Add an explicit `role="status"`: support for the implicit role varies (unverified) | HTML-AAM [S] |
| `aria-busy` | Do not rely on it to tell users results are loading; most screen readers ignore it (unverified) | WAI-ARIA 1.2 [S] |
| Focus at the same moment as a message | VoiceOver and JAWS may drop a polite message when focus moves at the same time (unverified); after Load more, the moved focus itself carries the news | [R] |
| Route change | Update `document.title` first, then move focus to `main` labelled by the `h1`, or to the `h1` (`tabindex="-1"`, `outline-none`). User testing favoured a heading or the skip link | Fable Tech Labs × Gatsby, 2019 [R] |
| Tab stops on Home | 2 stops a card × ~20 cards × 6 rows is 200+ stops. Each row has a heading; consider one stop a row with arrow keys (APG roving tabindex) | APG [S] |
| Forced colours | Borders and outlines stay transparent rather than missing, so they appear; icons use `currentColor`; the selected state uses `Highlight`; text on images gets a backplate | CSS Color Adjust [S] |
| Reduced transparency | Text on glass passes contrast without the preference: support is limited (Chromium; Firefox behind a flag) | MDN [G] |
| Toggles | A toggle keeps its name and changes `aria-pressed` | APG [S] |
| Cognitive accessibility | Review a screen against the 8 COGA objectives: what things are, finding things, clear content, avoiding mistakes, focus, no reliance on memory, help, personalisation | W3C COGA note, 2021 [G] |

### 3.5 Target size and text

| Item | Target | Source |
| --- | --- | --- |
| Pointer targets | ≥ 24 × 24 CSS px or 24 px spacing | WCAG 2.5.8 [S] |
| Touch targets | ≥ 44 × 44 CSS px; Apple 44 pt, Material 48 dp | WCAG 2.5.5 [S]; HIG, M3 [G] |
| Zoom | 200 % without loss; pinch zoom never blocked (`maximum-scale` ≥ 2) | WCAG 1.4.4 [S] |
| Font units | `rem`, so type grows with the browser's text size | [G] |

### 3.6 Test matrix

WebAIM Screen Reader Survey #11 (2026, 1,780 answers) [R]: primary desktop screen reader JAWS 55.0 %, NVDA 32.9 %, VoiceOver 6.5 %; on phones VoiceOver 72.2 %, TalkBack 29.5 %; top pairs JAWS + Chrome 31.2 %, NVDA + Chrome 17.3 %, JAWS + Edge 17.0 %.

| Priority | Combination | When |
| --- | --- | --- |
| 1 | NVDA + Chrome (Windows) | Every ticket that changes markup, focus or announcements |
| 2 | VoiceOver + Safari (iOS) | Every UI ticket |
| 3 | VoiceOver + Safari (macOS) | Every release |
| 4 | JAWS + Chrome (Windows) | Every release: live regions, dialog, forms |
| 5 | TalkBack + Chrome (Android) | Every release |
| 6 | NVDA + Firefox; Narrator + Edge | Before a major release |
| Visual | Chrome, Edge, Firefox, Safari at 320 px, 1280 px, 200 % and 400 %; Windows contrast themes; macOS Increase contrast and Reduce transparency; iOS Dynamic Type and Reduce Motion; Voice Control | Every release |

**Automated tests find only part of the problems.** Deque reports about 57 % of issues by count (unverified figure); WebAIM Million 2026 found failures on 95.9 % of home pages, low-contrast text on 83.9 % [R]. Lighthouse 100 does not mean conformance.

| Layer | What it catches | What it misses |
| --- | --- | --- |
| axe in Vitest (jsdom), `expectNoA11yViolations` | Names, ARIA, labels, lists, landmarks | Anything visual: jsdom has no layout, so contrast and target size return nothing |
| axe in Playwright (`@axe-core/playwright`) on the built app, both themes | Contrast on plain backgrounds, target size, scrollable regions | Contrast over images, alt quality |
| Playwright scripts | Focus moves, focus not obscured, page title, reflow width, `emulateMedia` for motion, colours and contrast | Whether a message is actually spoken |
| Manual keyboard and screen reader pass | Live regions, reading order, link purpose, timing, hover content | — |

### 3.7 APCA

APCA is a draft only and was removed from the WCAG 3 draft in 2023; WCAG 3 has not chosen a contrast method. WCAG 2.2 ratios stay the rule. We use APCA only as a second check on the dark theme and on thin or small text: Lc ≥ 75 for body text, ≥ 60 for other text, ≥ 45 for large headings and icons (unverified values). A colour that passes APCA but fails WCAG 2 is never shipped.

### 3.8 Reference sites

A quick scan of the same reference sites as DESIGN_BENCHMARKS, on one page each, in Chrome at 1440 px [M]. It counts what a script can see; it is not an audit. Contrast counts text on solid backgrounds only.

| Site | Skip link | `main` | Unnamed links or buttons | Targets < 24 px | Contrast failures | Focusable inside `aria-hidden` |
| --- | --- | --- | --- | --- | --- | --- |
| Apple TV | No | 1 | 0 | 28 | 9 of 11 | 413 |
| Netflix (title) | No | 1 | 0 | 15 | 4 of 52 | 18 |
| JustWatch | No | 0 | 42 | 1 | 5 of 79 | 0 |
| Letterboxd | No | 1 | 0 | 17 | 14 of 26 | 100 |
| Mubi | No | 0 | 34 | 16 | 47 of 138 | 0 |
| Linear | Yes | 1 | 2 | 5 | 65 of 401 | 0 |
| Vercel | Yes | 1 | 0 | 2 | 1 of 247 | 73 |

Only Linear and Vercel have a skip link; JustWatch and Mubi have no `main`; Letterboxd uses positive `tabindex` (5 elements); Netflix autoplays a video. **Vercel is the closest to our target**, and none of the media catalogs is a model for accessibility.

## 4. Performance

### 4.1 Core Web Vitals and lab metrics

The field targets are in DESIGN_BENCHMARKS § 2.1 (LCP ≤ 2.0 s, INP ≤ 150 ms, CLS ≤ 0.05 at p75). This section adds the parts and the lab gates.

| Metric | Standard | Target for CinePulse | How to check |
| --- | --- | --- | --- |
| LCP [S] | Good ≤ 2.5 s at p75 | Outcome; we control its parts below | web-vitals `onLCP` (attribution build); Lighthouse |
| LCP resource load delay [G] | < 10 % of LCP | The hero image request starts ≤ 10 % of LCP after the HTML | web-vitals attribution `resourceLoadDelay` |
| LCP resource load duration [G] | ~40 % of LCP | The smallest TMDB width that covers the shown width × DPR; hero ≤ 150 KB on phones (w780), ≤ 300 KB on desktop (w1280) | attribution `resourceLoadDuration` |
| LCP element render delay [G] | < 10 % of LCP | The hero is never hidden behind a chunk, a font or a fade-in | attribution `elementRenderDelay` |
| INP parts [S] | Input delay, processing, presentation | Input delay ≤ 50 ms, handlers ≤ 50 ms, next paint ≤ 100 ms | web-vitals INP attribution |
| CLS [S] | Good ≤ 0.1 | Lab ≤ 0.02 | Lighthouse; attribution `largestShiftTarget` |
| TBT (lab) [G] | Lighthouse weight 30 % | ≤ 150 ms on Lighthouse mobile, Home and Movie Detail | Lighthouse CI |
| Speed Index (lab) [G] | Weight 10 % | ≤ 3.0 s | Lighthouse CI |
| Lighthouse score [G] | Weights FCP 10, SI 10, LCP 25, TBT 30, CLS 25 (Lighthouse 10–13) | Performance ≥ 90 on Home, Movies and Movie Detail (median of 3 runs); Accessibility and Best practices 100 | Lighthouse CI, `numberOfRuns: 3` |
| TTFB [G] | — | Not a target (server). We only keep the HTML small, static and free of redirects | Track only |
| TTI, FID | Retired | Not used | — |

**Lab profile.** Lighthouse mobile is the CI gate. For budget decisions we use the p75 device of Russell 2026: a Galaxy A24 4G class phone at 9 / 3 Mbps and 100 ms RTT [R].

### 4.2 Budgets

| Budget | Benchmark | Target for CinePulse | How to check |
| --- | --- | --- | --- |
| JS on the critical path of a hard load | Russell 2026, JS-heavy site, 3 s: 0.62 MiB JS, 1.2 MiB total [R]; Web Almanac 2025 mobile median JS 646 KB [R] | ≤ 300 KiB brotli (host + one remote + shared), tolerance 350 KiB | `pnpm size` for the host; add per-remote budgets |
| Total on the critical path | Same | ≤ 1.0 MiB transfer (HTML, JS, CSS, fonts, hero image), tolerance 1.2 MiB | Lighthouse network table; WebPageTest |
| After sign-in | Russell 2026, 5 s: 1.15 MiB JS [R] | ≤ 600 KiB JS brotli on any route, Firebase chunks included | Same |
| CSS | Web Almanac median 79 KB [R] | ≤ 30 KiB | Same |
| Fonts | Web Almanac median 23 KB [R] | ≤ 2 files and ≤ 60 KiB on the critical path | Same |
| Images in the first viewport | Web Almanac median 911 KB [R] | ≤ 600 KB on phones, ≤ 1 MB on desktop | HAR in Playwright |
| Requests before the first interaction | Web Almanac median 72 [R] | ≤ 40 | Same |
| `remoteEntry.js` | No published number | ≤ 10 KiB brotli per remote | Bundle size |
| Budget change | web.dev: enforce budgets in CI [G] | A breach fails CI; raising a budget needs a ticket | `pnpm size`, Lighthouse CI assertions |

### 4.3 Rendering and runtime

| Item | Standard | Target for CinePulse | How to check |
| --- | --- | --- | --- |
| Long tasks [S] | ≥ 50 ms | None during an interaction; on a hard load ≤ 3, none > 150 ms (4 × CPU throttle) | Performance panel |
| Long animation frames [S] | > 50 ms (Chrome 123+) | 0 frames with `blockingDuration` > 100 ms that contain a user event | PerformanceObserver `long-animation-frame` |
| Frames [G] | 16.7 ms at 60 Hz | Rows and View Transitions ≥ 58 fps on a mid desktop; animate only `transform` and `opacity` | Performance panel, frame stats |
| DOM size [G] | Lighthouse warns at ~800, errors at ~1,400 elements | ≤ 1,400 elements at first render; ≤ 3,000 after Load more, beyond that `content-visibility: auto` | `document.querySelectorAll('*').length` in e2e |
| Forced layout [G] | Reading layout after a write forces it | 0 forced reflows in scroll and resize handlers and row arrows | Performance panel warnings |
| `content-visibility: auto` [G] | web.dev: rendering 232 → 30 ms on a long page | Rows and sections below the fold, with `contain-intrinsic-size`; 0 extra shift | Rendering timings |
| Memory [G] | No standard | After 20 Home ↔ Detail navigations the heap grows ≤ 10 MB; 0 detached DOM trees | Heap snapshots |
| JS execution [G] | — | ≤ 500 ms main-thread script time on a hard load (4 × throttle) | Lighthouse |

### 4.4 Images

TMDB serves JPEG at fixed widths; we cannot change the format without our own image proxy, which we do not add. We choose the width.

| Item | Standard | Target for CinePulse |
| --- | --- | --- |
| `srcset` and `sizes` [G] | The browser picks by layout width × DPR | Every poster, backdrop and profile has `srcset` from the TMDB widths and `sizes` that match the grid; never `original` in lists |
| Oversizing [G] | Lighthouse flags savings ≥ 4 KiB | At most one TMDB step above the shown width × min(DPR, 2) |
| `fetchpriority` [S] | `high` raises the LCP image | `high` on the hero only, one image a view |
| `loading="lazy"` [G] | Chrome starts lazy images 1,250 px before the viewport (2,500 px on slow networks) | Eager for the hero and the first visible row; lazy for everything else |
| Reserved space [S] | Width and height or `aspect-ratio` | Every image; 0 shift from images |
| `decoding` [G] | `async` moves decoding off the critical path | `async` on lazy images; default on the hero |
| Preconnect [G] | Saves DNS, TCP and TLS; use for 1–2 origins | `image.tmdb.org` in the host HTML; no preconnect to Firebase before sign-in |
| Discovery [G] | The LCP image should be found early | The hero image URL comes from TMDB data: start that query as early as possible and add a `preload` with `imagesrcset` as soon as the URL is known |

### 4.5 JavaScript, caching and fonts

| Item | Standard | Target for CinePulse |
| --- | --- | --- |
| Code splitting [G] | Split by route and by interaction | A hard load downloads the host and only the remote of the route; the dialog, toasts and Firebase load on demand |
| `modulepreload` [S] | Fetch a module graph early | The host preloads its own entry; a remote's entry and route chunk load on intent (hover or focus of a link) |
| Serial steps [G] | Each Module Federation step adds a round trip | ≤ 3 serial JS steps on a direct URL (host entry → `remoteEntry.js` → route chunk, with shared modules in parallel) |
| Shared singletons [G] | `singleton` + `strictVersion` | 0 duplicate copies of React or Query in a session |
| Compression [G] | Brotli is smaller than gzip | All text assets served as `br`; budgets in brotli bytes |
| Hashed assets [G] | `max-age=31536000, immutable` | All Vite `assets/*` of the host and remotes (`firebase.json` headers) |
| HTML and `remoteEntry.js` [G] | Revalidate on each load | `Cache-Control: no-cache` with ETag, so host and remotes stay in step after a deploy; never `no-store` (it blocks the back/forward cache) |
| Third parties [G] | A top cause of long tasks | 0 third-party scripts on catalog pages |
| Fonts [G] | `font-display: swap`, metric-matched fallback, self-hosted WOFF2 | 0 shift from the font swap |

### 4.6 Navigation

| Item | Standard | Target for CinePulse |
| --- | --- | --- |
| Speculation Rules [G] | Work for document navigations only | Little use in an SPA. Instead prefetch the detail query and the route chunk after ≥ 100 ms of hover, on focus or on pointer down; ≤ 2 detail prefetches a second; ≤ 10 % unused prefetches |
| Back/forward cache [G] | Blocked by `unload`, `no-store`, open connections | 100 % of back and forward navigations into CinePulse restored; on `pageshow` with `persisted`, refresh auth and the watchlist |
| View Transitions [G] | Each named element adds capture cost | ≤ 2 named elements a transition; the DOM update callback ≤ 50 ms; skip it when the data is not cached, so no frozen frame waits for the network |
| Soft navigations [S, new] | On by default in Chrome 151; CrUX reports them as experimental since October 2026 | Report per-route LCP and INP for SPA navigations where supported; soft LCP ≤ 1.0 s when data is cached |

### 4.7 Reference sites

One page each, Chrome desktop at 1440 px, not throttled, with a warm cache [M]. Sizes are decoded sizes of first-party and `Timing-Allow-Origin` resources. An automated tab can paint late, so the paint times are indicative only. Values marked † are skewed by the tab.

| Site | FCP | LCP (element) | CLS | Long frames > 50 ms (longest) | JS decoded | Elements | Lazy images |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apple TV | 7.2 s † | 7.2 s † (hero image) | 0 | 2 (114 ms) | 4.6 MB | 4,037 | 138 of 140 |
| Netflix (title) | 1.3 s | 1.4 s (hero image) | 0 | 10 (468 ms) | 11.4 MB | 1,525 | 0 of 28 |
| JustWatch | 0.7 s | 0.7 s | 0 | 5 (121 ms) | 2.1 MB | 3,328 | 385 of 402 |
| Letterboxd | 0.5 s | 0.5 s (text block) | 0.077 | 4 (129 ms) | 1.9 MB | 1,729 | 72 of 73 |
| Mubi | 1.1 s | 2.9 s (text) | 0.002 | 27 (2.6 s) | — | 2,306 | 20 of 26 |
| Linear | 0.8 s | 7.3 s (hero image, late) | 0 | 9 (774 ms) | — | 4,926 | 32 of 39 |
| Vercel | 0.4 s | 0.4 s (image) | 0 | 1 (151 ms) | 2.5 MB | 1,207 | 12 of 23 |

What this tells us:

- **CLS 0 is normal.** Five of seven sites have none; only Letterboxd (ads) comes close to the 0.1 limit.
- **The hero image is the LCP element** on four sites. A late hero costs seconds (Linear 7.3 s). Only Apple TV and JustWatch use `fetchpriority="high"`.
- **Every site is over our JS budget** (1.9–11.4 MB decoded). None is a model for weight; our budget comes from Russell 2026, not from them.
- **Long frames.** Vercel and Apple TV stay near our target; Netflix, Linear and Mubi block for 0.5–6 s.
- **DOM size.** Only Vercel stays under 1,400 elements; Netflix nests 37 levels deep.

## 5. Field measurement

| Item | Target |
| --- | --- |
| Library | web-vitals attribution build, loaded after `load`, ≤ 6 KiB brotli, no long task of its own |
| What we send | LCP, INP and CLS with their parts; the worst long animation frame with its script; `notRestoredReasons`; hero image size; `remoteEntry.js` timing |
| When | One beacon a page view, on `visibilitychange` to hidden, with `navigator.sendBeacon` |
| Report | p75 per route template (home, list, detail, person, search, account), phone and desktop apart; act only with ≥ ~100 samples a template |
| Privacy | No user ID, no stored IP, the path template only (`/movie/:id`), no query string; no third-party tracker |
| CrUX | Not relied on until PageSpeed Insights shows data for our origin |

Where the beacons go is not decided: it needs a receiver on the server side and an ADR ([Open questions](#open-questions)).

## Proposed changes

Each item needs a decision and its own ticket; until then the documentation decides.

1. **Toasts stay at least 5 s** and pause on hover and keyboard focus. The docs set no duration, and sonner's default of 4 s is below every design system we checked. DESIGN_BENCHMARKS § 2.6 now uses the 5 s floor.
2. **A failed watchlist write does not time out.** It shows next to the row or form, or in a toast that stays until dismissed (Atlassian, Carbon, WCAG 2.2.4).
3. **Row arrows become labelled buttons** reachable by keyboard and screen readers ("Next, 3 to 5 of 10"), or the docs state why they stay hidden (BBC GEL, APG).
4. **Load more keeps its label** with a spinner and moves focus to the first new card, as filmography does (Vercel, Primer).
5. **Search does not open the keyboard on phones** on page open; it still focuses the input on desktop (Vercel).
6. **A tap does not trigger hover styles:** keep Tailwind's `(hover: hover)` guard (React Aria).
7. **The dialog press guard grows from 350 ms to 500 ms**, so a Windows double click cannot pass it.
8. **The search draft survives a Tab press** (ISO 9241-110 use error tolerance).
9. **Desktop lists show ≥ 40 items** before the first Load more; phones keep 20 (Baymard).
10. **Movies and TV keep all loaded pages on Back**, as filmography does (Baymard).
11. **No-results pages offer one more path** besides Clear search: genres or trending (Baymard).
12. **Document what is not documented:** a `document.title` per route; `lang` and `dir` on TMDB text; `aria-expanded` on Show more; `color-scheme` and `theme-color`; an in-field clear for search; a toast region mounted before the first toast; account deletion; an accessibility statement.

## Open questions

1. Where do the field-measurement beacons go, and who reads the p75 report? Needs an ADR.
2. Can the hero data request start before the pages remote loads? It is the main lever on LCP load delay.
3. Is 300 KiB brotli of JS on the critical path realistic with React 19, Router, Query and the Module Federation runtime? Measure the current Home path first.
4. Which `Cache-Control` do `index.html` and `remoteEntry.js` get today?
5. Do Firebase Auth or Firestore Lite hold a connection that blocks the back/forward cache for signed-in users?
6. Should Home rows offer one Tab stop a row with arrow keys?
7. After a route change, should focus go to the `h1` instead of `main`? Test with NVDA, JAWS, VoiceOver and TalkBack.
8. Is a redirect fallback needed when the sign-in popup is blocked?
9. Is CinePulse an "online platform" under the DSA, and does a future plan (ads, paid features, a player) bring it under the EAA?
10. Should Remove offer Undo instead of a confirm?
11. Single or multiple genres in the filter?
12. Buy ISO 9241-110 for the numbered recommendations and the Annex A checklist, or keep the category level?

## How to measure

Run on a production build (`pnpm build:deploy`, then `pnpm emulators` or a preview channel), as in DESIGN_BENCHMARKS.

1. **Lighthouse.** Mobile mode, 3 runs, median. Check Performance ≥ 90, Accessibility 100, TBT, LCP and CLS.
2. **LCP and INP parts.** Load the web-vitals attribution build in the console or a test page and log `onLCP` and `onINP` with attribution.
3. **Bytes and requests.** DevTools Network with "Disable cache", throttled to the lab profile; compare transfer sizes with [§ 4.2](#42-budgets). `pnpm size` covers the host.
4. **Long animation frames and DOM size.** The snapshot script below; read `window.__p` after about 2 s.
5. **Accessibility.** axe (DevTools extension or `@axe-core/playwright`) on every page state, both themes; then the keyboard and screen reader passes in [§ 3.6](#36-test-matrix).
6. **Zoom, spacing, preferences.** 320 px and 400 % zoom; the text spacing bookmarklet; DevTools Rendering for `prefers-reduced-motion`, `forced-colors`, `prefers-contrast` and `prefers-reduced-transparency`.

The snapshot script we ran on the reference sites. It gives quick numbers, not an audit; the contrast count skips text on images.

```js
window.__p = 'pending';
{
  const res = {};
  const lcp = [], cls = [], loaf = [];
  const obs = (type, out) => {
    try {
      new PerformanceObserver((l) => out.push(...l.getEntries())).observe({ type, buffered: true });
    } catch {
      res[type] = 'n/a';
    }
  };
  obs('largest-contentful-paint', lcp);
  obs('layout-shift', cls);
  obs('long-animation-frame', loaf);
  setTimeout(() => {
    const paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));
    const last = lcp.at(-1);
    res.fcp = paint['first-contentful-paint'];
    res.lcp = last && Math.round(last.startTime);
    res.lcpElement = last?.element?.tagName;
    res.cls = +cls.filter((e) => !e.hadRecentInput).reduce((s, e) => s + e.value, 0).toFixed(3);
    res.longFrames = loaf.filter((f) => f.duration > 50).length;
    res.longestFrame = Math.round(Math.max(0, ...loaf.map((f) => f.duration)));
    res.blocking = Math.round(loaf.reduce((s, f) => s + (f.blockingDuration || 0), 0));
    const js = performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'script');
    res.jsKB = Math.round(js.reduce((s, e) => s + e.decodedBodySize, 0) / 1024);
    res.elements = document.querySelectorAll('*').length;
    const imgs = [...document.images];
    res.images = `${imgs.filter((i) => i.loading === 'lazy').length} lazy of ${imgs.length}`;
    const visible = (e) => e.getBoundingClientRect().width > 0;
    const focusable = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
      .filter((e) => e.tabIndex >= 0 && visible(e));
    res.skipLink = (focusable[0]?.getAttribute('href') || '').startsWith('#');
    res.main = document.querySelectorAll('main,[role=main]').length;
    res.under24 = focusable.filter((e) => {
      const b = e.getBoundingClientRect();
      return (b.width < 24 || b.height < 24) && getComputedStyle(e).display !== 'inline';
    }).length;
    window.__p = JSON.stringify(res);
  }, 1500);
}
```
