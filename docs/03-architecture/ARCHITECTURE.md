🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Архітектура CinePulse

CinePulse — micro-frontend (MFE) вебзастосунок-каталог фільмів поверх TMDB API. Архітектура будується на трьох принципах:

1. **Незалежні MFE** — публічний каталог і особистий кабінет розробляються та деплояться як окремі remote-модулі.
2. **Спільна композиція через host** — оболонка (shell) динамічно завантажує remote-роути й компонує єдиний застосунок.
3. **Ізольований шар даних** — увесь доступ до TMDB інкапсульований у пакеті `@repo/api`, а токен ніколи не потрапляє на клієнт.

## Огляд топології

| Застосунок | Роль | Порт (dev) | Module Federation |
|------------|------|:---:|-------------------|
| `apps/host` | Shell / оболонка | 5000 | `remotes: pagesMfe, userMfe` |
| `apps/pages-mfe` | Публічний каталог (Home, Movies) | 5001 | `exposes: ./routes` |
| `apps/user-mfe` | Особистий кабінет (Profile, Settings) | 5002 | `exposes: ./routes` |

Host не містить сторінок сам — він імпортує роути з remote-модулів у `apps/host/src/App.tsx`:

```ts
const [pagesModule, userModule] = await Promise.all([
  import('pagesMfe/routes'),
  import('userMfe/routes'),
]);
setRemoteRoutes([...pagesModule.routes, ...userModule.routes]);
```

Кожен remote експонує лише масив `RouteObject[]` (`exposes: { './routes': './src/routes.tsx' }`), тобто одиниця композиції — це **роут**, а не окремий компонент. Це навмисне рішення (див. [ADR-0001](./decisions/ADR-0001-micro-frontend-module-federation.md)).

### Механізм федерації

Використовується `@module-federation/vite`. Host налаштований як споживач (`apps/host/vite.config.ts`), MFE — як провайдери (`apps/*/vite.config.ts`). Адреси remote можна перевизначити змінними оточення для гібридної розробки:

```
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js
```

**Shared-залежності** (єдиний екземпляр на весь застосунок, `shareScope: 'default'`):

- `react`, `react-dom` — React 19 ([ADR-0007](./decisions/ADR-0007-react-19.md)); для всіх shared `singleton`, а `requiredVersion` береться з pnpm catalog через `scripts/mf-shared.ts` (`strictVersion` для сторонніх)
- `react-router-dom` — спільний роутер, один `BrowserRouter` у host
- `@tanstack/react-query` — спільний `QueryClient`
- `zustand` — runtime of the global store ([ADR-0008](./decisions/ADR-0008-zustand-global-store.md))
- `@repo/events` — спільна event bus і global store
- `@repo/routes` — спільні константи шляхів
- `@repo/api` — спільний шар доступу до даних

Спільність цих залежностей критична: `react` і `react-router-dom` мають бути в одному екземплярі, інакше зламаються хуки та контекст роутера; `@repo/events` мусить бути одним екземпляром, щоб event bus і store були справді глобальними (див. [ADR-0004](./decisions/ADR-0004-typed-event-bus.md)).

## Монорепозиторій

Проєкт — монорепо на **Turborepo + pnpm workspaces** (див. [ADR-0002](./decisions/ADR-0002-turborepo-pnpm-monorepo.md)). Workspace-межі — у `pnpm-workspace.yaml`:

```
packages:
  - "apps/*"
  - "packages/*"
  - "functions"
```

Оркестрація задач — `turbo.json`: `build` (з `dependsOn: ["^build"]`, кешується у `dist/**`), `dev` (persistent, без кешу), `lint`, `typecheck`, `sync-types` (генерує типи remote у host після build).

**Спільні пакети:**

| Пакет | Призначення |
|-------|-------------|
| `@repo/api` | Клієнт TMDB, endpoints, React Query хуки, типи |
| `@repo/ui` | Дизайн-система (Shadcn UI + Radix + Tailwind), mappers |
| `@repo/events` | Типізована event bus + global store |
| `@repo/routes` | Константи шляхів (`ROUTE_PATHS`) і хелпери |
| `@repo/typescript-config` | Спільні `tsconfig` (base, react-library) |

Кожен MFE та host є workspace-пакетами й споживають ці пакети через `@repo/*` без публікації в реєстр.

## Потік даних

Data flows one way: UI component → query factory (`queryOptions`) → endpoint → `apiGet` → proxy → TMDB.

