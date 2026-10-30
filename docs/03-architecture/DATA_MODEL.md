🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Data model

> **Important:** CinePulse **has no database of its own**. It is a client app on top of the [TMDB API](https://developer.themoviedb.org/). The "data model" here means the TypeScript types that describe TMDB responses (`packages/api/src/types/*`) and the app's client state (`packages/events/src/types.ts`). The only persistent secret storage is `TMDB_API_READ_TOKEN` (Firebase Secret).
>
> ➕ **Changing (requirements 2026-07-12):** the formalized scope adds a **watchlist**, which needs **its own database (Firestore)**; it will be the first persistent store of user data. The planned model is below, in [Planned model: Watchlist](#-planned-model-watchlist-firestore).

All types are re-exported from `@repo/api` (`packages/api/src/index.ts`) and `@repo/events`.

## Pagination wrapper

TMDB list responses are wrapped in a generic (`packages/api/src/types/common.ts`):

```ts
type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

type PageParams = { page?: number }; // request params of every list, no index signature
```

The next page comes from the shared `getNextPageParam` (`core/pagination.ts`): `page + 1` while `page < min(total_pages, 500)`, otherwise `undefined`. `ProductionCompany` is one type in `types/common.ts`, used by both movie and TV details.

## Domain: Movies

### `Movie` (`types/movie.ts`) — list item

| Field | Type | Notes |
|------|-----|---------|
| `id` | `number` | TMDB ID |
| `title` / `original_title` | `string` | Title / original title |
| `overview` | `string` | Description |
| `poster_path` / `backdrop_path` | `string \| null` | Relative paths; full URL via `getImageUrl()` |
| `release_date` | `string` | ISO date |
| `vote_average` / `vote_count` | `number` | Rating / vote count |
| `popularity` | `number` | |
| `adult` / `video` | `boolean` | |
| `genre_ids` | `number[]` | Genre IDs (mapped to `Genre.name`) |
| `original_language` | `string` | |

### `MovieDetails` (`types/movie.ts`) — details page

Extends `Movie` (without `genre_ids`) and adds: `genres: Genre[]`, `budget`, `revenue`, `runtime: number | null`, `status`, `tagline`, `homepage`, `imdb_id`, `production_companies: ProductionCompany[]`, `production_countries: ProductionCountry[]`, `spoken_languages: SpokenLanguage[]`, `belongs_to_collection: Collection | null`.

Helper types: `ProductionCompany`, `ProductionCountry`, `SpokenLanguage`, `Collection`.

## Domain: TV shows

### `TV` (`types/tv.ts`) — list item

Same as `Movie`, with TV specifics: `name` / `original_name` instead of `title`, `first_air_date` instead of `release_date`, `origin_country: string[]`.

### `TVDetails` (`types/tv.ts`)

Extends `TV` (without `genre_ids`) and adds: `genres`, `created_by: Creator[]`, `episode_run_time: number[]`, `in_production`, `languages`, `last_air_date`, `last_episode_to_air` / `next_episode_to_air: Episode | null`, `networks: Network[]`, `number_of_episodes`, `number_of_seasons`, `seasons: Season[]`, `status`, `tagline`, `type`.

Helper types: `Creator`, `Episode`, `Network`, `Season`, `ProductionCompany`.

## Domain: People

### `Person` (`types/person.ts`) — list item

`id`, `name`, `original_name`, `profile_path`, `adult`, `popularity`, `gender`, `known_for_department`, `known_for: KnownFor[]`.

`KnownFor` is a unified movie/TV item with `media_type: 'movie' | 'tv'`.

### `PersonDetails` (`types/person.ts`)

`biography`, `birthday`, `deathday`, `homepage`, `imdb_id`, `place_of_birth`, `also_known_as: string[]`, `profile_path`, `gender`, `known_for_department`, etc.

## Domain: Genres

`Genre = { id: number; name: string }`; `GenresResponse = { genres: Genre[] }` (`types/genre.ts`). A movie list contains only `genre_ids`, so the UI maps them to names using the `getMovieGenres()` response (as `Home.tsx` and `Movies.tsx` do).

## Domain: Trending and Search (unified types)

Trending and multi-search return mixed items, discriminated by the `media_type` field (`types/trending.ts`, `types/search.ts`):

```ts
type MediaType = 'movie' | 'tv' | 'person' | 'all';
type TimeWindow = 'day' | 'week';

type TrendingItem  = TrendingMovie | TrendingTV | TrendingPerson; // Movie/TV/Person & { media_type }
type MultiSearchResult = SearchMovie | SearchTV | SearchPerson; // SearchMovie = TrendingMovie, etc.
```

The `media_type` discriminant lets code narrow the type at runtime (e.g. `Home.tsx` filters `media_type === 'movie'`).

## Client state: Global Store

The only source of client state outside React Query is the global store (`packages/events/src/store.ts`), a singleton on `window.__CINEPULSE_STORE__`. It is a Zustand store ([ADR-0008](./decisions/ADR-0008-zustand-global-store.md)).

### `GlobalState` (`packages/events/src/store.ts`)

```ts
const THEMES = ['light', 'dark', 'system'] as const;
type Theme = (typeof THEMES)[number];

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
type AuthUser = { uid: string; displayName: string | null; email: string | null; photoUrl: string | null };

type GlobalState = { theme: Theme; user: AuthUser | null; authStatus: AuthStatus }; // defaults: 'dark', null, 'anonymous'
type GlobalActions = { setTheme: (theme: Theme) => void; setUser: (user: AuthUser | null) => void };
type GlobalStore = GlobalState & GlobalActions;
```

**API:**

- `globalStore` — the Zustand `StoreApi<GlobalStore>` (`getState`, `setState`, `subscribe`), for code outside React.
- `useGlobalStore(selector)` — React hook; the component re-renders when the selected value changes. The selector must return a stable value; wrap a selector that builds an object or array in `useShallow`.
- `getGlobalStore()` / `createGlobalStore()` — the shared instance and a fresh one (tests).

> `user` and `authStatus` are written only by `@repo/firebase`. `authStatus` is `loading` while a known session is restored, so protected pages neither flash nor redirect.

## Watchlist (Firestore)

> Rules are in `firestore/firestore.rules`, tested with `pnpm test:rules`. The UI is not implemented yet. Reasoning and trade-offs: [ADR-0010](./decisions/ADR-0010-firebase-auth-firestore-watchlist.md).

```ts
type WatchStatus = 'watched' | 'planned';

// users/{uid}/folders/{folderId}
interface WatchlistFolder {
  name: string; // 1–100 characters
  parentId: string | null; // null = root
  depth: number; // 1–6, parent's depth + 1
  createdAt: Timestamp;
}

// users/{uid}/items/{mediaType}_{tmdbId}
interface WatchlistItem {
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  title: string; // copied from TMDB
  posterPath: string | null; // copied from TMDB
  status: WatchStatus;
  folderIds: string[]; // up to 100; a title can be in several folders
  addedAt: Timestamp;
}
```

- **Moving a branch:** one batch updates `parentId` on its root and `depth` on every descendant. The client checks for moves into the folder's own branch and past level 6.
- **Access:** only the signed-in owner reads and writes `users/{uid}/**`; everything else is denied.

## Event contract: `EventMap`

The typed event dictionary of the event bus (`packages/events/src/types.ts`):

| Event | Payload |
|-------|---------|
| `notification:show` | `NotificationPayload { type, message, duration? }` |
| `mfe:error` | `MfeErrorPayload { name; error: SerializedError }` |
| `error:report` | `ErrorReportPayload { error: unknown; source: 'boundary' \| 'query' \| 'mutation' \| 'window' \| 'auth' }` |
| `user:login` | `UserLoginPayload { user: AuthUser }` |
| `user:logout` | `UserLogoutPayload { uid: string }` |

`NotificationPayload.type` ∈ `'success' | 'error' | 'warning' | 'info'`. Event names are typed as ``EventKey = `${EventDomain}:${string}` ``, so a key outside the `domain:action` format fails `tsc`. `mfe:error` carries plain data (`serializeError(error)` → `{ name, message }`); `error:report` keeps the original error because the host listener filters reports by `ApiError` kind. `error:report` is emitted by boundaries, `QueryCache`/`MutationCache` and the host's window handlers, and has one listener in the host; `notification:show` is emitted by `QueryCache.onError` and shown as a toast by the host; `mfe:error` is emitted when a remote fails to load. `user:login` / `user:logout` are emitted by `@repo/firebase` when the signed-in user changes, including a restored session. The former `navigation:change` and `mfe:ready` events had no emitters or listeners and were removed.

## Images

Size types (`packages/api/src/core/config.ts`): `ImageSize`, `BackdropSize`, `ProfileSize`. `getImageUrl(path, size)` (`core/utils.ts`) builds the full URL from `TMDB_IMAGE_BASE_URL`. A `null` path returns `null` (components show a placeholder).
