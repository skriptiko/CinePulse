🔗 Частина роадмапи: [Етап 3 — Архітектура](../00-roadmap/PROJECT_ROADMAP.md#етап-3-архітектура)

# Специфікація API-шару (`@repo/api`)

`@repo/api` — єдина точка доступу до даних TMDB. Складові: клієнт (`core/`), endpoints (`endpoints/`), React Query хуки (`hooks/`), типи (`types/`), ключі кешу (`queries/keys.ts`), провайдер (`provider/ApiProvider.tsx`). Публічний API — `packages/api/src/index.ts`.

## Транспорт і безпека

- Базовий шлях — **відносний** `/api/tmdb` (`API_CONFIG.PROXY_BASE_URL`, `core/config.ts`). Клієнт **ніколи** не бачить TMDB-токен.
- `apiGet<T>(endpoint, { params, signal })` (`core/client.ts`) будує URL, робить `fetch`, підтримує `AbortSignal`.
- `buildQueryString()` серіалізує лише визначені параметри (`core/utils.ts`).
- Маршрутизація проксі: dev — Vite `server.proxy`; prod — Firebase Function `tmdbProxy`. Обидва додають `Authorization: Bearer <TMDB_API_READ_TOKEN>` (див. [ADR-0003](./decisions/ADR-0003-tmdb-proxy.md)).

## Обробка помилок

`ApiError extends Error` з полями `status`, `statusText`, `isNetworkError` (`core/client.ts`):

- **Не-OK відповідь** → кидається `ApiError`. Для «глобальних» помилок (`status >= 500` або `status === 0`) додатково емітиться подія `notification:show` (`type: 'error'`).
- **Мережева помилка** → `ApiError('Network error', 0, ...)` + `notification:show`.
- **Abort** (`DOMException` `AbortError`) — прокидається далі без нотифікації.

## Режим React Query (Suspense)

Усі хуки — **суспенсні**: `useSuspenseQuery` (деталі) або `useSuspenseInfiniteQuery` (списки/пошук). Пагінація: `initialPageParam: 1`, `getNextPageParam` за `page < total_pages`.

**QueryClient** (`packages/ui/src/components/providers.tsx`): `staleTime` = 5 хв, `retry` = 1, `refetchOnWindowFocus` = false. Ключі кешу — централізовано в `queryKeys` (`queries/keys.ts`).

## Endpoints і хуки

Усі шляхи наведені відносно проксі-бази `/api/tmdb`.

### Фільми (`endpoints/movies.ts`, `hooks/useMovies.ts`)

| Функція / хук | HTTP | Параметри | Відповідь |
|---------------|------|-----------|-----------|
| `getMovies(category, params)` / `useMovies(category)` | `GET /movie/{category}` | `category` ∈ `popular\|top_rated\|upcoming\|now_playing`; `page?` | `PaginatedResponse<Movie>` (infinite) |
| `getMovieDetails(id)` / `useMovieDetails(id)` | `GET /movie/{id}` | `id: number` | `MovieDetails` |

### Серіали (`endpoints/tv.ts`, `hooks/useTV.ts`)

| Функція / хук | HTTP | Параметри | Відповідь |
|---------------|------|-----------|-----------|
| `getTVShows(category, params)` / `useTVShows(category)` | `GET /tv/{category}` | `category` ∈ `popular\|top_rated\|on_the_air\|airing_today`; `page?` | `PaginatedResponse<TV>` (infinite) |
| `getTVDetails(id)` / `useTVDetails(id)` | `GET /tv/{id}` | `id: number` | `TVDetails` |

### Trending (`endpoints/trending.ts`, `hooks/useTrending.ts`)

| Функція / хук | HTTP | Параметри | Відповідь |
|---------------|------|-----------|-----------|
| `getTrending(mediaType, timeWindow, params)` / `useTrending(mediaType, timeWindow)` | `GET /trending/{mediaType}/{timeWindow}` | `mediaType` ∈ `movie\|tv\|person\|all`; `timeWindow` ∈ `day\|week`; `page?` | `PaginatedResponse<TrendingItem>` |

### Пошук (`endpoints/search.ts`, `hooks/useSearch.ts`)

| Функція / хук | HTTP | Параметри | Відповідь |
|---------------|------|-----------|-----------|
| `searchMulti` / `useSearchMulti(query)` | `GET /search/multi` | `query`, `page?` | `PaginatedResponse<MultiSearchResult>` (infinite) |
| `searchMovies` / `useSearchMovies(query)` | `GET /search/movie` | `query`, `page?` | `PaginatedResponse<Movie>` (infinite) |
| `searchTV` / `useSearchTV(query)` | `GET /search/tv` | `query`, `page?` | `PaginatedResponse<TV>` (infinite) |
| `searchPerson` / `useSearchPerson(query)` | `GET /search/person` | `query`, `page?` | `PaginatedResponse<Person>` (infinite) |

### Жанри (`endpoints/genres.ts`, `hooks/useGenres.ts`)

| Функція / хук | HTTP | Відповідь |
|---------------|------|-----------|
| `getMovieGenres` / `useMovieGenres()` | `GET /genre/movie/list` | `GenresResponse` |
| `getTVGenres` / `useTVGenres()` | `GET /genre/tv/list` | `GenresResponse` |

### Персони (`endpoints/person.ts`, `hooks/usePerson.ts`)

| Функція / хук | HTTP | Параметри | Відповідь |
|---------------|------|-----------|-----------|
| `getPersonDetails(id)` / `usePersonDetails(id)` | `GET /person/{id}` | `id: number` | `PersonDetails` |

## Зображення

`getImageUrl(path, size)` (`core/utils.ts`) будує абсолютний URL до `image.tmdb.org` за `ImageSize`/`BackdropSize`/`ProfileSize`. Повертає `null`, якщо шлях `null`/`undefined`.

## Покриття API vs використання в UI

Показує, наскільки багатий шар даних випереджає реалізовані сторінки — і прямо мапиться на план розробки ([каталог сторінок](../00-roadmap/PROJECT_ROADMAP.md#каталог-сторінок-і-план-розробки)).

| Хук | Задіяний у UI? | Де / під яку сторінку |
|-----|:---:|-----------------------|
| `useMovies` | ✅ | `Home.tsx`, `Movies.tsx` |
| `useTrending` | ✅ | `Home.tsx` (Hero + Trending) |
| `useMovieGenres` | ✅ | `Home.tsx`, `Movies.tsx` (пілюлі жанрів) |
| `useSearchMovies` | ✅ | `Movies.tsx` (пошук) |
| `useMovieDetails` | ⬜ | готовий → сторінка **Movie Detail** `/movies/:id` |
| `useTVShows` / `useTVDetails` | ⬜ | готові → сторінки **TV** `/tv`, `/tv/:id` |
| `useTVGenres` | ⬜ | готовий → фільтри на TV-сторінках |
| `useSearchMulti` / `useSearchTV` / `useSearchPerson` | ⬜ | готові → окрема **Search** `/search` |
| `usePersonDetails` | ⬜ | готовий → сторінка **Person** `/person/:id` |

**Висновок:** ~4 з 12 хуків задіяні; решта — готовий інструментарій під заплановані сторінки. Додавання нових сторінок здебільшого не потребує роботи на шарі даних.

## `ApiProvider`

`provider/ApiProvider.tsx` експонується (`ApiProvider`, `ApiProviderProps`) як альтернатива/доповнення до `Providers` з `@repo/ui`. У поточній композиції `QueryClientProvider` надається через `@repo/ui` `Providers` у `main.tsx` кожного застосунку.
