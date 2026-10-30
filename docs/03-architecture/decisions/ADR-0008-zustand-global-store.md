🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0008: Global store on Zustand

## Status

Accepted (2026-10-30). Supersedes the global store part of [ADR-0004](./ADR-0004-typed-event-bus.md); the event bus is unchanged.

## Context

`@repo/events` had a hand-written global store (`window.__CINEPULSE_STORE__`) with `user`, `isAuthenticated` and `theme`. It did not work:

- `createGlobalStore` spread the initial state into the returned object. Actions wrote to a closure variable, so `globalStore.theme` never changed after `setTheme`.
- The listener set was never exposed: nothing could subscribe, and there was no React hook. A component could not re-render on a change.
- `user` and `isAuthenticated` had no source. Firebase Auth comes later, and nothing ever called `setUser`.

The next step (plan item 6.5) wires a theme switcher in the shared header to the store. The header is rendered by host, while pages from any remote may read the theme. So the store must be one reactive instance across host and all remotes, and React components must be able to subscribe to it.

## Decision

- Rebuild the store with `createStore` from **Zustand 5** (`zustand` in the pnpm catalog).
- Keep the `window` singleton: `getGlobalStore()` returns `window.__CINEPULSE_STORE__`, creating it on first call, like the event bus. `globalStore` is that instance as a `StoreApi` (`getState`, `setState`, `subscribe`).
- React reads it through `useGlobalStore(selector)`, built on Zustand's `useStore`. The selector is required. It must return a stable value (a primitive or an existing reference); a selector that builds a new object or array must be wrapped in `useShallow`.
- Keep only state with a real source: `theme` (default `'dark'`: the design is dark-first, and `'system'` is an opt-in choice for the future Settings page) and `setTheme`. `THEMES = ['light', 'dark', 'system'] as const` is the source of the `Theme` type. `user`/`isAuthenticated`/`UserProfile` are removed and come back with Firebase Auth.
- `zustand` is a strict Module Federation singleton (`STRICT_SINGLETONS` in `scripts/mf-shared.ts`). It is a peer + dev dependency of `@repo/events` and a dependency of every app, so each app can resolve the shared module.
- The store imports from the main `zustand` entry, not `zustand/vanilla`. Federation shares the `zustand` specifier; a subpath import would bundle a private copy.

## Consequences

**Pros:**

- State changes reach every subscriber and re-render components in any MFE.
- Zustand handles React 18/19 concurrent rendering (`useSyncExternalStore`), selectors and equality, so we do not maintain that code.
- A small, typed API. New global state is one field and one action in `store.ts`.

**Cons / trade-offs:**

- One more shared runtime dependency: about 0.7 kB gzip in the host bundle (200.6 → 201.3 kB, budget 205 kB).
- Two guards for one instance (the MF singleton and the `window` key). The `window` key still matters if federation loads `@repo/events` twice.
- The store is global per page. Tests reset it with `globalStore.setState(...)`, or use a fresh `createGlobalStore()`.

## Alternatives considered

- **React context in host**: remotes would have to get the provider from host. Their standalone `main.tsx` would need a copy of it, and two React trees would not share the value. Context also re-renders every consumer on any change.
- **Event bus only** (`theme:change` events): events carry changes but not the current value. A component that mounts late would miss it, so we would rebuild a store on top of the bus anyway.
- **Jotai / Redux Toolkit**: Jotai atoms live in a React `Provider` store by default, which has the same cross-tree problem as context. Redux Toolkit plus `react-redux` is much more code and bundle for one field.
- **Fix the hand-written store**: possible, but we would own subscription, selector equality and `useSyncExternalStore` wiring that Zustand already gets right.
