🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0007: Upgrade to React 19 before the `@repo/ui` refactoring

## Status

Accepted (2026-10-29)

## Context

Phase 4 of the refactoring plan rewrites the shadcn primitives in `@repo/ui` (`Button`, `Badge`, `Input`, `DropdownMenu`, `Skeleton`). The current shadcn registry generates them for React 19, where `ref` is a regular prop. On React 18 every one of them would need `forwardRef`. If we later moved to React 19 anyway, that `forwardRef` code would have to be removed again.

The ecosystem is ready:

- Radix, TanStack Query 5, React Router 7, lucide-react and Testing Library 16 all declare React 19 support.
- `@module-federation/vite` treats React as a regular shared singleton.

The option was "React 19 now" or "after phase 8".

## Decision

Upgrade now, as a separate PR, before phase 4:

- `react` / `react-dom` **^19.3.1** and `@types/react` / `@types/react-dom` **^19.3.0**, set in the pnpm catalog.
- MF `shared` picks the new range up from the catalog via `createMfShared()`. `strictVersion` guarantees that host and remotes run one React 19 instance; a remote built against React 18 fails loudly.
- No code changes were needed:
  - none of the React 18-only APIs are used (`ReactDOM.render`, string refs, `defaultProps` on function components, `propTypes`, `element.ref`);
  - typecheck is clean with the React 19 types.
- New code follows React 19 idioms: `ref` as a prop instead of `forwardRef`, and `<Context>` as the provider. The single existing `forwardRef` (`Button`) goes away in the phase 4 rewrite.

## Consequences

**Pros:**

- Primitives are rewritten once, without `forwardRef`.
- Access to `use`, Actions and `useOptimistic` for later features (watchlist).

**Cons / trade-offs:**

- **Bundle size.** Host JS (gzip, including shared singletons) went from 164 kB to 187.5 kB, mostly the larger `react-dom`. The size budget is recalibrated with the same rule as before: measured size + ~10%, so 205 kB.
- **Suspense siblings.** When a component suspends, React 19 commits the nearest fallback first and only then pre-renders the siblings. Sibling components that each start their own suspense query therefore no longer start fetching in the same render pass. Data for a page is started together instead, with `useSuspenseQueries` or a prefetch in the parent (plan step 6.1). This does not change today's Home, which already waterfalls: five suspense hooks in one component (6.1 fixes that).
- Some third-party React 18-only packages may become unavailable. None are in use now.

## Alternatives considered

- **Stay on React 18 until after phase 8**: means writing `forwardRef` into every primitive now and removing it later.
- **React 19 together with phase 4**: mixes a runtime upgrade with a large UI refactoring, so a regression would be hard to attribute.
