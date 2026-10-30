# @repo/test-utils

Shared test setup, used only in `devDependencies`.

## Public API

- `renderWithProviders`: renders with a fresh `QueryClient` (`retry: false`) and a `MemoryRouter`, returns `user`.
- `render`, `screen`, `waitFor`, `within` from Testing Library.
- `server` and `handlers`: MSW with happy-path TMDB responses. Override per test with `server.use(...)`.
- `buildMovie`, `buildTv`, `buildPaginated`: test data.
- `expectNoA11yViolations`: axe check of a container.

Mock the network, not our modules. `@repo/api` cannot use this package, because this package depends on it.

## Dependencies

`@repo/api`, Testing Library, MSW, axe-core.
