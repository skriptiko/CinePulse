# @repo/test-utils

Shared test setup, used only in `devDependencies`.

## Public API

- `renderWithProviders`: renders with a fresh `QueryClient` (`retry: false`) and a `MemoryRouter`, returns `user` and `queryClient`. `createTestQueryClient` builds that client alone.
- `render`, `screen`, `waitFor`, `within`, `fireEvent` from Testing Library.
- `server` and `handlers`: MSW with happy-path TMDB responses. Override per test with `server.use(...)`.
- `buildMovie`, `buildMovieDetails`, `buildTv`, `buildTvDetails`, `buildPersonDetails`, `buildMovieCredit`, `buildTvCredit`, `buildPaginated`: test data.
- `expectNoA11yViolations`: axe check of a container.
- `@repo/test-utils/setup`: a Vitest `setupFiles` entry with DOM matchers, cleanup and the MSW server lifecycle.

Mock the network, not our modules. `@repo/api` cannot use this package, because this package depends on it.

## Dependencies

`@repo/api`, Testing Library, MSW, axe-core.
