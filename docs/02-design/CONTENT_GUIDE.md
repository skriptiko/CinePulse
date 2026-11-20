🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Content guide

How CinePulse writes the words people read in the UI: buttons, links, headings, toasts, errors, confirmations, empty states, status messages and accessible names. Use it when you write or review any UI text. Where a pattern here and a screen in [UX_NOTES](./UX_NOTES.md) differ, this guide decides the wording and UX_NOTES decides the behaviour.

The UI is in US English. Docs, ADRs, commits and Notion follow the same plain-language standard (ISO 24495-1), but only the UI follows the patterns below.

Written on 2026-11-20 (CIN-181) from the research in [UX_STANDARDS § 9](./UX_STANDARDS.md#9-ui-content). The sources are listed at the end.

## Contents

1. [Four principles](#1-four-principles)
2. [Voice and tone](#2-voice-and-tone)
3. [Style rules](#3-style-rules)
4. [Buttons and links](#4-buttons-and-links)
5. [Errors](#5-errors)
6. [Success messages](#6-success-messages)
7. [Confirmations](#7-confirmations)
8. [Empty states, loading and status messages](#8-empty-states-loading-and-status-messages)
9. [Sign-in prompts](#9-sign-in-prompts)
10. [Accessible names](#10-accessible-names)
11. [Numbers, dates and durations](#11-numbers-dates-and-durations)
12. [Glossary of UI words](#12-glossary-of-ui-words)
13. [Review checklist](#13-review-checklist)

## 1. Four principles

ISO 24495-1:2023 asks that a text is **relevant, findable, understandable and usable**. For a line of UI text that means:

- **Relevant:** it says only what the person needs at this moment. Cut anything they would not miss.
- **Findable:** the key word comes first, so a person who scans sees it.
- **Understandable:** common words, one term for one thing, short sentences in the active voice.
- **Usable:** the person knows what to do next. Every error and every empty state gives an action.

The standard sets no readability score and no sentence length. The limits in this guide are our own conventions.

## 2. Voice and tone

The voice stays the same everywhere. On the four tone dimensions of NN/g, CinePulse sits here:

| Dimension | CinePulse | So we write | Not |
| --- | --- | --- | --- |
| Funny ↔ serious | Serious | `Your watchlist is empty` | `Wow, such empty!` |
| Formal ↔ casual | Leaning casual, no slang | `You've watched everything in this folder` | `You have viewed all items` / `You crushed it` |
| Respectful ↔ irreverent | Respectful | `Not now` | `No thanks, I don't like movies` |
| Enthusiastic ↔ matter-of-fact | Matter-of-fact | `Folder renamed` | `Awesome! Folder renamed!` |

The movies and shows carry the emotion; the interface around them stays calm. Tone shifts by situation, the voice does not:

- **Success:** short, past tense, no exclamation mark.
- **Error:** plain and calm. No blame, no humour, no "oops".
- **Destructive action:** exact. Name the object, the count and what cannot be undone.
- **Sign-in prompt:** neutral. Declining is as easy and as polite as accepting.

## 3. Style rules

| Rule | Do | Don't |
| --- | --- | --- |
| Sentence case for everything: buttons, headings, tabs, menu items | `Add to watchlist`, `More like this` | `Add To Watchlist`, `More Like This` |
| No period after a heading, a button, a label or a one-line toast with one sentence | `Your watchlist is empty` | `Your watchlist is empty.` |
| A body of two sentences has periods | `Save movies and TV shows to watch later.` | |
| Key word first | `Folders can be 4 levels deep` | `Please note that there is a limit of 4 levels` |
| Talk to the person as "you"; no "we" for the product, except in an apology | `Your folders could not be loaded.` | `We could not load the folders.` |
| No "you can": give the action | `Create folders in your watchlist.` | `You can create folders in your watchlist.` |
| No "please", "sorry", "oops", "simply", "just" | `Enter a folder name` | `Please enter a folder name` |
| Positive contractions are fine | `You've watched everything`, `It's in your watchlist` | |
| No negative contractions in errors and instructions | `Your watchlist did not load.` | `Your watchlist didn't load.` |
| Serial comma | `Stream, rent, or buy` | `Stream, rent or buy` |
| Numerals for all numbers | `4 levels`, `1 title` | `four levels`, `one title` |
| "to" for a range in a sentence; an en dash only in a compact label | `1 to 3 titles`; `2010–2019` | `1-3 titles` |
| The ellipsis character `…` (one character): on a command that asks for more input, and on an action in progress | `Move to folder…`, `Saving…` | `Move to folder...` |
| Curly quotes around a name the person typed or a query | `No titles match “dune”`, `Delete “Horror nights”?` | `No titles match "dune"` |
| Text from TMDB (titles, names, overviews) stays as TMDB gives it | `Dune: Part Two` | Retyping or title-casing it |

A UI message is **at most 2 sentences, each at most 20 words**. A button has **at most 3 words**. Leave room for longer text: buttons, pills, tabs, toasts and the header must hold 2 to 3 times the label's length ([QUALITY_BENCHMARKS](./QUALITY_BENCHMARKS.md)).

## 4. Buttons and links

**A button starts with a verb and says what happens.** The label is the outcome, not the gesture.

| Do | Don't |
| --- | --- |
| `Add to watchlist` | `Add` (when the object is not clear), `Submit` |
| `New folder` | `Create` |
| `Move to folder…` | `Move` (it asks for a folder) |
| `Sign in with Google` | `Log in`, `Continue` |
| `Try again` | `Retry`, `Reload` (unless the page reloads) |
| `Clear search`, `Reset filters` | `Clear` (when two things can be cleared) |
| `Delete folder` + `Cancel` | `Yes` + `No`, `OK` |

- No `OK`, `Yes`, `No`, `Submit`, `Click here` or `Learn more` on its own.
- A pair of buttons names both outcomes. The safe choice is `Cancel` or `Not now`, never a guilt line.
- `Reload page` only when the action reloads the page, for example after an app update or a crash. `Try again` retries the failed request.
- **A link says where it goes.** Its text makes sense out of context (WCAG 2.4.4): `Open watchlist`, `See all options on TMDB`. Not `here`, `this page` or `more`.
- A link to another site says so when it opens in a new tab: `See all options on TMDB (opens in a new tab)` as the accessible name. The visible text may stay shorter.

## 5. Errors

**An error says what happened and what to do next.** It sits next to the problem: under a field, in the place of the section that failed, or in a toast only on top of data that is still shown.

| Kind | Pattern | Example |
| --- | --- | --- |
| A field | What to enter, not what was wrong | `Enter a folder name`, `Use 60 characters or fewer`, `A folder with this name is already here` |
| A section or a page that did not load | What did not load + `Try again` | `Your folders could not be loaded.` + `Try again` |
| No connection | What happened + what to check | `Could not reach the server. Check your connection and try again.` |
| A failed write | What was not saved + how to retry | `Dune was not saved. Try again.` |
| A cause we do not know | Do not guess one; give the next step | `Something went wrong. Try again.` |
| Sign-in | The cause the person can act on | `Allow pop-ups for this site and try again.` |
| The whole app failed (the shell error page) | The only place for an apology | `Sorry, CinePulse stopped working. Reload the page to continue.` + `Reload page` |

- No "invalid", "illegal", "failed to", "error", codes or stack text. No humour.
- Do not blame the person: `Enter a folder name`, not `You did not enter a name`.
- Name the right service. A failed watchlist write is not a "movie service" problem.
- Keep what the person typed or ticked. An error never clears a form.
- Severity sets the form (NN/g): a field error inline, a section error in place, a modal only for an error that stops everything.
- An error that matters does not time out ([QUALITY_BENCHMARKS](./QUALITY_BENCHMARKS.md) § 2, toasts).

## 6. Success messages

**Confirm only what the person cannot see.** If the result is on the screen (a renamed row, a ticked box), no message is needed.

- Past tense or a state, the object named, no exclamation mark: `Folder renamed`, `Dune is in your watchlist, under All titles`, `Added Dune to Watched`.
- Name where the item went when that is not on the screen: the folder, the status.
- A message with an action offers it in words: `Folder deleted` + `Undo`.
- No "Success!", "Done!", "Great!".

## 7. Confirmations

**Ask only before a serious action that cannot be undone.** A cheap action that can be reversed gets `Undo` in a toast instead of a question (NN/g).

The confirmation has three parts:

1. **Heading:** a question with the verb and the object. `Delete “Horror nights”?`
2. **Body:** the consequence, with the count, and whether it can be undone. `The folder and the 12 titles in it are removed from your watchlist. You cannot undo this.`
3. **Buttons:** the action repeats the verb and the noun: `Delete folder`. The other is `Cancel`. When there is a safer choice, it comes first: `Move titles to “Movies”`.

- Focus never starts on the destructive button.
- Never shame the person for declining (confirmshaming). `Cancel`, not `No, keep my mess`.

## 8. Empty states, loading and status messages

**An empty state is a true status, a short cue and an action.** The six watchlist empty states and their wording are in [UX_STANDARDS § 3](./UX_STANDARDS.md#3-first-run-and-empty-states). The rules behind them:

- A heading that says what is empty, in sentence case: `No titles in “Horror nights”`.
- A body of at most 2 sentences that does not repeat the heading.
- One primary action, 1 to 2 words, a verb: `Browse movies`.
- Never "no items" while data is loading: a skeleton shows instead. An empty result names the query and the filter: `No TV shows found for “dune”`.

**A status message makes sense alone** (WCAG 4.1.3). Screen readers announce it without context, so write a full statement: `20 movies found`, not `Done`; `Moved to position 3 of 12`, not `Moved`.

**Loading text** is rare: a skeleton or a spinner says enough under 10 seconds. After 10 seconds: `Still loading…` with `Try again`. A button that works in the background says what it does: `Saving…`, `Signing in…`.

## 9. Sign-in prompts

Ask for an account at the moment the person commits, and ask once.

- Say what the person gets, in their terms: `Sign in to save Dune`, `Sign in with Google, and the title is saved to your watchlist.`
- The button: `Sign in with Google`. The way out: `Not now` or `Close`, neutral and as visible as the button.
- No pressure, no countdown, no "you'll lose everything".
- After sign-in, do what the person asked for and say so: `Dune is in your watchlist, under All titles`.

## 10. Accessible names

The accessible name is UI text too. The same rules apply, plus these:

- **Label in name** (WCAG 2.5.3): the accessible name starts with the visible text. A button that shows `Add to watchlist` is not named `Save title`.
- **An icon-only button names the action and the object:** `Add Dune to your watchlist`, `Close`, `Open menu`. Not `Bookmark icon`, `Button`, `Click to add`.
- Do not repeat the role. The screen reader says "button" and "link": `Search`, not `Search button`.
- A control in a list names its row, so a list of 20 is not 20 × `Edit`: `Rename “Horror nights”`.
- **No sensory words** (WCAG 1.3.3): `Use the button under the poster`, not `the blue button` or `the button on the right`.
- An image's alt text says what matters in context. A poster: the title. A decorative image: empty `alt=""`.
- A heading that a page moves focus to is short and specific: the page or section name, the same as `document.title` starts with.

## 11. Numbers, dates and durations

Format with `Intl` in code, never by hand, so the person's locale works when it is supported.

| What | Visible | Accessible name, when it differs |
| --- | --- | --- |
| A count | `12,345 votes` (`Intl.NumberFormat`) | |
| A plural | `1 title`, `2 titles` (`Intl.PluralRules`) | |
| A date | One `Intl.DateTimeFormat` format across the app | |
| Runtime | `2h 15m` | `2 hours 15 minutes` |
| An episode | `S2 E5` | `Season 2, episode 5` |
| A rating | One decimal: `7.8` | `Rating 7.8 out of 10` |
| A rating under the vote floor | `No rating yet` | Not `0.0` |

## 12. Glossary of UI words

One term for one thing. These are the words people see; the project and code terms are in [GLOSSARY](../01-product/GLOSSARY.md).

| Use | For | Don't use |
| --- | --- | --- |
| **title** | Any movie or TV show | item, content, media, entry |
| **movie** | A film | film |
| **TV show** | A series | series, show (on its own), TV |
| **person** | An actor or a crew member | celebrity, star |
| **watchlist** | The whole personal collection | list, library, collection, favorites |
| **folder** | A container in the watchlist | list, playlist, category, collection |
| **All titles** | The first row: every saved title | All, Unsorted |
| **Planned**, **Watched** | The two statuses, spelled the same everywhere | To watch, Seen, Done |
| **sign in**, **sign out** (verbs); **sign-in** (noun) | The account session | log in, log out, login |
| **account** | What Google sign-in creates | profile (the Profile page is a page, not the account) |
| **rating** | The TMDB score | score, stars |
| **certification** | An age rating such as PG-13 | rating |
| **Where to watch** | Stream, rent, or buy offers | providers, availability |
| **select** | Choosing an item in instructions | click, tap, hit |
| **Try again** | Repeating a failed request | Retry, Reload, Refresh |

A new UI term goes into this table in the same pull request that adds it. A changed project term goes into GLOSSARY.

## 13. Review checklist

Check every pull request that adds or changes UI text, including `aria-label`, toast and `document.title` strings:

- [ ] Sentence case, the key word first, no "please", "sorry", "oops" or "you can".
- [ ] Each button starts with a verb, has at most 3 words, and says the outcome.
- [ ] Each error says what happened and what to do, names the right service and keeps the input.
- [ ] Success is confirmed only where the result is not visible; no exclamation marks.
- [ ] A destructive action names the object and the count; a reversible one offers Undo.
- [ ] Every term matches [§ 12](#12-glossary-of-ui-words); a new term is added there.
- [ ] Accessible names start with the visible label and name the object.
- [ ] Numbers, plurals and dates use `Intl`.

The checklist is checked by review. No linter checks UI text yet. Vale can lint `docs/**/*.md` and JSX text; strings in props would need a script like `scripts/check-jsx-spread.js`.

## Sources

- **ISO 24495-1:2023** Plain language, part 1: governing principles and guidelines [S].
- **WCAG 2.2:** 1.3.3 Sensory characteristics, 2.4.4 Link purpose, 2.5.3 Label in name, 3.3.1 Error identification, 3.3.3 Error suggestion, 4.1.3 Status messages [S].
- **Microsoft Writing Style Guide** (updated October 2026): sentence case, verb first, contractions, serial comma [G].
- **Apple Human Interface Guidelines, Writing** (updated 16 December 2025): verbs on buttons, error wording without blame [G].
- **GOV.UK style guide and design system:** numerals, ranges with "to", "sign in", no "please", error messages [G].
- **Atlassian design system, writing guidelines:** unknown causes, empty states, buttons of 1 to 2 words [G].
- **Carbon design system:** empty state types [G].
- **NN/g:** the four dimensions of tone of voice; error message guidelines (2023); confirmation dialogs (2018, reviewed 2026); empty states (2021) [R].
- **Confirmshaming:** a recognised dark pattern; the FTC and ICPEN sweep of 2024 [G/R].

Tags as in [UX_STANDARDS](./UX_STANDARDS.md): [S] standard, [G] guideline, [R] research.
