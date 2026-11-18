🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0018: Vite 8 takes a newer federation runtime, and the host budget moves to 222 kB

## Status

Accepted (2026-11-18, CIN-121). Moves the limit set in [ADR-0016](./ADR-0016-host-js-budget.md).

## Context

Vite 8 builds with Rolldown instead of Rollup. `@module-federation/vite` 1.11, the line the repo was held on since CIN-80, does not build with it: every app fails with `REQUIRE_TLA`, because the plugin's `loadShare` modules use a top-level `await` and the CommonJS builds of `react-dom` `require()` them. 1.11 also declares `vite <=7.1.7` as its peer, so the repo was already outside its range on Vite 7.3.

Every release from 1.12 declares Vite 8 and builds. It also carries a larger runtime, which is why Renovate was capped below 1.12. Host JS, gzip, with the same code:

| Build | Host JS |
| --- | --- |
| Vite 7, federation 1.11 (before) | 208.2 kB |
| Vite 7, federation 1.24 | 229.3 kB |
| Vite 8, federation 1.24 (now) | 219.9 kB |

Rolldown takes back about 9.4 kB of the 21.1 kB the newer runtime adds. The two lazy Firebase lines do not grow.

## Decision

- **Vite 8, `@vitejs/plugin-react` 6 and `@module-federation/vite` 1.24**, the latest release, pinned to patches (`~1.24.1`) in the catalog.
- **Raise the host limit from 210 kB to 222 kB.** As in ADR-0016, the limit stays about 2 kB above the real size, so it still catches a dependency that lands in the shell by accident.
- **Drop the Renovate cap on `@module-federation/vite`.** `size` is a required check since CIN-117, so an update that grows the host fails on its own PR.
- **Workspace singletons are not pre-bundled.** The plugin now adds every shared key to `optimizeDeps.include`, and the Vite 8 optimizer parses a `.ts` entry as JSX, so `pnpm dev` failed on `@repo/routes`. `scripts/mf-shared.ts` exports `WORKSPACE_SINGLETONS`, and every app passes a copy to `optimizeDeps.exclude`. They are source code, which Vite does not pre-bundle for a linked package anyway.

## Alternatives considered

- **Stay on Vite 7 and federation 1.11:** it keeps 12 kB, but 1.11 is already outside its peer range, and every later Vite and federation update would stay blocked behind it.
- **Free the 12 kB first**, for example by replacing `tailwind-merge`, the first candidate in ADR-0016: it changes `cn()` across all three apps and is a task of its own. It can still bring the limit down later.

## Consequences

- Every visitor downloads about 11.6 kB gzip more JS on the first load.
- `pnpm size` has 2 kB of headroom again. The next move needs a new entry here or a real reduction.
- Vite 8 warns that the configs use features its future native config loader will not support (`__dirname`, an extensionless import of `scripts/mf-shared`, CommonJS `scripts/`). The configs still load with the default loader; this is left for the update that makes the native loader the default.
