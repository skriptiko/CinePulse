🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0013: Firestore Lite behind a lazy watchlist store

## Status

Accepted (2026-10-30). Builds on [ADR-0010](./ADR-0010-firebase-auth-firestore-watchlist.md).

## Context

ADR-0010 chose Firestore for the watchlist and wants neither `onSnapshot` nor offline persistence, but it did not pick an SDK entry point. For the calls the watchlist needs, `firebase/firestore` costs 146 kB gzip and `firebase/firestore/lite` costs 37 kB.

Three constraints shape where that code can live:

- The host's JS budget has less than 1 kB left, and Module Federation does not tree-shake a shared module: everything statically reachable from the `@repo/firebase` entry reaches anonymous visitors.
- The federation plugin shares a key only on an exact match, so `@repo/firebase/<subpath>` gives each app its own copy of that subpath.
- `firebase` is not in the `shared` map, so a second copy of `firebase/app` in a remote has no Auth registered. Its Firestore requests are unauthenticated, and rules reject them.

Rules also see one document at a time, so they cannot check a branch or a title list against the rest of the tree.

## Decision

- **Firestore Lite.** `watchlist-store.ts` is the only importer of `firebase/firestore/lite`, and a demo project talks to the Firestore emulator on port 5012.
- **The store stays behind the singleton.** `loadWatchlistStore()` in the `@repo/firebase` entry imports it dynamically, and it is not listed in `exports`, so a remote cannot import it directly.
- **Pure tree helpers are a subpath,** `@repo/firebase/watchlist-tree`. They have no imports, so a copy per app is harmless, and on the entry they would reach anonymous visitors.
- **A subpath entry never imports `./app`, `./auth` or `./watchlist-store` relatively.** That would create a second `firebase/app`: green in `tsc`, unit tests and the build, and a `permission-denied` at runtime.
- **Query factories are in the entry.** `watchlistQueries` is small, and CIN-26 needs the same factories from another remote. Its key prefix is `watchlistKey` in `@repo/api`, because `@repo/api` drops those queries on `user:logout` and cannot import `@repo/firebase`.
- **Mutation hooks stay with the page.** This deviates from engineering standards §7.5, under the callout that marks the rule as temporary until the Firestore decision: anything static in `@repo/firebase` reaches anonymous visitors.
- **Move and delete read fresh data before they write.** A long-open tab must not act on a stale tree. A move the fresh tree no longer allows is refused with no write.
- **Delete is one batch that writes `arrayRemove`,** not the array it read. A folder added to a title since that read survives.
- **A title with no folders is valid.** It stays in the watchlist and shows under All titles. Deleting a folder never deletes a title document.
- **Writes use `networkMode: 'always'`.** Lite has no write queue, and a default mutation would pause offline with its form locked.

## Alternatives considered

- **Full `firebase/firestore`:** adds `onSnapshot` and persistence, which ADR-0010 does not want, for 109 kB more on the watchlist page.
- **The store in the `@repo/firebase` entry:** simpler imports, but a static import puts Lite in the first load.
- **The store as a subpath or inside `user-mfe`:** avoids the lazy loader, but it brings a second `firebase/app`.
- **A branch delete split into several batches:** Firestore's quotas list no document limit per batch, only 10 MiB, and a partial failure would leave a half-deleted branch.

## Consequences

- Firestore Lite and the store get their own size budget of 38 kB (35.45 kB today). The host budget stays at 208 kB with 0.10 kB left, so static growth in a shared package will need a recorded budget move.
- Opening the page reads all folders and titles, a delete reads them again, and opening Move or Delete rereads folders. That is acceptable for personal lists, but the list has no paging.
- A stale move, a rename of an orphaned folder and a wide move all show the generic error toast, because `MutationCache` knows no per-write message. Data stays safe. The limit of 20 document lookups per batch from ADR-0010 still applies to wide moves.
- A write from another tab between the fresh read and the commit can still leave a stale depth, a loop or a dangling folder id. The tree helpers tolerate these, and a move to the top level repairs a folder. Closing that gap needs a server.
- A new Firebase entry point goes into `optimizeDeps.include` of the apps that load it. The federation plugin forces re-optimization on every dev start, so an entry found late is bundled with a second `firebase/app` until Vite reloads.
- A relative import from a subpath stays green until runtime. e2e checks that Firestore runs from the host's chunk with a signed-in user, and that job runs only on PRs into `main`, so run `pnpm test:e2e` locally before merging such a change.
