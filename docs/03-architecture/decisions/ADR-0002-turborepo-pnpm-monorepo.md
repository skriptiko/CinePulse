🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0002: Turborepo + pnpm workspaces monorepo

## Status

Accepted

## Context

The project consists of three apps (host, pages-mfe, user-mfe), several shared packages (`@repo/api`, `@repo/ui`, `@repo/events`, `@repo/routes`, `@repo/typescript-config`) and Firebase Functions. These parts are tightly coupled (shared types, UI, data layer) and must be versioned together. Publishing the shared packages to an external registry is not worth it.

## Decision

We chose a **monorepo on pnpm workspaces + Turborepo**:

- Workspace boundaries are in `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `functions`.
- Shared packages are consumed as `@repo/*` without publishing (workspace protocol).
- Task orchestration is in `turbo.json`: `build` (`dependsOn: ["^build"]` graph, cached in `dist/**`), `dev` (persistent, no cache), `lint`, `typecheck`, `sync-types` (after `build`, generates remote types in the host).
- The package manager is pinned: `pnpm@9.15.4`, Node `>=20`.

## Consequences

**Pros:**
- Atomic changes across apps and packages in one commit/PR.
- Turbo caching and incremental builds speed up CI and local work.
- A single point of configuration for TypeScript (`@repo/typescript-config`) and linting (Biome).

**Cons / trade-offs:**
- Requires discipline in dependencies between packages to avoid cycles.
- The Turbo cache needs correctly declared `outputs`/`dependsOn`, otherwise stale artifacts are possible.
- One large repository makes it harder to separate access rights between teams (compared to a polyrepo).
