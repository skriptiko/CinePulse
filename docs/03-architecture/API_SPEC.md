🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# `@repo/api` specification

`@repo/api` is the only way to TMDB data. Layers, in the order a request passes them:

1. `types/` — TMDB response shapes as they are.
2. `endpoints/<domain>.ts` — plain async functions over `apiGet`, no React.
3. `queries/<domain>.ts` — `queryOptions` / `infiniteQueryOptions` factories: key, `queryFn` and cache options in one place.
4. Components call `useSuspenseQuery(movieQueries.detail(id))` (or `useSuspenseQueries`, `prefetchQuery`) with a factory directly. `hooks/` keeps only hooks that add logic: `useMoviesOrSearch`.

The public API is `packages/api/src/index.ts`. It exports the factories, `useMoviesOrSearch`, `createQueryClient`, `ApiProvider`, the error guards, image helpers and types. `apiGet` and the endpoint functions are internal.

## Transport and security

- The base path is the **relative** `/api/tmdb` (`API_CONFIG.PROXY_BASE_URL`, `core/config.ts`). The client never sees the TMDB token.
- `apiGet<T>(endpoint, { params, signal })` (`core/client.ts`) builds the URL and calls `fetch`. Every endpoint takes `{ signal }` as its last argument, and every `queryFn` passes the TanStack `signal` through.
- `buildQueryString()` serializes only defined params (`core/utils.ts`).
- Proxy routing: in dev, Vite `server.proxy`; in production, the Firebase Function `tmdbProxy`. Both add `Authorization: Bearer <TMDB_API_READ_TOKEN>` (see [ADR-0003](./decisions/ADR-0003-tmdb-proxy.md)).

## Errors

`apiGet` rejects with one class, `ApiError(kind, message, { status, cause })` (`core/errors.ts`). The original error is kept in `cause`.

| `kind` | When | `status` | Retried |
|---|---|---|---|
| `network` | `fetch` itself failed (offline, DNS, CORS) | — | yes |
| `not_found` | HTTP 404 | 404 | no |
| `server` | HTTP 5xx or 429 | yes | yes |
| `client` | any other non-OK status (a bug in params or proxy config) | yes | no |
| `validation` | the body is not valid JSON | response status | no |

