🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0006: Testing stack — Vitest 3.2, Testing Library, MSW 3, jsdom

## Status

Accepted (2026-10-29)

## Context

The repo has no tests. Phases 4–6 of the refactoring plan rewrite the data layer (`ApiError`, retry policy, pagination) and the UI models (mappers, formatting), and that code should land with unit tests from the start. The engineering standards (§14) already set the rules for how tests are written. This ADR fixes the tools, versions and layout those rules rely on.

Constraints:

- Vite 5 everywhere. A test runner that requires Vite ≥ 6 would pull a second Vite into the workspace.
- Node 24 in `engines`, `.nvmrc` and CI.
- Solo pet project: free tools only, no paid services, minimal configuration.
- Network is the TMDB proxy at `/api/tmdb/*`. Tests must never reach the real TMDB.

## Decision

| Concern | Choice | Why |
| --- | --- | --- |
| Runner | **Vitest 3.2.x** | Shares the Vite transform pipeline and config style. 3.2 is the last line that supports Vite 5; 4.x+ needs Vite ≥ 6. Upgrade together with Vite. |
| DOM environment | **jsdom** | More complete DOM than happy-dom, and axe-core runs reliably on it. Speed is not a concern at our size. |
| Components | **@testing-library/react 16** + **@testing-library/dom 10** + **@testing-library/user-event 14** + **@testing-library/jest-dom** matchers | Behaviour-first queries (`getByRole`); real event sequences instead of `fireEvent`. |
| Network mocking | **MSW 3.x** (`msw/node`) | Mocks at the request level, so `apiGet`, hooks and `queryOptions` run unmodified. MSW 3 needs Node ≥ 22.12, which Node 24 satisfies. |
| Accessibility | **axe-core** directly, via a small helper in `@repo/test-utils` | No wrapper dependency: `vitest-axe` has had no release since 2025-01, and `jest-axe` targets Jest typings. Only structural rules; `color-contrast` does not work in jsdom. |
| Coverage | **@vitest/coverage-v8 3.2.x**, at the repo root only | Native, no instrumentation step. An explicit `coverage.include` is required, otherwise v8 only counts the files that were loaded. |
| E2E | **Playwright** (chromium only), later | Not part of the first rollout. Added once the critical paths from §14.5 are stable; it runs on the merged `dist/` served by the Firebase hosting emulator. |

### Layout and running

- **One root run.** A root `vitest.config.ts` with `test.projects` covers `packages/*` and `apps/*`. `pnpm test` (`vitest run`) runs everything, and coverage is collected and merged in that single run. We do not add a Turbo `test` task: per-package caching is not worth a second way of running tests at this size.
- Each project has its own small `vitest.config.ts` (environment, setup files). Pure-logic packages (`@repo/routes`, `@repo/events`) use the `node` environment. React packages, apps and anything that calls `fetch` with a relative URL use jsdom through `scripts/vitest-jsdom-environment.ts`.
  - That environment is plain jsdom, except that Node's fetch-stack globals are kept (`fetch`, `Request`, `Response`, `Headers`, `AbortController`, `AbortSignal`, streams, `Blob`…).
  - Without this, Node's `fetch` (undici) rejects jsdom's `AbortSignal`, and every MSW-backed request fails. It is the same approach as `jest-fixed-jsdom`.
- Tests live in `__tests__/` next to the code, named `<name>.test.ts(x)` (kebab-case). E2E specs go in the root `e2e/` folder as `<scenario>.spec.ts`.
- Shared infrastructure goes in **`@repo/test-utils`** (a devDependency of the projects that use it). `@repo/api` is the one exception: `@repo/test-utils` depends on it for DTO types, so `@repo/api` cannot use it back without a dependency cycle, which Turbo rejects. Its few transport tests create their own `setupServer()` from `msw/node`.
  - `renderWithProviders`: a fresh `QueryClient` per test with `retry: false`, a router, and a `userEvent.setup({ advanceTimers })` instance;
  - MSW `server` with handlers grouped by domain;
  - fixture factories (`buildMovie`, `buildPaginated`) typed with the TMDB DTO types;
  - the axe helper.
- Versions of `vitest`, `@vitest/coverage-v8`, `msw`, `jsdom` and the Testing Library packages live in the pnpm catalog.
- CI: `pnpm test` is a step of the `quality` job. Coverage runs locally with `pnpm test:coverage`, and only produces a report.
- MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`; the server uses `onUnhandledFrame: 'error'`.

## Consequences

**Pros:**

- One runner and one config style shared with the build. No Babel or Jest transform layer.
- Network-level mocks keep the tests honest: our own modules are never mocked (`vi.mock` of `@repo/api` is forbidden by §14.4).
- No new runtime dependencies; everything is a devDependency.

**Cons / trade-offs:**

- Vitest is pinned to 3.2 until the Vite upgrade. Renovate will propose majors; they wait for approval on the Dependency Dashboard.
- jsdom is slower than happy-dom. That is acceptable at our size; revisit if the suite gets noticeably slow.
- We maintain one small custom environment file. Remove it once jsdom and undici agree on `AbortSignal`.
- `pnpm install` warns about two optional peers: `@vitest/mocker` wants `msw@^2`, which only matters for browser mode, and `msw@3` wants `vite@>=6`, which only matters for its Vite plugin. Neither is used here.
- A single root run gives up Turbo caching for tests.
- Playwright and its emulator setup are deferred, so the cross-MFE paths stay manually verified until then.

## Alternatives considered

- **Jest**: needs a separate transform (Babel or ts-jest) and ESM workarounds, and duplicates the Vite config. Rejected.
- **Vitest 4/5**: requires Vite ≥ 6. It comes with the Vite upgrade, not before.
- **happy-dom**: faster, but has DOM gaps and is less reliable with axe-core.
- **Vitest browser mode**: closer to reality, but needs Playwright or WebdriverIO browsers in CI from day one. Too heavy for the first step.
- **Turbo `test` task per package**: caching benefits are negligible here, and it splits coverage across packages.
