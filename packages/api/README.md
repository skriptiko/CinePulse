# @repo/api

The TMDB client and the app's `QueryClient`. Requests go to the relative `/api/tmdb/*`, so the token never reaches the browser.

## Public API

- **Query factories:** `movieQueries`, `tvQueries`, `personQueries`, `genreQueries`, `searchQueries`, `trendingQueries`. Pass them to `useSuspenseQuery` and friends.
- **Hooks:** `useMoviesOrSearch` and `useTVOrSearch`, for the one query that switches between discover and search.
- **Client:** `ApiProvider`, `createQueryClient`, `shouldRetry`.
- **Errors:** `ApiError` with a `kind`, `isApiError`, `isNotFound`, `isAbortError`, `toHttpError`, `getErrorMessage`.
- **Images:** `getImageUrl` and the size constants.
- **Types:** TMDB responses, such as `Movie`, `TV`, `Person`, `PaginatedResponse`.

```tsx
import { movieQueries } from '@repo/api';
import { useSuspenseQuery } from '@tanstack/react-query';

const { data } = useSuspenseQuery(movieQueries.detail(id));
```

`movieQueries.detail` and `tvQueries.detail` bring every section of the page in one request, through `append_to_response`. The proxy accepts only that exact string, so `DETAIL_APPEND` in `core/config.ts` and in `functions/src/proxy-rules.ts` change together (ADR-0017).

## Dependencies

`@repo/events` for error reports and toasts. `react` and `@tanstack/react-query` are peers. It must not depend on `@repo/test-utils`, which depends on it.

A new endpoint also goes into the allowlist in `functions/src/proxy-rules.ts`.
