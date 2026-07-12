🔗 Частина роадмапи: [Етап 3 — Архітектура](../00-roadmap/PROJECT_ROADMAP.md#етап-3-архітектура)

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

- `react`, `react-dom` (requiredVersion `^18.3.1`)
- `react-router-dom` — спільний роутер, один `BrowserRouter` у host
- `@tanstack/react-query` — спільний `QueryClient`
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

Дані односпрямовані: UI-компонент → хук React Query → `apiGet` → проксі → TMDB.

```
Компонент (Home/Movies)
   │  useMovies / useTrending / useSearchMovies / useMovieGenres
   ▼
React Query (Suspense)             packages/api/src/hooks/*
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

Дані для запитів кешуються React Query із `staleTime` 5 хвилин, `retry: 1`, `refetchOnWindowFocus: false` (`packages/ui/src/components/providers.tsx`). Списки використовують infinite-query (`useSuspenseInfiniteQuery`) з пагінацією за `page < total_pages`.

## Крос-MFE комунікація

MFE не мають прямих імпортів один з одного. Комунікація — через `@repo/events`:

- **Event bus** (`packages/events/src/event-bus.ts`) — типізований emitter/listener поверх `window.__CINEPULSE_EVENT_BUS__` (singleton на `window`). Типи подій фіксовані в `EventMap` (`user:login`, `user:logout`, `navigation:change`, `notification:show`, `mfe:ready`, `mfe:error` тощо).
- **Global store** (`packages/events/src/store.ts`) — `window.__CINEPULSE_STORE__` singleton зі станом `{ user, isAuthenticated, theme }` і діями (`setUser`, `updateUser`, `setTheme`, `reset`).

Singleton саме на `window` гарантує єдиний екземпляр навіть якщо федерація завантажить пакет двічі. Приклад використання — клієнт API емітить `notification:show` при 5xx/мережевій помилці (`packages/api/src/core/client.ts`).

Деталі моделі — [DATA_MODEL.md](./DATA_MODEL.md), деталі рішення — [ADR-0004](./decisions/ADR-0004-typed-event-bus.md).

## Обробка помилок

Застосована **двошарова стратегія Error Boundaries** (`@repo/ui`, `ErrorBoundary`):

1. **Shell-level** — у `apps/host/src/App.tsx` (`<ErrorBoundary level="shell">`) огортає весь застосунок. Перехоплює критичні збої композиції (напр. remote не завантажився) і пропонує перезавантажити застосунок.
2. **Module-level** — призначений огортати окремий MFE, щоб його падіння не рушило решту й давало локальний retry без перезавантаження всього застосунку.

Додатково:
- **Помилки завантаження remote-роутів** — `App.tsx` ловить помилку `import('pagesMfe/routes')` і деградує до порожнього набору роутів (у dev логує в консоль).
- **Помилки API** — `ApiError` з полями `status`/`statusText`/`isNetworkError`; на 5xx і мережеві помилки емітиться `notification:show` для показу користувачу.
- **Suspense** — усі дані-хуки суспенсні, тож стани завантаження обробляються через `<Suspense>` межі в роутах.

**Відоме обмеження:** module-level boundary та уніфіковані loading/empty-стани реалізовані не всюди (напр. Home без skeleton) — див. роадмап, Етап 2.

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

- **Firebase Auth** — автентифікація (email+пароль із реєстрацією). Підключити реальний провайдер до `globalStore` (`user`, `isAuthenticated`) та подій `user:login`/`user:logout`. Гейт доступу до `user-mfe` (watchlist лише для авторизованих).
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
                         │  ErrorBoundary (shell-level) │
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
