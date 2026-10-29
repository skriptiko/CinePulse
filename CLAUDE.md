# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Огляд

CinePulse — каталог фільмів/серіалів на даних TMDB, побудований як micro-frontend застосунок: Turborepo + pnpm (9.15.4, Node >= 20), Vite 5, React 18, `@module-federation/vite`, React Router 7, TanStack Query 5, Tailwind 3 + shadcn/Radix. Документація проєкту — українською, у `docs/` (старт — `docs/00-roadmap/PROJECT_ROADMAP.md`; конвенції — `docs/04-development/CONVENTIONS.md`).

## Команди

```bash
pnpm install
pnpm dev                              # усі застосунки (host 5000, pages-mfe 5001, user-mfe 5002)
pnpm --filter @repo/host dev          # окремий застосунок (@repo/pages-mfe, @repo/user-mfe)
pnpm build                            # turbo build (tsc + vite build)
pnpm typecheck                        # turbo typecheck (tsc --noEmit у кожному пакеті)
pnpm lint                             # biome check src/ у кожному пакеті
pnpm check                            # biome check --write по всьому репо
pnpm --filter @repo/api typecheck     # перевірка одного пакета
pnpm build:deploy                     # build + scripts/merge-dist.js → кореневий dist/
```

Тестів і тестового фреймворку немає (див. `docs/05-testing/TEST_STRATEGY.md` — це план, а не наявний процес). Перевірка змін = `pnpm typecheck` + `pnpm lint`.

Husky pre-commit запускає `lint-staged` → `biome check --apply` на `*.{js,ts,tsx,json}`. Biome (не ESLint/Prettier): одинарні лапки, `;` завжди, 2 пробіли, ширина 100; `noUnusedImports`/`noUnusedVariables` — error.

Для TMDB потрібен `TMDB_API_READ_TOKEN` у кореневому `.env` (Vite `loadEnv` читає корінь репо); для functions — `functions/.env` (приклад у `functions/.env.example`).

## Архітектура

### Module Federation

- `apps/host` — оболонка. У `App.tsx` динамічно імпортує `pagesMfe/routes` та `userMfe/routes`, склеює масиви `RouteObject[]` і рендерить через `useRoutes`, обгорнувши в `ErrorBoundary level="shell"` + `AppLayout` з `@repo/ui`. Якщо remote недоступний — маршрути стають порожніми.
- `apps/pages-mfe` (публічний каталог: Home, Movies) і `apps/user-mfe` (кабінет: Profile, Settings) — remotes, кожен експонує лише `./routes` (`src/routes.tsx`). Їхній `main.tsx` використовується **тільки** для standalone-розробки (з `Providers` + `AppLayout`); в інтеграції host бере лише `routes`.
- Адреси remotes у host: `PAGES_MFE_URL` / `USER_MFE_URL` (дефолт `http://localhost:500x/remoteEntry.js`; у продакшні — `apps/host/.env.production`, `/pages-mfe/assets/remoteEntry.js`). Можна вказати staging-URL для гібридної розробки.
- **Shared-синглтони**: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`. Нову спільну залежність треба додати в `shared` у **всіх трьох** `vite.config.ts`, інакше буде дубляж екземплярів.
- Типи remotes для host — ручні декларації в `apps/host/src/@types/remotes/*.d.ts` (плюс згенеровані `apps/host/@mf-types/`). Додаючи новий remote або export, оновлюй їх.
- Ізоляція стилів: Tailwind кожного remote має `important: '#mfe-pages-root'` / `'#mfe-user-root'` (id кореневого div у `index.html`), а `content` включає `packages/ui/src` — класи з `@repo/ui` генеруються в кожному застосунку.

### Спільні пакети (`packages/*`)

Пакети не збираються для споживання — `exports` вказують прямо на `src/index.ts`.

- `@repo/routes` — `ROUTE_PATHS`, єдине джерело істини для шляхів. Remotes будують `routes` з цих констант; динамічних (`:id`) маршрутів поки немає.
- `@repo/api` — TMDB-клієнт. Усі запити йдуть на відносний `/api/tmdb/*` (`apiGet`), токен ніколи не потрапляє в браузер: у dev це Vite proxy (host і pages-mfe) з Bearer-токеном, у продакшні — Firebase rewrite на функцію `tmdbProxy` (`functions/src/index.ts`). Шари: `endpoints/` (fetch-функції) → `hooks/` (на `useSuspenseQuery`/`useSuspenseInfiniteQuery`, тож сторінкам потрібен `Suspense`) → `queries/keys.ts` (фабрика query keys). 5xx/мережеві помилки емітять подію `notification:show`.
- `@repo/events` — типізована шина подій (`EventMap` у `types.ts`; `createTypedEmitter`/`createTypedListener`) і `globalStore`. Обидва — синглтони на `window.__CINEPULSE_EVENT_BUS__` / `window.__CINEPULSE_STORE__`, тому працюють між MFE. Крос-MFE комунікація — тільки через цей пакет, без прямих імпортів між `apps/*`.
- `@repo/ui` — дизайн-система (shadcn-компоненти, kebab-case файли), доменні компоненти (`MovieCard`, `Hero`, `ContentRow`…), `Providers` (QueryClient), `AppLayout`, `ErrorBoundary` (рівні shell/module), `mapTmdbToMovieCard`.

### Деплой

Push у `main` → GitHub Actions: `pnpm build` → `scripts/merge-dist.js` (host у корінь `dist/`, remotes у `dist/pages-mfe/` та `dist/user-mfe/`) → Firebase Hosting (проєкт `cinepulse-eec15`). Rewrites у `firebase.json`: `/api/tmdb/**` → `tmdbProxy`, SPA-fallback для кожного MFE. Додаючи новий MFE, онови `merge-dist.js`, `firebase.json` і `.env.production` host.

`docs/08-design-files/` — окремий Next.js-прототип дизайну (референс для UI), не частина workspace.

## Конвенції

- Коміти: `CIN-<номер>: <короткий опис у наказовому способі>`.
- Сторінки в застосунках — PascalCase (`Home.tsx`), компоненти `@repo/ui` — kebab-case файли з PascalCase експортом.
- Suspense-хуки `@repo/api` не підтримують `enabled` — не обирай хук умовою (`cond ? useA() : useB()` порушує rules of hooks). Перемикай `queryKey`/`queryFn` в одному запиті (як `useMoviesOrSearch`) або винось варіанти в окремі компоненти.
