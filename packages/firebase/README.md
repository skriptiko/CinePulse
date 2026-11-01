# @repo/firebase

The only importer of the `firebase` SDK, always behind a lazy load, so anonymous visitors never download it. See [ADR-0010](../../docs/03-architecture/decisions/ADR-0010-firebase-auth-firestore-watchlist.md) and [ADR-0013](../../docs/03-architecture/decisions/ADR-0013-firestore-lite-watchlist-store.md).

## Public API

- `startAuthSession`: call once before the first render. It restores a known session.
- `prepareSignIn`: call when the login page mounts, because a popup must open right after the click.
- `signInWithGoogle`, `signOutUser`.
- `getSignInErrorMessage`.
- `watchlistQueries`: `queryOptions` factories `folders(uid)` and `items(uid)`, plus `all(uid)`, their key prefix.
- `loadWatchlistStore`: loads Firestore Lite and the store, which writes through `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder`, `saveTitle` and `setTitleStatus`.
- Types `FolderChanges`, `WatchlistItem`, `WatchlistTitle`, `WatchStatus`.

Auth state reaches the app through `globalStore` and the `user:login` / `user:logout` events of `@repo/events`.

Config comes from `/__/firebase/init.json` at runtime. A `demo-` project talks to the Auth emulator on port 5013 and the Firestore emulator on port 5012.

## Watchlist tree helpers

`@repo/firebase/watchlist-tree` holds the pure helpers (`getFolderRows`, `getBranch`, `canMoveFolder`, `canAddSubfolder`…), `MAX_FOLDER_DEPTH` and the type `WatchlistFolder`. Each app bundles its own copy, because the entry would send them to anonymous visitors.

**A subpath entry must never relatively import `./app`, `./auth` or `./watchlist-store`.** That creates a second `firebase/app` with no Auth: green in `tsc`, unit tests and the build, `permission-denied` at runtime. `watchlist-store.ts` stays out of `exports`, so `loadWatchlistStore` is the only way to reach it.

## Adding a Firebase entry point

An app that loads a new one lists it in `optimizeDeps.include` of its `vite.config.ts`, next to `@repo/firebase > firebase/firestore/lite`. Found late, it is bundled with a second `firebase/app` until Vite reloads.

## Dependencies

`@repo/api` for `ApiError` and `watchlistKey`, `@repo/events` for state and events, `firebase`. Peers: `@tanstack/react-query`, `react`, `zustand`.
