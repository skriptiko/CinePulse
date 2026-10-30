🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0004: Typed event bus + global store for cross-MFE communication

## Status

Accepted. The global store part is superseded by [ADR-0008](./ADR-0008-zustand-global-store.md).

## Context

The MFEs (`pages-mfe`, `user-mfe`) load independently and must not import from each other. At the same time they need to exchange events (user login/logout, global notifications) and read shared state (current user, theme). A classic shared React context fits federation poorly: different MFEs may get different provider instances.

## Decision

We extracted a separate **`@repo/events`** package with two primitives:

- **Event bus** (`event-bus.ts`) — typed `emit`/`on`/`once`/`off` on top of the `TypedEventBus` class, stored as a singleton on `window.__CINEPULSE_EVENT_BUS__`. The event contract is strictly typed through `EventMap` (`user:login`, `user:logout`, `user:update`, `navigation:change`, `notification:show`, `mfe:ready`, `mfe:error`). The `createTypedEmitter` / `createTypedListener` factories provide type-safe helpers.
- **Global store** (`store.ts`) — a singleton `window.__CINEPULSE_STORE__` with state `{ user, isAuthenticated, theme }` and actions `setUser`/`updateUser`/`setTheme`/`reset`.

Keeping the singleton on `window` guarantees a single instance even if federation loads the package twice. `@repo/events` is declared shared in every `vite.config.ts`.

## Consequences

**Pros:**
- Full event type safety: the compiler checks the payload of every event.
- Zero coupling between MFEs: they communicate only through the `EventMap` contract.
- Resilient to duplicate instances thanks to the `window` singleton.

**Cons / trade-offs:**
- The global store is **not reactive for React out of the box**: there is no ready-made subscription hook; for now it is mostly used as a state/event bus. Reactive integration (e.g. a `useStore` hook) will have to be added when implementing Profile/Settings.
- State on `window` is global and not isolated for tests (requires an explicit `reset()`).
- Extending the contract (`EventMap`) requires a coordinated update in all consumers.
