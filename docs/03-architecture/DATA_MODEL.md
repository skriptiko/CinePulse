🔗 Частина роадмапи: [Етап 3 — Архітектура](../00-roadmap/PROJECT_ROADMAP.md#етап-3-архітектура)

# Модель даних

> **Важливо:** CinePulse **не має власної бази даних**. Це клієнтський застосунок поверх [TMDB API](https://developer.themoviedb.org/). «Модель даних» тут — це TypeScript-типи, що описують відповіді TMDB (`packages/api/src/types/*`) та клієнтський стан застосунку (`packages/events/src/types.ts`). Єдине персистентне сховище секретів — `TMDB_API_READ_TOKEN` (Firebase Secret).
>
> ➕ **Змінюється (вимоги 2026-07-12):** формалізований скоуп додає **watchlist**, який потребує **власної БД (Firestore)** — це буде перше персистентне сховище користувацьких даних. Планована модель — нижче, у розділі [«Планована модель: Watchlist»](#-планована-модель-watchlist-firestore).

Усі типи реекспортуються з `@repo/api` (`packages/api/src/index.ts`) і `@repo/events`.

## Оболонка пагінації

Списковi відповіді TMDB загорнуті в дженерик (`packages/api/src/types/common.ts`):

```ts
interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
```

Пагінація в хуках рахується як `page < total_pages ? page + 1 : undefined`.

## Домен: Фільми

### `Movie` (`types/movie.ts`) — елемент списку

| Поле | Тип | Нотатки |
|------|-----|---------|
| `id` | `number` | Ідентифікатор TMDB |
| `title` / `original_title` | `string` | Назва / оригінальна назва |
| `overview` | `string` | Опис |
| `poster_path` / `backdrop_path` | `string \| null` | Відносні шляхи; повний URL через `getImageUrl()` |
| `release_date` | `string` | ISO-дата |
| `vote_average` / `vote_count` | `number` | Рейтинг / кількість голосів |
| `popularity` | `number` | |
| `adult` / `video` | `boolean` | |
| `genre_ids` | `number[]` | ID жанрів (мапляться на `Genre.name`) |
| `original_language` | `string` | |

### `MovieDetails` (`types/movie.ts`) — сторінка деталей

Розширює `Movie` (без `genre_ids`) і додає: `genres: Genre[]`, `budget`, `revenue`, `runtime: number | null`, `status`, `tagline`, `homepage`, `imdb_id`, `production_companies: ProductionCompany[]`, `production_countries: ProductionCountry[]`, `spoken_languages: SpokenLanguage[]`, `belongs_to_collection: Collection | null`.

Допоміжні типи: `ProductionCompany`, `ProductionCountry`, `SpokenLanguage`, `Collection`.

## Домен: Серіали (TV)

### `TV` (`types/tv.ts`) — елемент списку

Аналог `Movie`, але зі специфікою серіалів: `name` / `original_name` замість `title`, `first_air_date` замість `release_date`, `origin_country: string[]`.

### `TVDetails` (`types/tv.ts`)

Розширює `TV` (без `genre_ids`) і додає: `genres`, `created_by: Creator[]`, `episode_run_time: number[]`, `in_production`, `languages`, `last_air_date`, `last_episode_to_air` / `next_episode_to_air: Episode | null`, `networks: Network[]`, `number_of_episodes`, `number_of_seasons`, `seasons: Season[]`, `status`, `tagline`, `type`.

Допоміжні типи: `Creator`, `Episode`, `Network`, `Season`, `ProductionCompany`.

## Домен: Персони

### `Person` (`types/person.ts`) — елемент списку

`id`, `name`, `original_name`, `profile_path`, `adult`, `popularity`, `gender`, `known_for_department`, `known_for: KnownFor[]`.

`KnownFor` — уніфікований елемент фільму/серіалу з `media_type: 'movie' | 'tv'`.

### `PersonDetails` (`types/person.ts`)

`biography`, `birthday`, `deathday`, `homepage`, `imdb_id`, `place_of_birth`, `also_known_as: string[]`, `profile_path`, `gender`, `known_for_department` тощо.

## Домен: Жанри

`Genre = { id: number; name: string }`; `GenresResponse = { genres: Genre[] }` (`types/genre.ts`). Список фільмів містить лише `genre_ids`, тож UI зіставляє їх із назвами через відповідь `getMovieGenres()` (так робить `Home.tsx` і `Movies.tsx`).

## Домен: Trending і Search (уніфіковані типи)

Trending і мультипошук повертають різнорідні елементи, дискриміновані полем `media_type` (`types/trending.ts`, `types/search.ts`):

```ts
type MediaType = 'movie' | 'tv' | 'person' | 'all';
type TimeWindow = 'day' | 'week';

type TrendingItem  = TrendingMovie | TrendingTV | TrendingPerson; // Movie/TV/Person & { media_type }
type MultiSearchResult = SearchMovie | SearchTV | SearchPerson;
```

Дискримінантне поле `media_type` дозволяє звужувати тип у рантаймі (напр. `Home.tsx` фільтрує `media_type === 'movie'`).

## Клієнтський стан: Global Store

Єдине джерело клієнтського стану поза React Query — global store (`packages/events/src/store.ts`), singleton на `window.__CINEPULSE_STORE__`.

### `GlobalState` / `UserProfile` (`packages/events/src/types.ts`)

```ts
interface UserProfile { id: string; name: string; email: string; avatar?: string; }

interface GlobalState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

**Дії** (`GlobalActions`): `setUser`, `updateUser`, `setTheme`, `reset`.

> **Статус:** типи стану визначені й реалізовані, але **ще не підключені до UI** — сторінки `Profile`/`Settings` наразі заглушки, авторизації немає (див. роадмап, Етап 4).

## ➕ Планована модель: Watchlist (Firestore)

> Ще не реалізовано. Джерело вимог — [PRD](../01-product/PRD.md#ключова-фіча-watchlist-папки--статуси). Наведене — цільова форма для опрацювання на Етапі 3 (точна структура колекцій і security rules — до проєктування).

**Вимоги до моделі:**
- **Папки** — дерево з вкладеністю **до 6 рівнів**, необмежена ширина. Належать конкретному користувачу.
- **Тайтл у watchlist** — фільм або серіал; може перебувати **в кількох папках** (membership many-to-many).
- **Статус тайтла** — `watched | planned` (переглянуто/заплановано), незалежно від папок.
- **Доступ** — лише авторизований користувач бачить/змінює свої дані (security rules за `uid`).

**Ескіз типів (чернетка, до узгодження):**

```ts
type WatchStatus = 'watched' | 'planned';

interface WatchlistFolder {
  id: string;
  ownerUid: string;
  name: string;
  parentId: string | null; // null = корінь; глибина ≤ 6
}

interface WatchlistItem {
  id: string;
  ownerUid: string;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  status: WatchStatus;
  folderIds: string[]; // тайтл може бути в кількох папках
}
```

> Відкриті питання: спосіб зберігання дерева (parentId-посилання vs. materialized path), enforcement ліміту глибини 6, денормалізація метаданих тайтла (постер/назва) для офлайн-показу.

## Контракт подій: `EventMap`

Типізований словник подій event bus (`packages/events/src/types.ts`):

| Подія | Payload |
|-------|---------|
| `user:login` | `UserProfile` |
| `user:logout` | `undefined` |
| `user:update` | `Partial<UserProfile>` |
| `navigation:change` | `NavigationPayload { path, params? }` |
| `notification:show` | `NotificationPayload { type, message, duration? }` |
| `mfe:ready` | `{ name: string }` |
| `mfe:error` | `{ name: string; error: Error }` |

`NotificationPayload.type` ∈ `'success' | 'error' | 'warning' | 'info'`. Наразі реально емітиться `notification:show` (з клієнта API); решта подій — частина контракту для майбутньої інтеграції.

## Робота із зображеннями

Типи розмірів (`packages/api/src/core/config.ts`): `ImageSize`, `BackdropSize`, `ProfileSize`. Повний URL будує `getImageUrl(path, size)` (`core/utils.ts`) на базі `TMDB_IMAGE_BASE_URL`. Значення `null` шляху повертає `null` (компоненти показують плейсхолдер).
