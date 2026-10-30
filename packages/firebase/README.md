# @repo/firebase

The only importer of the `firebase` SDK, always dynamically, so anonymous visitors never download it. See [ADR-0010](../../docs/03-architecture/decisions/ADR-0010-firebase-auth-firestore-watchlist.md).

## Public API

- `startAuthSession`: call once before the first render. It restores a known session.
- `prepareSignIn`: call when the login page mounts, because a popup must open right after the click.
- `signInWithGoogle`, `signOutUser`.
- `getSignInErrorMessage`.

Auth state reaches the app through `globalStore` and the `user:login` / `user:logout` events of `@repo/events`.

Config comes from `/__/firebase/init.json` at runtime. A `demo-` project talks to the Auth emulator on port 5013.

## Dependencies

`@repo/api` for `ApiError`, `@repo/events` for state and events, `firebase`.
