🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# PRD — Product Requirements Document

> Document status: **✅ complete.** The product part (nature, problem, goals, personas, metrics, scope) was settled in a grilling session with the product owner on **2026-07-12**. The technical functionality was earlier derived "as is" from the code.

## Product overview

**CinePulse** is a web catalog of movies and TV shows built on [TMDB](https://www.themoviedb.org/) data, complemented by a **personal viewing tracker (watchlist)**. It is implemented as a micro-frontend (MFE) application: a shared shell (`host`) dynamically loads the remote modules of the public catalog (`pages-mfe`) and the personal account (`user-mfe`).

The product has two complementary parts, and the MFE split deliberately mirrors that split:

- **Public catalog (`pages-mfe`)** — *discovery*: browse collections, search, filter, explore details of movies/TV shows/people. Works **anonymously**.
- **Personal account (`user-mfe`)** — *tracking*: a registered user keeps a watchlist, organizing movies and TV shows into their own folder structure and marking the viewing status.

## Project nature and context

CinePulse is a **portfolio project** whose main goal is a **learning milestone**: to gain hands-on mastery of micro-frontend architecture (Module Federation), Firebase (Auth + Firestore), testing culture and CI discipline on a complete, end-to-end product.

The project deliberately demonstrates four competencies:

1. **Architecture / MFE** — Module Federation, monorepo (Turborepo + pnpm), typed event bus, clear host/remote boundaries.
2. **Frontend / UX craft** — design system, unified UI states, responsiveness, accessibility.
3. **Product thinking** — this PRD: problem, personas, scope, metrics.
4. **Engineering maturity** — testing, quality gates in CI, observability, ADRs.

> "A real product for the market" is **not** a goal. The product story below (problem, personas, value) is deliberately realistic so that product and technical decisions stay coherent, not to compete with TMDB/Letterboxd for users.

## Problem / value proposition

**The user problem as framed.** An active viewer keeps "what to watch" in their head, in notes and in scattered lists. TMDB/IMDb are great as *reference sources* but weak as a *personal organization tool*: there is no convenient way to group titles by one's own logic (by mood, occasion, viewing company) and to track what has already been watched.

**Value proposition.** CinePulse is a personal **movie and TV show tracker**: the user builds their own, arbitrarily nested folder structure and adds titles from the catalog in one move, marking them *watched/planned*.

**Honest positioning against TMDB/IMDb/Letterboxd.** CinePulse does **not** compete on data completeness (the source is the same TMDB) or on social features (feeds, friends, community reviews). The differentiator is **flexible personal organization** (deep folders at the user's discretion) on top of a fast, modern discovery UX.

## Personas

### Primary — "Movie enthusiast-organizer"

- **Who:** watches a lot of movies and TV shows, plans viewing ahead.
- **Jobs-to-be-done:** quickly save an interesting title; structure saved titles by their own logic (themed folders/subfolders, by mood, occasion); see what has been watched and what is planned.
- **Values:** flexible nested folders, quick adding from any page, order in their own library.
- **Devices:** desktop + mobile (mobile-first).

### Secondary — "Casual viewer"

- **Who:** occasionally looks for "something to watch tonight".
- **Jobs-to-be-done:** quickly discover something relevant (collections, similar titles, search); sometimes save a title "for later".
- **Values:** fast discovery, minimal friction; rarely maintains a complex folder structure.
- **Role in the product:** keeps the discovery part (Home/Movies/details) in focus so the product is not just for power users.

### Meta-audience (portfolio context)

The project author as a **learner** is the real "customer" of the value: the end-to-end implementation of the product is the learning outcome. Code reviewers (if any) are a secondary audience.

## Goals and success metrics

**Business goal:** a learning milestone — master the target technologies on a complete end-to-end product. The metrics are therefore shifted towards *technologies mastered* and *functional completeness* rather than product KPIs (DAU, conversion and the like do not apply).

**Success metrics:**

| Category | Goal |
|-----------|------|
| **Technologies mastered** | MFE (Module Federation, cross-MFE state), Firebase (Auth + Firestore), testing (Vitest + Testing Library + e2e), quality gates in CI, hierarchical data model (folder tree). |
| **Functional completeness** | The [Definition of Done](#project-scope-definition-of-done) is met: all documented pages + profile + a working watchlist. |
| **Code quality** | Test coverage ≥ 70% on `@repo/api` and key components; 0 lint/typecheck errors; green CI with quality gates. |
| **UX / performance** | The [non-functional goals](#non-functional-requirements-nfr) are met; every page has loading/empty/error states. |
| **Architectural clarity** | ADRs are documented; clean MFE boundaries. |

## Non-functional requirements (NFR)

- **Performance:** Lighthouse Performance ≥ **90**; LCP < **2.5s** (with particular attention to the overhead of loading MFE remote modules).
- **Accessibility:** **WCAG 2.1 level AA**.
- **Browsers:** evergreen — the last 2 versions of Chrome, Edge, Firefox, Safari. No IE/legacy support.
- **Responsiveness:** mobile-first, working from mobile to desktop widths.

## Project scope (Definition of Done)

> **We do not use MVP phasing.** Instead, there is a definition of done for the whole project.

**The project is considered done when all documented pages and functionality are implemented (IMDb-like coverage of TMDB data, but not the whole TMDB API) + the user profile + a working watchlist.**

**In scope (from the [page catalog (Notion)](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)):**

- **Public catalog:** Home ✅, Movies ✅, Movie Detail, TV (list), TV Detail, Search, Person, 404.
- **Personal account:** Auth (Google sign-in), Watchlist (folders), Profile, Settings.
- **Detail pages ("IMDb-like" scope):** basics (overview, genres, TMDB rating, date, runtime) + cast and crew + media (trailers/videos, gallery) + similar/recommendations + TMDB ratings/reviews + "where to watch" providers.

**Out of scope (deliberately):**

- Not the whole TMDB API (only the IMDb-like coverage listed above).
- Email and password sign-in — Google sign-in only ([ADR-0010](../03-architecture/decisions/ADR-0010-firebase-auth-firestore-watchlist.md)).
- Social features (friends, activity feeds, public community reviews).
- Syncing "watching/in progress" as a separate state (TV shows use the same status: watched/planned).

## Key feature: Watchlist (folders + statuses)

The core of the personal account. Available **only to a registered** user; data is stored in **Firestore**.

- **Folders:** the user creates their own structure of folders and subfolders. Nesting goes **up to 6 levels**; the number of folders/subfolders on each level is unlimited.
- **Contents:** folders hold **both movies and TV shows**. One title can sit **in several folders** at once (folders behave like tags).
- **Title status:** a separate field — **watched / planned** — independent of folder placement.
- **Adding:** a title is added to the watchlist / a folder from catalog cards and from detail pages.

The data model for this feature (Firestore structure for the folder tree) — see [DATA_MODEL](../03-architecture/DATA_MODEL.md); architectural implications (Firebase Auth + Firestore) — see [ARCHITECTURE](../03-architecture/ARCHITECTURE.md).

## Functionality in practice (from the code)

Implemented and working:
- **Home** (`/`) — the main page with Hero, categories, the Trending / New Releases / Top Rated / Popular rows and the "Editor's Picks" block. Real TMDB data. ✅
- **Movies** (`/movies`) — a catalog with search, genre filter, sorting (Popular / Newest / Rating), a grid/compact toggle and incremental loading ("Load More"). ✅

Stubs (a route exists, but no functionality) — per the scope, they are to become part of the personal account with the watchlist:
- **Profile** (`/user/profile`) — a heading only. 🟡
- **Settings** (`/user/settings`) — a heading only. 🟡

The full list of pages and their state is in the [roadmap page catalog (Notion)](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb).

## Assumptions and open questions

Recorded assumptions (confirmed in the 2026-07-12 session):
- Sign-in is Google only (ADR-0010).
- TV shows use the same *watched/planned* status (no separate "watching/in progress").
- The public catalog works anonymously; authentication is required only for the watchlist.

Open questions to work out in later stages:
- Firestore collection structure and security rules for the folder tree → [Stage 3 (Notion)](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb).
- UX for managing the folder tree: create/rename/move, drag-n-drop, breadcrumbs → [Stage 2 (Notion)](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb).
- Deduplication and TMDB limits (rate limits) when adding titles in bulk.
