🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0005: Biome instead of ESLint + Prettier

## Status

Accepted

## Context

The monorepo needs static analysis and formatting for TypeScript/React code across several apps and packages. The traditional ESLint + Prettier stack requires separate configs, plugins and rules kept in sync with each other, and it noticeably slows down linting on a large codebase.

## Decision

We chose **Biome** (`@biomejs/biome`, `biome.json`) as the single tool for linting and formatting:

- One config, `biome.json`: `organizeImports`, the linter (recommended + custom rules: `noUnusedImports`/`noUnusedVariables` = error, `noExplicitAny` = warn, `useConst` = error, `noNonNullAssertion` = warn), the formatter (2 spaces, width 100, single quotes, semicolons, ES5 trailing commas).
- Scripts: `pnpm lint` (via Turbo), `pnpm format`, `pnpm check` (with autofix).
- **Pre-commit** — Husky (`.husky/pre-commit`) runs `lint-staged`, which runs `biome check` on staged files.

## Consequences

**Pros:**
- One tool and one config instead of ESLint + Prettier + plugins.
- Much faster linting/formatting (Rust engine).
- The same rules for the whole monorepo, autofix on commit.

**Cons / trade-offs:**
- A smaller ecosystem of rules/plugins than ESLint (some specific rules may be missing).
- Part of the team/tooling may be less familiar with Biome.
- **Quality gate is local only:** `biome check` runs on pre-commit but **not** yet in CI, so the deploy pipeline does not block merges on lint errors (see the roadmap, Phase 6, "Next steps" #2).
