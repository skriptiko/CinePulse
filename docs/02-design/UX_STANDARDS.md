🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# UX standards: flows, structure and content

The standards and targets for CinePulse at the level of whole tasks: how a person moves between screens, finds their way, starts, keeps a watchlist, leaves, decides what to watch, trusts the site and reads its text. Use this page to plan a feature, review a pull request and test a release.

It completes two pages and does not repeat them. [QUALITY_BENCHMARKS](./QUALITY_BENCHMARKS.md) holds interaction principles, component patterns, accessibility and performance. [DESIGN_BENCHMARKS](./DESIGN_BENCHMARKS.md) holds motion, behaviour timing and look. The agreed behaviour of each screen is in [UX_NOTES](./UX_NOTES.md) and [DESIGN_APPROACH](./DESIGN_APPROACH.md). Where this page and those documents differ, those documents still decide. Each difference is listed in [Proposed changes](#proposed-changes) and is decided in its own ticket.

Compiled on 2026-11-20 (CIN-178).

## How to read this page

**The main risk is between screens, not inside components.** A guest who presses Add to watchlist must not lose that intent at sign-in. A folder must be movable without dragging. Leaving must be as easy as joining. Most targets below follow from these three points.

**Only the frontend is in scope.** No target here is a TMDB or Firebase response time. **We did not audit the code:** these are standards and targets, not findings about the current build.

Sources are tagged as in the other benchmark pages: **[S]** a normative standard or binding terms (ISO, W3C, law, TMDB terms, store rules), **[G]** a guideline or design system, **[R]** research or survey data, **[M]** our observation of a reference product (help pages and store listings, not a manual browser pass). **(unverified)** marks a value we could not check on the primary source.

In the tables, **Source says** holds only values from sources. **Target for CinePulse** holds our proposals. No public benchmark exists for watchlist or folder tasks, so most numeric targets are hypotheses: check them with a cognitive walkthrough and the first round of tests ([§ 8](#8-measuring-ux)).

## 1. Task flows

### 1.1 Format

CinePulse is one product on one channel (the web, desktop and phone). The main artefact is a **user flow for one task**, not a journey map: the steps of one task in one product, user actions and system responses, without emotional context (NN/g [R/G]). ISO 9241-210:2019 sets the frame: describe the context of use (users, tasks, environment, clause 7.2) and evaluate designs against it (clause 7.5) [S]. ISO confirmed it in 2025.

Each flow has a short header list (persona, entry point, preconditions, success state, step budget, date and result of the last walkthrough), one table of steps (user action → system response → URL → walkthrough result), then decision points and failure and recovery paths. The flows and the first walkthrough are in [USER_FLOWS](./USER_FLOWS.md).

**A step** is one press, one typed query or one page change. Scrolling does not count but is noted.

Each flow gets a cognitive walkthrough with the four NN/g questions per step (2022) [R/G]: Will the user try to reach this result? Will they notice the right action? Will they link the action to the result? Will they see progress after it?

A short journey map per persona is useful only for the context outside the site: the trigger ("a friend mentioned a film") and return visits. GOV.UK maps the current state first to find dead ends [G].

### 1.2 Key flows

| Flow | Source says | Target for CinePulse |
| --- | --- | --- |
| F1 Guest saves a title | Ask to sign in at the moment of commitment; do not ask again (NN/g 2014, Baymard 2023) [R] | ≤ 3 presses on CinePulse's own UI (Add → prompt → Google); the provider's screens do not count. After sign-in: the same URL and scroll position, the title already saved, no second press. A status message names the title and folder |
| F2 What to watch tonight | No benchmark | ≤ 3 steps from Home to a detail page with Where to watch visible |
| F3 Search → detail → save | No benchmark | Query + 1 press on a result + 1 to save. Back returns the same results and tab |
| F4 Move between folders | No benchmark | ≤ 3 presses (menu → Move to… → folder), no reload, with Undo |
| F5 Mark watched | No benchmark | 1–2 presses; the status shows on the card, the detail page and the list |
| F6 Cross-links | [M] TMDB and Letterboxd give every entity a stable URL | 1 press for each move between title, person and similar titles; each is a real URL |
| F7 Back to the watchlist | No benchmark | 1 press from the global navigation |

### 1.3 Guest save (F1)

The evidence is clear. Login walls annoy users more than almost anything; people stopped by one often do not return. Let people browse and ask for an account when they commit (NN/g, 2014) [R]. Forced account creation is a main cause of abandoned checkouts, about 19 % of users (Baymard) [R]; secondary sources give 24–26 % (unverified). Delayed account creation did better than asking at the start or in the middle, and repeated prompts felt mandatory (Baymard, 2023) [R]. These are checkout data, so they apply here by analogy. TMDB asks a guest "Want to rate or add to a list?" with Log in and Join, but does not finish the action after sign-in [M]. CinePulse can do better here.

`signInWithRedirect()` breaks in browsers that block third-party storage (Chrome M115+ from June 2024, Firefox 109+, Safari 16.1+) unless the app adds a workaround; `signInWithPopup()` is the simpler path, but a popup can be blocked (Firebase) [G]. A popup keeps the SPA alive, so the intent can stay in memory.

Targets:

- Before the popup opens, keep the pending action in memory: title id, media type, the chosen folder or status.
- After `user:login`, run it once.
- Popup closed: nothing is saved, focus returns to Add.
- Sign-in failed: say what happened and offer Try again.
- If a redirect fallback is ever added, put the action and the return URL in `sessionStorage` before leaving.

## 2. Structure and navigation

Hiding navigation costs findability. In an NN/g study (2016, 179 participants, 6 sites) hidden navigation on desktop was used in **27 %** of cases against **48 %** for visible navigation. Content was **more than 20 %** harder to find on both device types, and tasks took at least 39 % longer on desktop and 15 % longer on phones [R]. People now recognise the hamburger icon, but that is about recognition, not task success; the 2016 study has no newer repeat. NN/g advises up to 4 visible top-level links on phones; Android and Material 3 allow 3–5 in a navigation bar, and a rail on large screens [G].

Breadcrumbs show **hierarchy, not history**. They add to the global navigation, the current page comes last without a link, and flat sites of 1–2 levels do not need them (NN/g, reviewed 2026) [R/G]. Back must return to the state before the last navigation; an SPA uses `pushState` for new entries and `replaceState` for changes in place (MDN) [G]. Across 98 tree tests the median task success was **62 %**, interquartile range 37–83 % (NN/g, from a search snippet) [R]; a secondary scale reads ≥ 80 % as strong and < 50 % as a serious problem. There is no single validated standard.

| Topic | Source says | Target for CinePulse |
| --- | --- | --- |
| Primary navigation | ≤ 4 visible links on phones [R]; 3–5 in a bar [G] | ≤ 5 destinations (Home, Movies, TV Shows, Search, Watchlist or Account), visible on desktop and phones. No hamburger while there are ≤ 5 |
| Watchlist reach | — | 1 press from any page |
| Breadcrumbs | Hierarchy, not history; not for flat sites [R/G] | Only in the watchlist: `Watchlist › Folder › Subfolder`, the current item without a link, the parent folder only on phones. None in the catalog |
| URL as state | `pushState` / `replaceState` [G] | Genre, sort, query, tab, folder and status filter live in the URL. Filters use `replaceState`, pages `pushState`. A reload or a shared link shows the same view |
| Dead ends | GOV.UK finds them with journey maps [G] | Every 404, empty search, empty folder and `RemoteUnavailable` gives ≥ 1 path forward |
| Cross-links | [M] TMDB, Letterboxd: cast → person → titles → similar | No entity page is a dead end: ≥ 2 links to other entities |
| Tree test | Median 62 % [R] | 10 tasks, 5–8 per participant; ≥ 80 % on each top task, none below 65 % |

## 3. First run and empty states

Tours hurt in a familiar domain. NN/g found that deck-of-cards tutorials **"didn't improve task performance"**, made the interface look harder and loaded memory. Onboarding is justified only when the start needs information, a feature depends on preferences, a feature is unfamiliar or new (2020) [R]. None of these fits CinePulse. NN/g also calls walkthroughs "dramatically overused" and recommends pull help in context (2023 essay) [R]. Carbon allows starter content in an empty state only as an option [G].

Empty states share one taxonomy. NN/g asks for a true system status (never "no items" while loading), a short cue and a direct action (2021) [R]. Carbon has three types: first use, user action (no results) and error [G]. Atlassian separates a blank slate (never used) from an emptied state: a short sentence-case heading, a body of 1–2 sentences that does not repeat it, a 1–2 word imperative button; messages seen often are shorter and less playful [G].

| Type | Where | Status text (example) | Action |
| --- | --- | --- | --- |
| First use | Watchlist with 0 titles and 0 folders | `Your watchlist is empty` + `Save movies and TV shows to watch later.` | Browse movies; link Browse TV shows; tertiary Create a folder |
| Empty folder | A folder with no titles | `No titles in {folder}`; with subfolders only: `Titles are in its subfolders` | Browse movies |
| All done | Planned filter after watching everything | `You've watched everything in this folder`, no confetti | Show all |
| No results | Search or filter in the watchlist | `No titles match '{query}'` + the active filters | Clear search / Reset filters |
| Error | Read failed | `Your watchlist did not load` | Try again |
| Signed out | The watchlist route | `Sign in to see your watchlist` | Sign in with Google |

Targets:

- No tour, carousel or series of coach marks.
- **0 blocking steps** between a successful Google popup and the page the person came from.
- First value is the first saved title. Sources give no number for time to first value in media apps.
- At most one dismissible hint per surface, not a modal, never shown again. Example, the first time the folder picker opens: `Folders are optional. Titles without a folder stay in All.`
- Each empty state has 1 primary action and a body of ≤ 2 sentences. A skeleton shows while loading, never empty text. The empty message lives in the same live region as the count.
- No starter folders created automatically; at most one `Create suggested folders` action in the first-use state.
- No questions about genres or services at sign-in.

## 4. Folders and statuses

One rule is normative. **WCAG 2.2 SC 2.5.7 (AA):** every dragging action can be done with a single pointer without dragging. A keyboard path does not meet it, because a touch user may not have a keyboard; a swipe does not meet it either. The W3C example is a menu that moves the selected item [S]. A side tree, if added, follows the APG Tree View: `role="tree"` with a visible label, `treeitem` and `group`, `aria-expanded` only on parents; Right and Left open and close, Up and Down move, Home, End and type-ahead work. APG warns that selection following focus can seriously harm accessibility [S/G]. NN/g prefers a move menu over dragging on phones: fewer errors (2020) [R]. On confirmations NN/g says: prefer undo, confirm only serious and especially irreversible actions, name the object and the count, label buttons by outcome (2018, reviewed 2026) [R].

Reference products keep "want to watch" apart from "watched". Trakt removes a title from the watchlist once watched and counts a rewatch as a new play [M]. Letterboxd has an "I've watched this before" checkbox [M]. IMDb marks a title as watched after a rating or review, and a second press on Watched unmarks it [M]. StoryGraph turns imported Goodreads shelves into tags, not statuses [M]. The lesson: **one record per title, one status, the folder independent of the status**. Sources give no folder depth limit and no rule on whether counts include subfolders.

| Topic | Source says | Target for CinePulse |
| --- | --- | --- |
| Model | [M] Trakt, IMDb, StoryGraph: watchlist ≠ history; shelves → tags | One record per title (deduplicated by `media_type` + `id`), one status. The folder is a place, the status a state |
| Already saved | [M] IMDb: "+" becomes a check mark | Every catalog card shows the saved state. The accessible name changes: `Add Dune to watchlist` → `Dune is in your watchlist, edit`. The dialog opens in edit mode and never adds a copy. Until the saved ids are known, a neutral icon shows, so nothing flashes from "not saved" to "saved" |
| Depth | No source | ≤ 4 levels (root + 3). Message `Folders can be 4 levels deep`. Breadcrumbs ≤ 4 segments |
| Counts | No source | A count includes subfolders and updates in the same frame as the write |
| Moving | [S] SC 2.5.7; [R] NN/g: a menu on phones | The main path is `Move to…` in the row menu → the same folder picker as Add to watchlist. The current folder is disabled and marked `Current`; for a folder, it and its descendants are disabled. Dragging only as an extra on fine pointers |
| Order | [S] SC 2.5.7 example | `Move up` / `Move down` in the menu; a polite live region: `Moved to position 3 of 12` |
| Rename | — | Enter saves, Escape restores. An empty name or a duplicate among siblings gets an inline error |
| Delete a folder | [R] NN/g: undo over confirm; name the count | Empty folder: no confirm, a toast with Undo. Folder with contents: one dialog with the name and count; the non-destructive choice `Move titles to {parent}` comes first, `Delete folder and titles` next to it, focus never starts on the destructive button |
| Bulk actions | — | A `Select` mode with a sticky `{n} selected` bar (live region). Move and status need no confirm and offer Undo; bulk Remove is confirmed with the count |
| Sort | — | Date added (newest first), Title A–Z, Release date, TMDB rating. The choice is in the URL and remembered on the device |
| Phones | [S/G] APG; [R] NN/g | A drill-down list with breadcrumbs instead of a tree |
| Statuses | [M] Trakt, Serializd: a separate "watching" for TV | Open question: two segments or three. `Watching` matters mostly for TV. Rewatch and episode progress stay out of the model |

## 5. Sign-out, export and account deletion

Store rules do not bind a web app, but they are the clearest benchmark. Apple 5.1.1(v): an app that creates accounts lets people start deletion inside the app; deletion removes the account and its personal data, deactivation is not enough; the option is easy to find, usually in account settings; re-authentication is allowed, but steps that "make deletion unnecessarily difficult" fail review [S]. Google Play requires an easy deletion path, including a web one [S]. GDPR Art. 20 asks for the user's data "in a structured, commonly used and machine-readable format" [S]. Art. 17 and the response time in Art. 12(3) were not checked (unverified). Firebase `delete()` on an old session fails with `auth/requires-recent-login` and needs a new sign-in (unverified) [G].

| Action | Target for CinePulse |
| --- | --- |
| Sign out | 1 press, no confirm (the action is reversible). The person stays on the current public page or goes to Home. User data is cleared; theme, sort and region stay. Settings says so in one line: `Your theme stays on this device` |
| Export | `Download my watchlist`: JSON (the full tree: folders, titles with TMDB id and media type, status, `addedAt`) and CSV (one row per title, a folder path column). The file is built in the browser from data already read, in ≤ 1 s for ≤ 1,000 titles, network time excluded. A Letterboxd-compatible CSV is a nice extra. Built in CIN-185 as `Download JSON` and `Download CSV` under Settings → Your data and in the delete dialog; a CSV cell that starts like a formula gets a leading `'` |
| Delete account | ≤ 2 navigation steps (Settings → Account → Delete account). One dialog says what is deleted (watchlist, folders, statuses, the Google sign-in link) and what stays, and offers Export first. If needed, the Google re-sign-in popup opens right in the press handler. Focus does not start on `Delete account`. After deletion: sign-out and a confirmation page. A typed confirmation word, if used, can be copied from the screen (WCAG 3.3.8). Built in CIN-184 without a typed word; the dialog offers Export since CIN-185 |
| Coming back without dark patterns | No notification permission prompt on the first visit. Reminders only from an explicit control next to the value (`Notify me about new episodes`), each with its own `Turn off`; this needs a backend and is out of scope. No confirmshaming on sign-out or deletion, no streaks. Only factual Home rows for a signed-in user: `Continue watching` (status Watching) |

A guest keeps only the theme in `localStorage`, so no anonymous data has to be merged into an account. Deleting an account also deletes its Firestore documents: the client deletes them after the re-sign-in and before the account (`deleteAccount`, CIN-206), since the rules let only the owner delete them.

## 6. Discovery and decision support

The main catalog metric is **time to decide**, and it is long. Nielsen (June 2023, US): **10.5 minutes** on average before choosing, up from about 7.5 in early 2019; **20 %** do not find anything and do something else; basic metadata (title, cast, genre, rating, runtime) is "not enough" [R]. Gracenote State of Play 2025 (November 2025, 3,000 respondents in six countries): **14 minutes**; **19 %** give up a session after a failed search (29 % among ages 18–24); **66 %** want one guide that says where a title is available [R]. Older Netflix log data says interest fades after 60–90 seconds and 10–20 titles (Gomez-Uribe & Hunt, 2015) [R]: per-user viewing logs measure something else than a per-session self-report.

Choice overload is real but conditional. Scheibehenne et al. (2010, 50 experiments, N = 5,036) found a mean effect near zero with large heterogeneity [R]. Chernev et al. (2015, N = 7,202) found four moderators: how complex the set is, how hard the task is, how unsure the preferences are and the decision goal [R]. So the goal is **lower decision difficulty**, not fewer titles: clear row labels, the same metadata on every card, and a cheap "save for later" that turns an open choice into a deferred one. People follow the link with the strongest information scent (NN/g) [G]. Spoilers hurt less than people think: in Leavitt & Christenfeld (2011, N = 819) spoiled stories were enjoyed more [R], but people still dislike them.

Where to watch follows the TMDB terms: the data must be credited to JustWatch, it is keyed by two-letter country code, the endpoint returns no full deep links, and TMDB asks apps to link to its watch page [S]. It does not say how often the data is refreshed.

| Topic | Target for CinePulse (no source gives numbers) |
| --- | --- |
| Home | Hero + ≥ 1 full row above the fold at 1280×800. 5–8 rows of ≤ 20 titles: time-sensitive first (trending, now playing), then quality (top rated), then breadth (genres). Each label says why the set exists (`Top rated, 1,000+ votes`); no unexplained `For you` |
| Because you saved X | TMDB recommendations for the last saved title; only for a signed-in user with ≥ 1 title; the label names that title |
| Card | Poster, title, year, rating, media type in mixed lists. The rating is muted or hidden under 50 votes |
| Detail on one screen | At 1280×800 and 390×844 the first view holds: title, year, rating with its source and vote count, runtime or seasons, genres, an overview of ≤ 3 lines, Add to watchlist and Where to watch or a link to it. `Watch trailer` in the hero |
| Spoilers | Season overviews are clipped; later episode synopses do not show on their own. Candidate note: `Reviews may contain spoilers` |
| Region | The section heading names the region (`Where to watch in Germany`); changing it takes ≤ 1 press and no reload; the choice is remembered on the device |
| Freshness | One `Availability can change`, no invented "last updated" |
| Provider order | TMDB `display_priority`, no commercial reordering |
| Later | An "available on my services" filter through `with_watch_providers` + `watch_region` (optional; Gracenote: 66 % want to know where a title is available) |

Netflix has tested natural-language search since 2025 but published no accuracy or satisfaction data [R]. The TMDB terms forbid using its data to train ML or AI systems [S], and such a feature needs a backend. It is at most a low-priority experiment.

## 7. Trust and privacy

The TMDB terms §3 bind us. The TMDB logo must be shown, less prominent than the app's own marks, with no hint of endorsement. This notice must appear "prominently", word for word: "This [website/…] uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB". §2 forbids commercial use without a separate agreement; TMDB data may not be cached longer than 6 months [S].

For privacy notices, WP29/EDPB (WP260 rev.01) recommend layered notices, just-in-time notices and privacy dashboards [G]; the "one click away" wording was not checked (unverified). The ICO lists the same methods [G]. The EAA covers e-commerce services "with a view to concluding a consumer contract" and exempts microenterprises [S]. A non-commercial catalog with no contracts most likely falls outside it. This is our reading, not legal advice: no source deals with non-commercial sites directly. The default Google sign-in scopes in Firebase are not confirmed in its docs (unverified).

| Topic | Target for CinePulse |
| --- | --- |
| TMDB credit | Add the logo and the exact notice to the footer of every page and to an About or Credits page. The footer (`packages/ui/src/components/footer.tsx`) shows both since CIN-183; the About or Credits page is still to come. The logo is smaller than the CinePulse wordmark. The notice matches the terms word for word |
| Rating source | The detail page labels the rating as TMDB: `TMDB 7.4 · 12k votes`. No IMDb ratings |
| First privacy layer | 1–2 sentences next to Sign in: what is stored (name, email and photo from Google; titles, folders, statuses, dates), where (Firebase, Google Cloud), why (to sync the watchlist), and that browsing works without signing in |
| Full notice | ≤ 1 press from Sign in, Profile and the footer, in plain language |
| Scopes | Default scopes only. The first layer may say `CinePulse sees only your name, email and photo` once the scopes are checked |
| Analytics | No analytics, no banner. Analytics that store anything on the device need a banner with equal Accept and Reject |
| Accessibility statement | WCAG 2.2 AA stays the target; publish an accessibility statement as good practice |
| Continuity | The folder in the URL (`?folder=<id>`). Web Share API on the detail page, otherwise copy the link with a status message. A change in tab A reaches tab B on focus (`refetchOnWindowFocus` or `BroadcastChannel`). Firestore Lite has no live updates, so no text says "real-time" |

## 8. Measuring UX

The PRD says DAU and conversion "do not apply", so UX metrics are a quality signal. The frame is **ISO 9241-11:2018**: effectiveness, efficiency and satisfaction for given users, goals and context [S] (the ISO page returned 403; the definition is from prior knowledge, unverified). We add a reduced **HEART** built with Goals → Signals → Metrics; Rodden, Hutchinson and Fu (CHI 2010) advise picking only the categories you need [R]. For CinePulse that is **Task success, Adoption and Happiness**. Engagement and Retention are left out: cookieless analytics with a daily salt cannot link days (Plausible) [G], and portfolio traffic would make them noise. PULSE and a North Star metric assume a user base and a business goal that do not exist.

Questionnaire and task benchmarks:

- **SUS:** the average is **68**; B− starts at 72.6, A at 80.8 (MeasuringU) [R].
- **SEQ** ("Overall, how difficult or easy was the task to complete?", 7 points): about 5.3–5.6 on average over 400+ tasks. It correlates with time and completion only at about 0.5, so collect both behaviour and ratings [R].
- **UMUX-Lite:** 2 items with a formula that converts to the SUS scale [R].
- **NPS:** left out. Its validity is disputed, and small samples give very wide intervals [R].
- **Task completion:** the average is **78 %**, above 92 % is the top quartile; even 10 out of 10 gives a 95 % CI of about 75–100 % [R].
- **Lostness** (Smith, 1996) is 0 when the person does not wander; about 0.4 is usually read as "lost", though the cutoff is described in different ways [R].
- **Sample size:** 5 users for qualitative rounds, repeated; ≥ 20 for quantitative ones (NN/g, 2012) [G].
- **Synthetic users** do not replace real ones. NN/g allows them only for hypotheses and for piloting a test script (2024) [G]; experts rated their accuracy as mixed (UXAgent, CHI EA 2025) [R].

| Key task | Completion target | Other targets |
| --- | --- | --- |
| Find a movie by name and open it | ≥ 90 % | ≤ 2 × expert time (unverified heuristic), lostness < 0.4 |
| Sign in and add a title to a given folder | ≥ 90 % | 0 uncorrected errors, SEQ ≥ 5.5 |
| Create a nested folder | ≥ 80 % | The first press lands on the right control |
| Mark watched | ≥ 95 % | 1 step from the row |
| Filter Movies by genre and sort | ≥ 90 % | The applied state is visible |
| The session as a whole | SUS, or UMUX-Lite converted to SUS, ≥ 72.6 (B−); stretch ≥ 80.8 | SEQ ≥ 5.5 on every task |

How the measures become checks (our proposal):

- **Every pull request:** the existing lint, typecheck, tests, size and a11y checks. Add Playwright specs for the key tasks: the flow finishes in ≤ the optimum + 1 interaction, with no error toast on the happy path.
- **Every feature ticket:** a cognitive walkthrough of the changed task, a heuristic pass with the ISO 9241-110 checklist ([QUALITY_BENCHMARKS § 1.2](./QUALITY_BENCHMARKS.md#12-iso-9241-110-review-checklist)), loading, empty and error states in place.
- **Every release or epic** (about 2 hours): 3–5 moderated remote think-aloud sessions; results with confidence intervals go to Notion. A task below target with an unfixed blocking problem becomes a ticket, not a release blocker, because the sample is small. The watchlist is tested on a demo account or the emulators, never on a personal account.
- **Every major release:** one session with a screen reader user, if one can be found.
- A script pilot with a synthetic agent is allowed; its findings are hypotheses [M], not user data.
- Aggregated events (`watchlist_add_opened` / `saved` / `failed`, `search_no_results`, `retry_pressed`) are read only from ≥ 100 samples per pattern. The CNIL consent exemption applies only if the analytics measure audience only, are first-party, truncate the IP and offer an opt-out [G]; the EDPB places pixels and URL tracking under ePrivacy Art. 5(3) (Guidelines 2/2023) [G]. Where the events go stays the open ADR question in QUALITY_BENCHMARKS.

## 9. UI content

ISO 24495-1:2023 sets four principles: relevant, findable, understandable, usable [S]. It sets no readability score or sentence length; only about 7 % of its ideas are about word choice (unverified). The micro-rules come from guides, and they agree:

- **Microsoft** (updated October 2026): sentence case, no period in headings, the key word first, the verb first, no "you can" [G].
- **Apple HIG** (updated 16 December 2025): verbs on buttons, no "Click here", no "oops", "Unable to load content" rather than "We're having trouble…", errors next to the problem and without blame [G].
- **GOV.UK:** numerals for all numbers, "to" in ranges in text, "sign in" not "log in", no "please" [G]. An error says what happened and how to fix it, with no "sorry", "valid/invalid" or humour, and keeps what the person typed [G].
- **Atlassian:** do not invent an unknown cause; say something went wrong and give the next step [G].
- **NN/g** (2023): the severity of an error decides its form; a modal only for serious cases; no codes, no humour [R]. Tone uses the four NN/g dimensions; in their study the tone differences were significant but small, 0.5–1 point [R].
- **Confirmshaming** is a recognised dark pattern [G]; the 2024 FTC/ICPEN sweep found at least one dark pattern on about 76 % of 600+ subscription sites and apps [R].
- Copy is part of WCAG: 2.4.4 Link Purpose, 2.5.3 Label in Name, 1.3.3 Sensory Characteristics, 3.3.1 and 3.3.3 [S].

Two conflicts between guides are settled once. **Contractions:** Microsoft encourages them, GOV.UK bans negative ones ("can't"); we allow positive contractions and avoid negative ones in errors and instructions. **Serial comma:** Microsoft uses it, GOV.UK's position is unverified; we use it, because the UI is in US English. Sources give no primary figure for sentence length, reading level (grade 8, CEFR B1) or button word count; those are conventions (unverified).

The rules, patterns and glossary that follow from this research are in [CONTENT_GUIDE](./CONTENT_GUIDE.md) (CIN-181). It decides the wording of every example on this page.

## Proposed changes

Each item needs a decision and its own ticket, one Area per ticket under the MFE workflow; until then the documentation decides. P1 has the largest effect on key flows or is required by binding terms, P2 is a clear improvement, P3 is optional or future.

| # | Priority | Area | Change | Based on |
| --- | --- | --- | --- | --- |
| 1 | P1 | docs | Describe flows F1–F7 in the [§ 1.1](#11-format) format and run the first cognitive walkthrough | ISO 9241-210 [S], NN/g [R/G] |
| 2 | P1 | docs | A content guide: voice, rules for buttons, errors, success and confirmations, the glossary, the contraction and serial comma decisions | ISO 24495-1 [S], GOV.UK, Microsoft, Apple [G] |
| 3 | P1 | pages-mfe | A guest's pending action in AddToWatchlist: keep the intent before the popup, run it after `user:login`, handle a closed or blocked popup | NN/g, Baymard [R], Firebase [G] |
| 4 | P1 | host or @repo/ui | Add the TMDB logo and the exact notice (in the footer since CIN-183); an About or Credits page | TMDB terms §3 [S] |
| 5 | P1 | user-mfe | Delete account: ≤ 2 steps, one dialog, re-sign-in, a confirmation page (done: CIN-206, CIN-184) | Apple 5.1.1(v), Google Play [S] |
| 6 | P1 | user-mfe | Watchlist export as JSON and CSV (done: CIN-207, CIN-185) | GDPR Art. 20 [S] |
| 7 | P1 | user-mfe | `Move to…` through the folder picker as the single-pointer path for every drag; no moving a folder into itself | WCAG 2.2 SC 2.5.7 [S] |
| 8 | P2 | user-mfe | The six watchlist empty states; a skeleton, not empty text, while loading | NN/g [R], Carbon, Atlassian [G] |
| 9 | P2 | user-mfe | Folder breadcrumbs (parent only on phones), the folder in the URL, counts with subfolders | NN/g [R/G], MDN [G] |
| 10 | P2 | user-mfe | Deleting a folder offers `Move titles to {parent}` / `Delete folder and titles`; an empty folder gets Undo | NN/g [R] |
| 11 | P2 | pages-mfe | A saved indicator on every card with a changing accessible name; the dialog in edit mode | [M] IMDb; SC 2.5.3 [S] |
| 12 | P2 | @repo/firebase or user-mfe | The first privacy layer next to Sign in and the full notice ≤ 1 press away; check the scopes | WP260, ICO [G] |
| 13 | P2 | pages-mfe | Where to watch: the region in the heading, change in 1 press, `Availability can change`, `display_priority` order | TMDB API [S], Gracenote [R] |
| 14 | P2 | e2e | Playwright specs for the key tasks with an "optimum + 1" interaction limit | MeasuringU [R], our proposal |
| 15 | P2 | docs | A plan for UX rounds: task table, SEQ, UMUX-Lite or SUS, a report template with confidence intervals | ISO 9241-11 [S], MeasuringU [R], NN/g [G] |
| 16 | P3 | user-mfe | Bulk actions (`Select`, `{n} selected`), sort in the URL, `Move up` / `Move down` | SC 2.5.7 [S], our proposal |
| 17 | P3 | pages-mfe | A "Because you saved X" row and Home row labels that explain the set | Chernev 2015 [R], our proposal |
| 18 | P3 | pages-mfe | An "available on my services" filter on Movies and TV | Gracenote [R] |
| 19 | P1 | @repo/ui | A `Watchlist` link in the global navigation (header, phone menu) for a signed-in person; a guest gets `Sign in` there | [USER_FLOWS](./USER_FLOWS.md) F7, § 2 |
| 20 | P2 | pages-mfe | Save in one press: with no folders, `Add to watchlist` saves to All titles at once; folders stay an optional choice | [USER_FLOWS](./USER_FLOWS.md) F3 |
| 21 | P3 | @repo/ui | The header `Sign in` link passes the current page as the return path | [USER_FLOWS](./USER_FLOWS.md) F1, F7 |

## Open questions

1. Two statuses or three? The docs describe a two-segment switch; reference products add `Watching` for TV.
2. Can one title sit in more than one folder? The folder picker and the counts depend on it.
3. Do we accept the 4-level depth limit and counts with subfolders without data, or run a tree test first?
4. Where does a guest's pending action live if a redirect fallback is ever needed for phones that block popups? That also needs auth domain setup.
5. Do UX rounds get logged in Notion, and who recruits 3–5 participants per round?
6. Do we turn on aggregated event analytics at all? With portfolio traffic, 100 samples per pattern may take years.
7. Which Google scopes does sign-in really request? The line `CinePulse sees only your name, email and photo` depends on it.
8. Does the EAA and GDPR reading for a non-commercial site with EU visitors need a legal check? Ukrainian law was not reviewed.
9. How do IMDb, Trakt, Letterboxd and JustWatch treat a guest who saves a title, and where is their watchlist on phones? A manual browser pass closes this.
10. Strings in props (`aria-label`, toast text) need a linter: extend the existing script or use Vale with a custom view?