```
Компонент (Home/Movies)
   │  useSuspenseQuery(movieQueries.row(…)) / useMoviesOrSearch
   ▼
React Query (Suspense)             packages/api/src/queries/*
   │  queryFn → endpoints          packages/api/src/endpoints/*
   ▼
apiGet(endpoint, { params })       packages/api/src/core/client.ts
   │  fetch(`/api/tmdb` + endpoint)
   ▼
Проксі  ── dev:  Vite server.proxy (apps/*/vite.config.ts)
        └─ prod: Firebase Function `tmdbProxy` (functions/src/index.ts)
   │  додає Authorization: Bearer <TMDB_API_READ_TOKEN>
   ▼
TMDB API  https://api.themoviedb.org/3
```

Клієнт завжди звертається до відносного шляху `/api/tmdb/...` (`API_CONFIG.PROXY_BASE_URL`). У продакшні Firebase Hosting переписує `/api/tmdb/**` на функцію `tmdbProxy`; у dev той самий шлях перехоплює Vite-proxy. Токен додається виключно на боці проксі (див. [ADR-0003](./decisions/ADR-0003-tmdb-proxy.md)).

React Query caches data with `staleTime` 5 minutes and `refetchOnWindowFocus: false`; only network, 5xx and 429 errors are retried, at most twice (`createQueryClient` in `packages/api/src/query-client/`). Списки використовують infinite-query (`useSuspenseInfiniteQuery`) with the shared `getNextPageParam` (capped at TMDB's 500 pages).

## Крос-MFE комунікація

MFE не мають прямих імпортів один з одного. Комунікація — через `@repo/events`:

- **Event bus** (`packages/events/src/event-bus.ts`) — типізований emitter/listener поверх `window.__CINEPULSE_EVENT_BUS__` (singleton на `window`). Event types are fixed in `EventMap` (`notification:show`, `mfe:error`, `error:report`).
- **Global store** (`packages/events/src/store.ts`) — a Zustand store, singleton on `window.__CINEPULSE_STORE__`, with `{ theme }` and `setTheme`. React components subscribe with `useGlobalStore(selector)` ([ADR-0008](./decisions/ADR-0008-zustand-global-store.md)).

Singleton саме на `window` гарантує єдиний екземпляр навіть якщо федерація завантажить пакет двічі. The API transport does not emit events; error toasts and reports go through `QueryCache.onError` (see Error handling below).

Деталі моделі — [DATA_MODEL.md](./DATA_MODEL.md), деталі рішення — [ADR-0004](./decisions/ADR-0004-typed-event-bus.md) та [ADR-0008](./decisions/ADR-0008-zustand-global-store.md).

## Обробка помилок

Boundaries are built on `react-error-boundary` (a strict MF singleton) and live in `@repo/ui`:

1. **Page** — every route element of a remote is wrapped in `PageBoundary` (`AsyncBoundary` = `QueryErrorResetBoundary` + `ErrorBoundary` + `Suspense`). Navigation resets it (`resetKeys` and the `Suspense` key are the `pathname`). The fallback is a page skeleton (`MovieGridSkeleton`, `PageSkeleton`), shown after 300 ms. Home does not suspend as a whole: each section has its own `AsyncBoundary`, skeleton and `SectionErrorFallback`, and the page prefetches every row so they load in parallel. Errors go to `PageErrorFallback`: a 404 (`kind: 'not_found'`) renders `NotFound`, anything else a plain-language message with **Try again**, which also resets the failed queries so they refetch.
2. **Shell** — `ShellBoundary` in `apps/host/src/app.tsx`, inside `AppLayout`, so the header survives any error. It offers **Reload** and resets on navigation.

Also:
- **Unknown URL** — the host appends a catch-all `*` route rendering `NotFound` after the remotes' routes.
- **Remote route loading** — `loadRemoteRoutes(REMOTES)` (`apps/host/src/remotes/`) loads each remote independently. A failed remote gets `RemoteUnavailable` ("This section is unavailable" + Try again, which reloads) on the paths listed for it in `REMOTES`, and `mfe:error` is emitted with a serialized error; the other remotes keep working.
- **Stale chunks after a deploy** — `vite:preloadError` triggers one `location.reload()`; the reload time in `sessionStorage` blocks another reload for 60 s, so a really missing chunk cannot loop.
- **API errors** — `ApiError` with `kind` (`network`, `not_found`, `server`, `client`, `validation`), `status` and `cause`; an abort is rethrown unchanged. See [API_SPEC.md](./API_SPEC.md#errors).
- **One channel per error** — `createQueryClient` (`@repo/api`) sets `QueryCache.onError`: every failed query emits `error:report` (`source: 'query'`); a toast (`notification:show`, text from `getErrorMessage`) is emitted only when the query already has data (a failed background refetch), never for a 404 and never when `meta.inlineErrors` is set. Without data the error goes to the page boundary instead. Failed mutations always toast.
- **Toasts** — the host subscribes to `notification:show` and shows it with sonner; its `Toaster` is lazy-loaded, so sonner is not in the initial bundle. Remotes never import sonner.
- **Reporting** — boundaries, `QueryCache`/`MutationCache` and the host's `window` `error` / `unhandledrejection` handlers emit `error:report`. The host's single listener drops expected failures (404, aborts, network errors while offline) and, with no vendor chosen, logs the rest in development only.
- **Offline** — the host shows one global banner while `onlineManager` reports offline; data on screen stays.

## Збірка та деплой

- **Bundler:** Vite. Продакшн-збірка з `target: 'chrome89'`, `minify: false`, `cssCodeSplit: false`, `modulePreload: false` (сумісність з федерацією модулів).
- **Merge dist:** `scripts/merge-dist.js` об'єднує `dist/` усіх застосунків в одну теку для Firebase Hosting (`pnpm build:deploy`).
- **Hosting + Functions:** `firebase.json` описує rewrites (`/api/tmdb/**` → `tmdbProxy`, `/pages-mfe/**` та `/user-mfe/**` → відповідні `index.html`, решта → host `index.html`) і CORS-заголовок для `*.js`.

Деталі пайплайну — [CI_CD.md](../06-deployment/CI_CD.md), середовища — [ENVIRONMENTS.md](../06-deployment/ENVIRONMENTS.md).

## Сильні сторони

- Чітке розділення відповідальності (shell / MFE / shared-пакети).
- Незалежна розробка та деплой MFE; гібридний режим через env-URL remote.
- Безпечна робота з TMDB — токен лише на проксі.
- Типобезпека наскрізь: типізовані події, типізований шар даних, спільні `tsconfig`.

## Відомі обмеження

- Спільні залежності жорстко зв'язують версії `react`/`react-router-dom` між усіма MFE — оновлення потрібно координувати.
- Global store не реактивний «з коробки» для React (немає підписки-хука) — поки що використовується переважно як шина стану (див. [ADR-0004](./decisions/ADR-0004-typed-event-bus.md)).
- Немає окремого staging-середовища; деплой іде одразу в production (Етап 6).

## ➕ Заплановані наслідки вимог (2026-07-12)

> Формалізація скоупу (див. [PRD](../01-product/PRD.md)) додає **watchlist + авторизацію**. Це вимагає нових бекенд-складових, яких у поточній архітектурі немає (досі — лише stateless `tmdbProxy`). **До опрацювання на Етапах 3–4:**

- **Firebase Auth** — автентифікація (email+пароль із реєстрацією). Підключити реальний провайдер до `globalStore` (add the user state back then; it was removed in ADR-0008 because it had no source) та подій `user:login`/`user:logout`. Гейт доступу до `user-mfe` (watchlist лише для авторизованих).
- **Firestore** — персистентне сховище watchlist (дерево папок ≤6 рівнів, membership тайтлів many-to-many, статус переглянуто/заплановано) + security rules (ізоляція даних за користувачем). Це **перша власна БД** у проєкті — оновити [DATA_MODEL](./DATA_MODEL.md).
- **Наслідок для потоку даних:** поряд із «read-only TMDB через проксі» з'являється «read/write користувацьких даних через Firestore SDK» — потрібно розмежувати ці два шляхи в `user-mfe`.
- **Потенційний ADR:** вибір Firestore vs. альтернатив і форма зберігання дерева папок — кандидат на новий ADR.

## Діаграми

⬜ Формальних C4-діаграм ще немає. Нижче — текстова схема композиції (за потреби замінити на C4/діаграми послідовностей).

```
                         ┌─────────────────────────────┐
                         │        Браузер користувача    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │      apps/host (shell :5000) │
                         │  BrowserRouter + AppLayout   │
                         │  ShellBoundary (in layout)   │
                         └───────┬─────────────┬────────┘
              import('pagesMfe/routes)   import('userMfe/routes)
                         │                     │
              ┌──────────▼─────────┐ ┌─────────▼──────────┐
              │ pages-mfe (:5001)  │ │  user-mfe (:5002)  │
              │ Home, Movies       │ │ Profile, Settings  │
              │ exposes ./routes   │ │ exposes ./routes   │
              └──────────┬─────────┘ └─────────┬──────────┘
                         │  shared пакети (single instance) │
        ┌────────────────┼────────────┬─────────────┬───────┘
        ▼                ▼            ▼             ▼
   @repo/api        @repo/ui    @repo/events   @repo/routes
        │  apiGet('/api/tmdb/...')
        ▼
   ┌──────────────────────────┐   dev → Vite proxy
   │  Проксі  /api/tmdb/**     │───────────────────────┐
   │  prod → tmdbProxy (Fn)    │  + Authorization Bearer│
   └────────────┬─────────────┘                        │
                ▼                                        ▼
         TMDB API (https://api.themoviedb.org/3)  TMDB_API_READ_TOKEN (secret)
```