- **Abort** (`name === 'AbortError'`, or the request's `signal` is aborted) is rethrown unchanged, never wrapped, and never retried.
- Guards: `isApiError` (checks `name`, so it works across MFE bundles), `isNotFound`, `isAbortError`.
- The transport shows no UI and emits no events. `createQueryClient` reports every failed query (`error:report`) and asks for a toast (`notification:show`) only over existing data, never for a 404 or a query with `meta.inlineErrors`. `meta.errorMessage` overrides the text; otherwise `getErrorMessage(error)` (`core/error-message.ts`) gives a plain message per `kind`.
- `Register { defaultError: unknown }` (`query-client/register.ts`): `error` from a query is `unknown` and is narrowed with `isApiError`, because it can also be a programming error.

## QueryClient

`createQueryClient()` (`query-client/create-query-client.ts`) builds the app's only client:

- `staleTime` = `STALE_TIME_DEFAULT_MS` (5 min); `refetchOnWindowFocus: false`.
- `retry: shouldRetry`: only `network` and `server` errors, at most `MAX_RETRIES` (2) times, with TanStack's default exponential backoff.

`ApiProvider` creates the client once and renders `QueryClientProvider`. It wraps the host (`apps/host/src/main.tsx`) and each remote's standalone `main.tsx` only. Integrated remote routes never add a provider: `@tanstack/react-query` is a shared singleton, so a nested provider would hide the host's cache.

## Suspense and pagination

Pages use the suspense hooks, so every page needs a `Suspense` boundary. Several independent queries in one component go through `useSuspenseQueries` so they start together (Home does this).

Infinite queries use `initialPageParam: 1` and the shared `getNextPageParam` (`core/pagination.ts`), which ends the list at `min(total_pages, TMDB_MAX_PAGES)`; TMDB serves at most 500 pages. `row()` factories fetch only the first page with a plain query, for content rows.

## Query factories

Paths are relative to the proxy base `/api/tmdb`. Keys follow `all → lists / details → list(…) / detail(id)`, so any level can be invalidated.

| Factory | Key | HTTP | Data |
|---|---|---|---|
| `movieQueries.list(category)` (infinite) | `['movies', 'list', category]` | `GET /movie/{category}` | `PaginatedResponse<Movie>` |
| `movieQueries.discover({ genreId, sortBy })` (infinite) | `['movies', 'list', 'discover', { genreId, sortBy }]` | `GET /discover/movie?sort_by&with_genres&page` | `PaginatedResponse<Movie>` |
| `movieQueries.row(category)` | `['movies', 'list', category, 'first-page']` | `GET /movie/{category}?page=1` | `PaginatedResponse<Movie>` |
| `movieQueries.detail(id)` | `['movies', 'detail', id]` | `GET /movie/{id}` | `MovieDetails` |
| `tvQueries.list(category)` / `.row(category)` / `.detail(id)` | `['tv', …]` | `GET /tv/{category}`, `GET /tv/{id}` | `PaginatedResponse<TV>`, `TVDetails` |
| `trendingQueries.list(mediaType, timeWindow)` / `.row(…)` | `['trending', 'list', mediaType, timeWindow]` | `GET /trending/{mediaType}/{timeWindow}` | `PaginatedResponse<TrendingItem>` |
| `searchQueries.multi/movies/tv/person(query)` (infinite) | `['search', type, query]` | `GET /search/{multi,movie,tv,person}` | `PaginatedResponse<…>` |
| `genreQueries.movie()` / `.tv()` | `['genres', 'movie' \| 'tv']` | `GET /genre/{movie,tv}/list` | `GenresResponse`, `staleTime: Infinity` |
| `personQueries.detail(id)` | `['person', 'detail', id]` | `GET /person/{id}` | `PersonDetails` |

`DEFAULT_DISCOVER_FILTERS` (`{ genreId: null, sortBy: 'popularity.desc' }`) is the unfiltered Movies view; the header prefetches it (and the genres) after 200 ms of hover or focus on the Movies link. `sortBy` (`DiscoverSortBy`) is `popularity.desc | primary_release_date.desc | vote_average.desc`; `genreId: null` omits `with_genres`. `vote_average.desc` also sends `vote_count.gte=200` (`DISCOVER_MIN_VOTE_COUNT`) and `primary_release_date.desc` sends `primary_release_date.lte=<today, UTC>`, so both sorts skip unrated and unreleased films. The proxy allowlist (`functions/src/proxy-rules.ts`) accepts exactly these params on `/discover/movie` and rejects anything else with 400.

`movieQueries.discover` and `searchQueries.movies` set `meta: { inlineErrors: true }`: the Movies page shows a failed next page inline, so `QueryCache.onError` shows no toast.

`category` is `popular | top_rated | upcoming | now_playing` for movies and `popular | top_rated | on_the_air | airing_today` for TV; `mediaType` is `movie | tv | person | all`, `timeWindow` is `day | week`.

`useMoviesOrSearch(query, { genreId, sortBy })` switches between `searchQueries.movies(query)` and `movieQueries.discover({ genreId, sortBy })` inside one infinite query, using their keys, so the cache is shared. A non-empty `query` wins and the filters are ignored: TMDB search has no genre or sort.

## Images

`getImageUrl(path, size)` (`core/utils.ts`) builds an absolute `image.tmdb.org` URL for an `ImageSize` / `BackdropSize` / `ProfileSize`. It returns `null` when the path is `null` or `undefined`. Card and backdrop sizes are the `POSTER_SIZE_CARD`, `BACKDROP_SIZE_FEATURED` and `BACKDROP_SIZE_HERO` constants.

## API coverage vs UI

| Factory | Used in UI | Where / planned page |
|-----|:---:|-----------------------|
| `movieQueries.row` | ✅ | Home (rows) |
| `movieQueries.discover`, `searchQueries.movies` | ✅ | Movies, through `useMoviesOrSearch` (genre, sort and search from the URL) |
| `movieQueries.list` | ⬜ | not used since Movies moved to `discover`; kept for category pages |
| `trendingQueries.row` | ✅ | Home (Hero + Trending) |
| `genreQueries.movie` | ✅ | Home, Movies (genre pills, prefetched next to the list) |
| `movieQueries.detail` | ⬜ | **Movie Detail** `/movies/:id` |
| `tvQueries.*`, `genreQueries.tv` | ⬜ | **TV** `/tv`, `/tv/:id` |
| `searchQueries.multi/tv/person` | ⬜ | **Search** `/search` |
| `personQueries.detail` | ⬜ | **Person** `/person/:id` |
