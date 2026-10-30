🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0011: Declarative routing with remotes loaded by route

## Status

Accepted (2026-10-30).

## Context

The host renders routes with `useRoutes`. That mode has no loaders, route `ErrorBoundary` or `useMatches`, so the standards use component boundaries and `useSuspenseQueries` instead. The open question was whether to move to `createBrowserRouter` with `route.lazy` and loaders.

Production measurements gave the question a concrete cost: mobile LCP was 3.0–3.6 s against a 2.5 s goal. Most of it was the wait before the hero image started loading, while 48–49 JS files arrived. The host loaded both remotes on every page.

## Decision

- **Stay on `useRoutes`.** Routes are not moved into a Data router.
- **Load a remote the first time the user reaches one of its paths.** `useRemoteRoutes` finds the owner of the current path in `REMOTES` and imports only that remote. Other remotes' paths show the page skeleton until they are needed.
- **`shareStrategy: 'loaded-first'` in all three apps.** The default, `version-first`, downloads every remote at startup to compare shared versions, which would undo the point. Versions cannot differ: the pnpm catalog pins them, and host and remotes deploy together (ADR-0009).
- **`REMOTES[].paths` is the routing table of the shell.** The host has to know paths before a remote loads, and it already kept them for `RemoteUnavailable`.
- **Data still loads through TanStack Query.** Waterfalls are avoided with `useSuspenseQueries` and prefetch on intent, as before.
- **A 404 from TMDB stays with `PageBoundary`,** which renders `NotFound`.

## Alternatives considered

- **`createBrowserRouter` with `route.lazy`:** the idiomatic way to split by route, but a remote's route objects are only known after it loads, so the host would need its own stub route per path anyway. The router would also have to exist before the first render, which moves `QueryClient` creation out of `ApiProvider`.
- **Loaders with `ensureQueryData`:** start data requests earlier, but need remotes to export `createRoutes(queryClient)`, and the page still has to wait for the remote's code first. The gain is small next to not downloading the other remote.
- **Keep loading both remotes:** simple, and the next navigation is instant, but every visitor pays for code they may not use.

## Consequences

- A page downloads one remote. The first visit to the other remote costs a request, and shows a skeleton meanwhile.
- `strictVersion` no longer compares a remote against the others at startup, only when that remote loads. A mismatch would surface on that remote's pages, as `RemoteUnavailable`.
- A route added to a remote must also be added to its `paths` in `apps/host/src/remotes/remotes.ts`, otherwise a direct visit shows `NotFound` until that remote is loaded.
- Route-level `ErrorBoundary`, `useMatches` and loaders stay unavailable. Revisit this when a feature needs them.
