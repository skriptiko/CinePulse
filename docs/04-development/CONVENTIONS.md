🔗 Частина роадмапи: [Етап 4 — Розробка](../00-roadmap/PROJECT_ROADMAP.md#етап-4-розробка)

# CONVENTIONS — Конвенції розробки

## Структура монорепо

```
apps/       host (5000), pages-mfe (5001), user-mfe (5002)
packages/   api, ui, routes, events, typescript-config
functions/  Firebase Cloud Functions (tmdbProxy)
```

Пакети підключаються за псевдонімами `@repo/*` (`@repo/api`, `@repo/ui`, `@repo/routes`, `@repo/events`, `@repo/typescript-config`). Застосунки — `@repo/host`, `@repo/pages-mfe`, `@repo/user-mfe`, `@repo/functions`.

## Іменування

- Файли компонентів у `@repo/ui` — **kebab-case** (`movie-card.tsx`, `content-row.tsx`); експортований компонент — **PascalCase** (`MovieCard`).
- Сторінки в застосунках — **PascalCase** (`Home.tsx`, `Movies.tsx`, `Profile.tsx`).
- Хуки — `useXxx` (`useMovies`, `useSearchMovies`).
- Спільні константи — `SCREAMING_SNAKE` (`ROUTE_PATHS`, `API_CONFIG`).

## Лінтинг і форматування

Єдиний інструмент — **Biome** (`biome.json`), замінює ESLint + Prettier.

Форматування:
- лапки — **одинарні** (`quoteStyle: single`)
- крапки з комою — **завжди** (`semicolons: always`)
- відступ — **2 пробіли**
- ширина рядка — **100**
- trailing commas — `es5`
- автосортування імпортів — увімкнено (`organizeImports`)

Ключові правила лінтера:
- `noExplicitAny` — **warn**
- `noUnusedImports` — **error**
- `noUnusedVariables` — **error**
- `noNonNullAssertion` — **warn**
- `useConst` — **error**
- `noUselessFragments` — **warn**

Git hooks (**Husky**): `.husky/pre-commit` → `pnpm lint-staged`, який на `*.{js,ts,tsx,json}` виконує `biome check --apply`. Тобто код автоматично перевіряється/виправляється перед комітом.

Ручні команди: `pnpm lint`, `pnpm format`, `pnpm check`, `pnpm typecheck`.

## TypeScript

Спільні конфіги — у `@repo/typescript-config`:
- `base.json` — базовий строгий конфіг
- `react-library.json` — для React-пакетів

Кожен пакет/застосунок розширює потрібний конфіг у своєму `tsconfig.json`. `*.d.ts` (зокрема згенеровані `@mf-types`) виключені з Biome.

## Роутинг

Єдине джерело істини для шляхів — `ROUTE_PATHS` у `@repo/routes`:

```ts
HOME '/', MOVIES '/movies', USER '/user', USER_PROFILE '/user/profile', USER_SETTINGS '/user/settings'
```

Хелпери: `joinPaths(...)`, `createPath(base, ...segments)`.

Кожен MFE експонує масив `routes` (`RouteObject[]`) через Module Federation (`exposes: { './routes': './src/routes.tsx' }`); host збирає їх разом і рендерить через `useRoutes`.

> ⬜ **Динамічних роутів (`:id`) поки немає.** Для майбутніх сторінок (Movie Detail `/movies/:id`, TV, Person) треба додати параметризовані шляхи в `ROUTE_PATHS` і патерн зчитування параметра. API-хуки під них уже існують (`useMovieDetails`, `useTVDetails`, `usePersonDetails`).

## Патерн MFE (Module Federation)

- **Remote** експонує `./routes`; **host** імпортує їх динамічно (`import('pagesMfe/routes')`).
- **Shared** залежності (єдиний екземпляр на весь застосунок): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`. Додаючи нову спільну залежність, реєструй її в `shared` у **всіх** `vite.config.ts` (host + remotes), інакше буде дубляж екземплярів.
- Кожен MFE має власний `main.tsx` для **standalone-розробки** (з `Providers` + `AppLayout`); при інтеграції в host використовується лише експорт `routes`.

## Крос-MFE комунікація

Тільки через `@repo/events` — типізовані `createTypedEmitter` / `createTypedListener` (події з `EventMap`) та `globalStore`. Прямих імпортів між застосунками не робити.

## Коміти

З git-історії видно префікс задачі трекера: `CIN-4: <опис>`, `CIN-3: <опис>`. Дотримуйся формату `CIN-<номер>: <короткий опис у наказовому способі>`.

## Відомий техборг

- **Умовний виклик хука в `Movies.tsx`** (`apps/pages-mfe/src/pages/Movies.tsx`):

  ```ts
  const { data, fetchNextPage, ... } =
    searchQuery ? useSearchMovies(searchQuery) : useMovies('popular');
  ```

  Це **порушує React rules of hooks**: кількість/порядок викликів хуків змінюється між рендерами (коли `searchQuery` стає порожнім/непорожнім), що може призвести до помилки рантайму або неконсистентного стану.

  **Напрямок фіксу:** викликати обидва хуки безумовно і керувати активністю через `enabled` (наприклад, `useSearchMovies(searchQuery, { enabled: !!searchQuery })` та `useMovies('popular', { enabled: !searchQuery })`), а потім обирати потрібний результат. Це вимагає, щоб хуки підтримували опцію `enabled` (наразі вони на `useSuspenseInfiniteQuery` — можливо, знадобиться перехід на звичайний infinite query для умовного варіанта).

  Зафіксовано як пункт #1 у [Наступних кроках роадмапи](../00-roadmap/PROJECT_ROADMAP.md#наступні-кроки).
