🔗 Частина роадмапи: [Етап 1 — Аналіз вимог](../00-roadmap/PROJECT_ROADMAP.md#етап-1-аналіз-вимог)

# Глосарій

Ключові терміни проєкту. Більшість виведені з коду (можна довіряти); продуктові терміни watchlist/auth додано з вимог (сесія 2026-07-12) — реалізації в коді ще немає.

## Архітектурні терміни

- **MFE (Micro-Frontend)** — самостійний фронтенд-модуль, який розробляється й збирається окремо і підключається до спільної оболонки в рантаймі. У CinePulse: `pages-mfe` та `user-mfe`.
- **Host (оболонка)** — застосунок `apps/host` (порт 5000), який завантажує remote-модулі та збирає з них єдиний застосунок. Містить layout, роутинг верхнього рівня та shell-level error boundary.
- **Remote** — MFE, який експонує свої модулі назовні (`exposes: { './routes': ... }`) для завантаження host-ом. У CinePulse remotes — `pages-mfe` (5001) і `user-mfe` (5002).
- **Module Federation** — механізм Vite (`@module-federation/vite`), що дає змогу завантажувати код одного застосунку з іншого в рантаймі через `remoteEntry.js`.
- **Shared dependency** — залежність, яку host і remotes використовують спільно з одного екземпляра (щоб уникнути дублювання React тощо). У конфігах: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/*`.
- **shareScope / entryGlobalName** — параметри Module Federation, що визначають простір спільних залежностей і глобальне ім'я remote-входу.
- **Turborepo** — оркестратор задач монорепозиторію (`turbo.json`): кешує й розпаралелює `build`, `dev`, `lint`, `typecheck`, `sync-types`.
- **pnpm workspace** — менеджер пакетів монорепо; склад воркспейсу описано в `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `functions`).

## Дані та інтеграції

- **TMDB (The Movie Database)** — зовнішнє API-джерело даних про фільми/серіали/персон ([themoviedb.org](https://www.themoviedb.org/)).
- **Proxy / `tmdbProxy`** — Firebase Cloud Function (`functions/src/index.ts`), що проксує запити до TMDB, додаючи секретний токен на бекенді (клієнт токен не бачить). У dev роль проксі виконує Vite-proxy на `/api/tmdb`.
- **React Query (TanStack Query)** — бібліотека кешування серверного стану. Використовується разом із Suspense.
- **Suspense query** — хук `useSuspenseQuery` / `useSuspenseInfiniteQuery`: під час завантаження «підвішує» компонент до найближчого `<Suspense>`, спрощуючи стани завантаження.
- **mapper (`mapTmdbToMovieCard`)** — функція з `@repo/ui`, що перетворює «сиру» TMDB-сутність на пропси UI-компонента `MovieCard`.

## Сутності TMDB (типи в `@repo/api`)

- **Movie / MovieDetails** — фільм (короткий у списках / повний на деталі).
- **TV / TVDetails** — серіал.
- **Person / PersonDetails** — персона (актор, режисер тощо).
- **Genre** — жанр; списки жанрів окремо для фільмів і TV.
- **Trending** — трендові елементи за вікном часу (`day` / `week`), можуть змішувати типи (movie/tv/person).
- **Backdrop / Poster / Profile** — типи зображень TMDB різних розмірів (`w500`, `original` тощо); базовий URL — `image.tmdb.org/t/p`.
- **PaginatedResponse** — сторінкова відповідь TMDB (`page`, `total_pages`, `results`).

## Крос-MFE комунікація (`@repo/events`)

- **Event bus** — типізована шина подій (singleton на `window.__CINEPULSE_EVENT_BUS__`) для спілкування між MFE без прямих залежностей. API: `createTypedEmitter` / `createTypedListener`. Події описано в `EventMap` (`user:login`, `notification:show`, `mfe:ready` тощо).
- **Global store** — глобальний стан (`window.__CINEPULSE_STORE__`): `user`, `isAuthenticated`, `theme` + екшени (`setUser`, `setTheme`, `reset`).
- **Error boundary** — React-межа обробки помилок. Два рівні: **shell-level** (критичний збій, перезавантаження застосунку) і **module-level** (окремий MFE може повторити спробу без перезавантаження всього).

## Спільні пакети

- **`@repo/api`** — клієнт TMDB, endpoints, React Query хуки, типи.
- **`@repo/ui`** — дизайн-система (компоненти, тема, mappers, provider).
- **`@repo/routes`** — константи шляхів (`ROUTE_PATHS`) і хелпери (`joinPaths`, `createPath`).
- **`@repo/events`** — event bus і global store.
- **`@repo/typescript-config`** — спільні TS-конфіги (`base.json`, `react-library.json`).
- **ROUTE_PATHS** — єдине джерело істини для шляхів маршрутизації (`HOME`, `MOVIES`, `USER_PROFILE`, `USER_SETTINGS`).

## Продуктові терміни (watchlist, auth) — з вимог 2026-07-12

> Ще не реалізовані в коді. Джерело — [PRD](./PRD.md).

- **Watchlist** — особистий трекер перегляду; ядро особистого кабінету (`user-mfe`). Доступний лише зареєстрованому користувачу; зберігається у Firestore.
- **Папка (Folder)** — контейнер watchlist, який користувач сам створює й називає. Підтримує підпапки з вкладеністю **до 6 рівнів**; кількість на кожному рівні необмежена. Поводиться як мітка: тайтл може лежати в кількох папках.
- **Статус тайтла** — окреме поле на тайтлі в watchlist, незалежне від папок: **переглянуто / заплановано**.
- **Тайтл** — узагальнена назва одиниці каталогу, яку можна додати у watchlist: фільм (`Movie`) або серіал (`TV`).
- **Firebase Auth** — провайдер автентифікації; у скоупі — email+пароль із реєстрацією (соц-логін поза скоупом).
- **Firestore** — документна БД Firebase для персистентного зберігання watchlist (папки, membership, статуси). Наразі в коді немає — планована архітектурна зміна (проєкт досі мав лише stateless `tmdbProxy`).
- **Definition of Done (DoD)** — критерій завершеності проєкту замість MVP-фазування: усі задокументовані сторінки + профіль + робочий watchlist («IMDb-like» покриття TMDB, але не весь API).
