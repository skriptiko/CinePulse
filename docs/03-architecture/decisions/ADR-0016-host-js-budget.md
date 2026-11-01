🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0016: The host JS budget moves to 210 kB

## Status

Accepted (2026-11-01). Follows the note in [ADR-0013](./ADR-0013-firestore-lite-watchlist-store.md) that static growth in a shared package needs a recorded budget move.

## Context

Host JS stood at 207.99 of 208 kB gzip, 15 bytes under the limit. The catalog tasks that come next add endpoints and queries to `@repo/api`, a nav item to `Header` and a search field. Module Federation does not tree-shake a shared module, so everything reachable from `@repo/api` reaches the host chunk, and those tasks would break the limit at once.

A source map of the host build, without the two lazy Firebase chunks, gives 635 kB raw:

| Part | Raw | Share |
| --- | --- | --- |
| `react-dom`, `react`, `scheduler` | 221 kB | 35% |
| `react-router`, with `cookie` and `set-cookie-parser` | 203 kB | 32% |
| Module Federation runtime and SDK | 55 kB | 9% |
| `@tanstack/query-core` and `react-query` | 49 kB | 8% |
| `sonner`, already a lazy chunk | 35 kB | 5% |
| `tailwind-merge` | 28 kB | 4% |
| Our own code in `apps/host` and `packages/*` | 35 kB | 6% |

## Decision

**Raise the host limit from 208 kB to 210 kB and move no code.** The limit stays close to the real size, so it keeps catching a dependency that lands in the shell by accident. Two kilobytes cover the catalog tasks, which are estimated at about 1.5 kB gzip.

## Alternatives considered

- **Move first-party code out of the shell:** it is 6% of the total, most of it runs on the first paint, and a saving there would be gone after one task.
- **Replace `tailwind-merge` with `clsx`:** this saves the most of what remains, but `cn(buttonVariants(...), 'px-0')` relies on the merge across all three apps, and each override would have to be rewritten and checked.
- **Stop sharing `react-router-dom`:** the singleton is what keeps the context of the router in one piece across remotes, so this is not an option.
- **Count `sonner` on its own line:** it would free 10 kB on paper, and nobody would download a byte less.

## Consequences

- `pnpm size` has 2 kB of headroom again. CI only reports it, so the limit is checked by hand before a merge.
- The next move needs a new entry here or a real reduction. `tailwind-merge` is the first candidate.
