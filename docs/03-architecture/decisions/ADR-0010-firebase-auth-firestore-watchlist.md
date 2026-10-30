🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0010: Firebase Auth and Firestore for the watchlist

## Status

Accepted (2026-10-30). Replaces the "email + password, no social login" scope of the PRD.

## Context

The watchlist is the first feature with user data: a folder tree up to 6 levels deep, a title in several folders, a `watched | planned` status, movies and TV shows, access for the owner only. The project already runs on Firebase and has no server of its own besides `tmdbProxy`. The host's JS budget is nearly spent (204 of 205 kB) and mobile LCP is above the 2.5 s goal, so a large SDK must not join the first load.

## Decision

- **Firebase Auth with Google sign-in only.** No passwords means no sign-up form, reset flow or email verification. `/auth/login` has one action; there is no `/auth/register`.
- **Firestore in Native mode, region `eur3`,** accessed directly from the browser through the SDK. Security Rules are the only access control.
- **Collections live under the owner:**

  ```text
  users/{uid}/folders/{folderId}
    name: string (1–100)
    parentId: string | null
    depth: int (1–6)
    createdAt: timestamp

  users/{uid}/items/{mediaType}_{tmdbId}
    mediaType: 'movie' | 'tv'
    tmdbId: int
    title: string
    posterPath: string | null
    status: 'watched' | 'planned'
    folderIds: string[] (≤ 100)
    addedAt: timestamp
  ```

  - The path carries the owner, so there is no `ownerUid` field to validate.
  - The item ID is deterministic: adding a title twice cannot create a duplicate.
  - `title` and `posterPath` are copied from TMDB, so a list renders without one TMDB request per title.
- **The tree is `parentId` plus a stored `depth`.** Rules check that `depth` is 1–6 and equals the parent's depth plus one. Moving a branch is one batch that rewrites `parentId` on its root and `depth` on every descendant. The client refuses a move into the folder's own branch or past level 6.
- **`firebase` lives behind a new `@repo/firebase` package,** a Module Federation singleton like the other `@repo/*` packages. It imports the SDK dynamically: Auth only for visitors with a session flag in `localStorage` and on `/auth/login`, Firestore only on watchlist pages. `firebase` itself is not in the `shared` map.
- **Configuration comes from `/__/firebase/init.json` at runtime.** Firebase Hosting serves it for the project, so the repository holds no Firebase keys and environments need no build-time variables.
- **TanStack Query stays the data layer.** `queryOptions` factories wrap one-time reads, `useMutation` writes and invalidates. No `onSnapshot` and no offline persistence: one user edits their own list, and the extra SDK weight buys nothing yet.
- **The cache is user-scoped.** Query keys start with `['watchlist', uid]`; `user:logout` removes them.
- **`FirebaseError` becomes `ApiError`** in `@repo/firebase`, so boundaries, toasts and the error report work unchanged.
- **The login page loads the SDK on mount,** not on the click. Browsers allow a popup only right after a user gesture, and a network wait spends it.
- **A `demo-` project talks to the Auth emulator.** It is Firebase's convention for a project with no backend, so production code needs no test flag.
- **The CSP gains only what sign-in needs:** `https://apis.google.com` in `script-src`, the project's `firebaseapp.com` in `frame-src`, Google avatars in `img-src`. These are the documented origins; they are not yet confirmed against the real popup. `connect-src` already allows `https://*.googleapis.com`.

## Alternatives considered

- **Supabase or a custom API:** a relational model fits a tree well, but it adds a second platform or a server to run, while the project's learning goal is Firebase.
- **Materialized path:** finds a branch with one query, but a move rewrites the same documents, and rules cannot validate a path as simply as a depth.
- **One document holding the whole tree:** simple to read, but limited to 1 MiB and every edit rewrites everything.
- **`folders/{id}/items` subcollections:** a title in several folders would need a copy per folder, and its status would have to be updated in each.
- **Email and password:** the wider audience does not matter for a portfolio project, and it adds three forms and their error states.
- **`onSnapshot` through `setQueryData`:** live updates across tabs, at the cost of a subscription lifecycle next to Suspense queries.

## Consequences

- People without a Google account cannot use the watchlist. The catalog stays anonymous.
- Rules see one document, not its children. They block other users and malformed documents, but a hand-crafted write by the owner can still break the owner's own tree, for example by moving a folder without its descendants. The damage stays inside that user's data, and the client must tolerate folders unreachable from the root.
- A batch may trigger at most 20 document lookups in rules, so a move of a branch with more than 20 folders that have children is rejected. The UI reports the failure.
- Copied titles and posters can go stale. A refresh on the details page is possible later.
- Rule changes deploy with the release; the CI job `rules` tests them on the emulator and needs Java.
- The Firestore database must exist before the first release that deploys rules.
- ADR-0008's `globalStore` gets user state back, and `user:login` / `user:logout` return to `EventMap`.
- A session started in another tab reaches this tab only after a reload: without the flag, this tab has no SDK listening.
- The Firebase SDK adds about 51 kB gzip for signed-in visitors, with its own size budget of 55 kB. The host's own budget moves from 205 to 207 kB for the auth code in `@repo/firebase`, `@repo/events` and the header. The budget counts every host chunk except the SDK, and matches the SDK by its chunk name (`index.esm-*.js`), so a change of that name fails `pnpm size` rather than passing silently.
- The Auth emulator cannot run under the enforced CSP, so `e2e/auth.spec.ts` bypasses it. The production CSP for sign-in is only checked by a real sign-in.
