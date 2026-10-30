# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Огляд

CinePulse — каталог фільмів/серіалів на даних TMDB, побудований як micro-frontend застосунок: Turborepo + pnpm (9.15.4, Node >= 24), Vite 5, React 19 (ADR-0007: `ref` як проп, без `forwardRef`), `@module-federation/vite`, React Router 7, TanStack Query 5, Tailwind 3 + shadcn/Radix. Документація проєкту — українською, у `docs/` (конвенції — `docs/04-development/CONVENTIONS.md`).

## Управління проєктом — Notion

Весь менеджмент проєкту відбувається в Notion (хаб «CinePulse», https://app.notion.com/p/40880c5f7ed58170bca1efda4e894ce9): роадмап, епіки (Now/Next/Later), задачі, ресурси. У репо роадмапу й трекера немає — `docs/` містить лише технічну документацію.

- Перед роботою — знайди або створи задачу в базі «Задачі» (Notion MCP), переведи в *In Progress*.
- Коміт: `CIN-<номер>: …`, де номер = ID задачі в Notion.
- Після роботи — оновити статус задачі (і поле «Коміти»); нове архітектурне рішення — ADR.

## Команди

```bash
pnpm install
pnpm dev                              # усі застосунки (host 5000, pages-mfe 5001, user-mfe 5002)
pnpm --filter @repo/host dev          # окремий застосунок (@repo/pages-mfe, @repo/user-mfe)
pnpm build                            # turbo build (tsc + vite build)
pnpm typecheck                        # turbo typecheck (tsc --noEmit у кожному пакеті)
pnpm lint                             # biome check src/ у кожному пакеті + заборона JSX-spread
pnpm check                            # biome check --write по всьому репо
pnpm --filter @repo/api typecheck     # перевірка одного пакета
pnpm build:deploy                     # як у CI: build без apps/design + scripts/merge-dist.js → кореневий dist/
pnpm test                             # vitest run по всіх проєктах (кореневий vitest.config.ts)
pnpm exec vitest run --project ui     # один проєкт; pnpm test:coverage — звіт у coverage/
pnpm size                             # бюджет JS host (.size-limit.json); спершу turbo build --filter=@repo/host
```

Перевірка змін = `pnpm typecheck` + `pnpm lint` + `pnpm test`. Стек тестів — ADR-0006, план — `docs/05-testing/TEST_STRATEGY.md`:
- Vitest 3.2 (не 4+, бо Vite 5), Testing Library, MSW 3, jsdom, axe-core.
- Тести лежать у `__tests__/<name>.test.ts(x)` поруч із кодом. Проєкт стає частиною прогону, коли має власний `vitest.config.ts`.
- jsdom-проєкти задають `environment: scripts/vitest-jsdom-environment.ts` (jsdom із Node-глобалями fetch); зі звичайним `jsdom` MSW падає на `AbortSignal`.
- Хелпери — у `@repo/test-utils`:
  - `renderWithProviders` (QueryClient з `retry: false` + MemoryRouter, повертає `user`);
  - MSW `server` і `handlers`;
  - `buildMovie` / `buildPaginated`;
  - `expectNoA11yViolations`.
- `@repo/api` test-utils не використовує (був би цикл залежностей) і створює свій `setupServer`.
- У MSW 3 опція називається `onUnhandledFrame: 'error'`: стару `onUnhandledRequest` MSW тихо ігнорує.
- Мокаємо мережу, а не наші модулі (`vi.mock` для `@repo/api` заборонений).

Husky pre-commit запускає `lint-staged` → `biome check --write --no-errors-on-unmatched` на `*.{js,ts,tsx,json}`; `commit-msg` перевіряє формат `CIN-<N>: …` (≤ 72 символи). Biome (не ESLint/Prettier): одинарні лапки, `;` завжди, 2 пробіли, ширина 100; error — `noUnusedImports`/`noUnusedVariables`, `noExplicitAny`, `noNonNullAssertion`, `noDefaultExport` (крім `*.config.*`), `useFilenamingConvention` (kebab-case), група `a11y`. JSX-spread (`{...props}`) і `asChild` заборонені (стандарти §5.2): Biome цього не ловить, тому `pnpm lint` додатково запускає `scripts/check-jsx-spread.js`. Примітиви `@repo/ui` оголошують `Pick<ComponentProps<…>, …>` з потрібними атрибутами й передають кожен явно; новий атрибут — додай у тип і JSX. Тригер Radix стилізується `className={cn(buttonVariants(…), …)}`.

Для TMDB потрібен `TMDB_API_READ_TOKEN` у кореневому `.env` (Vite `loadEnv` читає корінь репо); для емулятора functions — `functions/.secret.local` (шаблон `functions/.secret.local.example`); у продакшні — Firebase Secret Manager.

## Архітектура

### Module Federation

- `apps/host` — оболонка. `loadRemoteRoutes(REMOTES)` (`src/remotes/`) динамічно імпортує `pagesMfe/routes` та `userMfe/routes` незалежно (`Promise.allSettled`): на шляхах remote, що не завантажився, стоїть `RemoteUnavailable` і емітиться `mfe:error`. Новий remote — додай у `REMOTES` разом з його `ROUTE_PATHS`. Масиви `RouteObject[]` склеюються й рендеряться через `useRoutes` усередині `AppLayout` з `@repo/ui`, обгорнувши в `ShellBoundary` (react-error-boundary); останнім іде маршрут `*` → `NotFound`. `vite:preloadError` → один reload (`src/stale-chunk-reload.ts`). Кожен `element` у `routes.tsx` remotes — у `PageBoundary` (`AsyncBoundary` з `resetKeys`/`Suspense key` = `pathname`, скелетон сторінки, Retry скидає запити, 404 → `NotFound`).
- `apps/pages-mfe` (публічний каталог: Home, Movies) і `apps/user-mfe` (кабінет: Profile, Settings) — remotes, кожен експонує лише `./routes` (`src/routes.tsx`). Їхній `main.tsx` використовується **тільки** для standalone-розробки (з `ApiProvider` + `AppLayout`); в інтеграції host бере лише `routes`.
- Адреси remotes у host: `PAGES_MFE_URL` / `USER_MFE_URL` (дефолт `http://localhost:500x/remoteEntry.js`; у продакшні — `apps/host/.env.production`, `/pages-mfe/remoteEntry.js`; host читає env зі свого каталогу, а `vite build` падає без цих змінних). Можна вказати staging-URL для гібридної розробки.
- **Shared-синглтони**: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-error-boundary`, `zustand`, `@repo/events`, `@repo/routes`, `@repo/api`. Мапу `shared` для всіх трьох `vite.config.ts` будує `createMfShared()` у `scripts/mf-shared.ts`: усі `singleton`, а сторонні ще й `strictVersion` з `requiredVersion` із pnpm catalog. Розбіжність версій падає явною помилкою Federation Runtime. Нову спільну залежність додавай тільки туди (і в catalog).
- Типи remotes для host — ручні декларації в `apps/host/src/@types/remotes/*.d.ts` (плюс згенеровані `apps/host/@mf-types/`). Додаючи новий remote або export, оновлюй їх.
- Ізоляція стилів: Tailwind кожного remote має `important: '#mfe-pages-root'` / `'#mfe-user-root'` (id кореневого div у `index.html`), а `content` включає `packages/ui/src` — класи з `@repo/ui` генеруються в кожному застосунку.

### Спільні пакети (`packages/*`)

Пакети не збираються для споживання — `exports` вказують прямо на `src/index.ts`. Версії спільних залежностей (react, router, query, TS, vite, MF, tailwind, types) живуть у `catalog` у `pnpm-workspace.yaml`, а в `package.json` пишемо `"catalog:"`; виняток — `functions/` (Cloud Build ставить його через npm). Залежності, що мають бути синглтоном (`react`, `react-router-dom`, `@tanstack/react-query`), у `packages/*` — `peerDependencies` + `devDependencies`, не `dependencies`; внутрішні пакети — `workspace:*`.

- `@repo/routes` — `ROUTE_PATHS`, єдине джерело істини для шляхів. Remotes будують `routes` з цих констант; динамічних (`:id`) маршрутів поки немає.
- `@repo/api` — TMDB-клієнт. Усі запити йдуть на відносний `/api/tmdb/*` (`apiGet`), токен ніколи не потрапляє в браузер: у dev це Vite proxy (host і pages-mfe) з Bearer-токеном, у продакшні — Firebase rewrite на функцію `tmdbProxy` (`functions/src/index.ts`; лише GET/HEAD і allowlist шляхів/параметрів у `functions/src/proxy-rules.ts` — новий endpoint у `@repo/api` додавай і туди). Шари: `endpoints/` (fetch-функції, внутрішні) → `queries/<domain>.ts` (фабрики `queryOptions`: `movieQueries.row/list/detail`…) → компонент викликає `useSuspenseQuery(factory)` / `useSuspenseQueries` напряму, тож сторінкам потрібен `Suspense`. Хук у `hooks/` — лише з логікою (`useMoviesOrSearch`). `createQueryClient` (retry лише `network`/`server`, ≤ 2) і `ApiProvider` — тільки в host і standalone `main.tsx` remotes. Помилки — `ApiError` з `kind`; транспорт подій не емітить, а `QueryCache.onError` емітить `error:report` і toast (`notification:show`) лише поверх наявних даних. Host — єдиний слухач: `src/error-channel/` (sonner-`Toaster` лениво, фільтр звітів, офлайн-банер).
- `@repo/events` — типізована шина подій (`EventMap` у `types.ts`; `createTypedEmitter`/`createTypedListener`) і `globalStore` — Zustand-стор (`theme`/`setTheme`, ADR-0008); у React — `useGlobalStore(selector)` (селектор повертає стабільне значення або обгорнутий у `useShallow`). Обидва — синглтони на `window.__CINEPULSE_EVENT_BUS__` / `window.__CINEPULSE_STORE__`, тому працюють між MFE. Крос-MFE комунікація — тільки через цей пакет, без прямих імпортів між `apps/*`.
- `@repo/ui` — дизайн-система. Примітиви shadcn (без spread і `asChild`) — у `components/ui/`; доменні компоненти (`MovieCard`, `Hero`, `ContentRow`…), `AppLayout`, межі (`AsyncBoundary`, `PageBoundary`, `ShellBoundary`), `NotFound`, скелетони сторінок — у `components/`; мапери TMDB → UI-модель (`toMovieCardData`, `toHeroData`, `toFeaturedItemData`…) — у `lib/mappers/`, форматування — `lib/format.ts`. Доменні компоненти приймають одну UI-модель (`MovieCard({ movie })`). Типи props (`MovieCardProps`…) експортуються з `index.ts`; файли kebab-case.

### Деплой

PR і push у `main` → GitHub Actions job `quality` (`pnpm lint` + `pnpm typecheck`, install з `--frozen-lockfile` — lockfile має бути актуальним). Лише push у `main` далі: `pnpm build:deploy` (build без `apps/design` → `scripts/merge-dist.js`) (host у корінь `dist/`, remotes у `dist/pages-mfe/` та `dist/user-mfe/`) → Firebase Hosting (проєкт `cinepulse-eec15`). Rewrites у `firebase.json`: `/api/tmdb/**` → `tmdbProxy`, SPA-fallback для кожного MFE. Додаючи новий MFE, онови `merge-dist.js`, `firebase.json` і `.env.production` host.

`docs/08-design-files/` — окремий Next.js-прототип дизайну (референс для UI), не частина workspace.

## Конвенції

- Коміти: `CIN-<номер>: <короткий опис у наказовому способі>`.
- Оновлення залежностей — Renovate (`renovate.json`): групові PR у `develop` щопонеділка, без automerge; major — лише після approve на Dependency Dashboard і з окремим тікетом. Node і pnpm Renovate не чіпає.
- Усі файли й папки — kebab-case (`home.tsx`, `use-movies.ts`, `app-routes.tsx`), експорт — PascalCase/camelCase. Лише named exports (default — тільки в `*.config.*`). Сторінка з локальними хуками/компонентами — папка `pages/<name>/` з `<name>-page.tsx`.
- Suspense-хуки `@repo/api` не підтримують `enabled` — не обирай хук умовою (`cond ? useA() : useB()` порушує rules of hooks). Перемикай `queryKey`/`queryFn` в одному запиті (як `useMoviesOrSearch`) або винось варіанти в окремі компоненти.
