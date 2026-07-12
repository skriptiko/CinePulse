🔗 Частина роадмапи: [Етап 5 — Тестування](../00-roadmap/PROJECT_ROADMAP.md#етап-5-тестування)

# Стратегія тестування

> **Поточний стан: тестів немає.** У проєкті не встановлено жодного тестового фреймворку (немає `vitest`, `jest`, `@testing-library`, `playwright`, `cypress`), немає жодного `*.test.*` / `*.spec.*` файлу, і CI не запускає тести. Цей документ — **план впровадження**, а не опис наявного процесу. Готовність етапу: **0% ⬜**.

## Піраміда тестів (ціль)

```
        ▲  E2E (мало, критичні шляхи)      → Playwright
       ▲▲▲ Component / integration (середньо) → Vitest + Testing Library + MSW
      ▲▲▲▲▲ Unit (багато, дешево, швидко)      → Vitest
```

Основа піраміди — швидкі unit-тести чистих функцій; вершина — кілька E2E на найважливіші сценарії. Уникаємо «перевернутої піраміди» (багато повільних E2E, мало unit).

## Рекомендований стек

| Рівень | Інструмент | Призначення |
|--------|-----------|-------------|
| Unit / component | **Vitest** | Швидкий, нативний для Vite; спільний конфіг у корені монорепо |
| Component / DOM | **@testing-library/react** + **@testing-library/user-event** | Тестування компонентів через поведінку користувача |
| Мок мережі | **MSW (Mock Service Worker)** | Перехоплення запитів до `/api/tmdb/**` без реального TMDB |
| E2E | **Playwright** | Крос-браузерні сценарії поверх зібраного застосунку |
| Середовище | **jsdom** / **happy-dom** | DOM для unit/component рівня |

## Unit

Найдешевший і найпріоритетніший рівень. Тестувати чисті функції та логіку без DOM.

**Що покрити першим (за пріоритетом):**
1. `packages/ui/src/lib/mappers.ts` — `mapTmdbToMovieCard` (перетворення TMDB → пропси картки).
2. `@repo/api` утиліти — `buildQueryString`, `getImageUrl` (формування URL зображень за `ImageSize`/`BackdropSize`).
3. `@repo/api` `handleResponse` / `ApiError` / `isGlobalError` — гілки 5xx / network / abort.
4. `@repo/events` — `TypedEventBus` (on/off/once/emit/clear), `globalStore` (setUser/updateUser/setTheme/reset).
5. `@repo/routes` — `joinPaths`, `createPath`.

## Component / integration

Тестувати компоненти `@repo/ui` та сторінки MFE з замоканим мережевим шаром (MSW).

**Кандидати:**
- `MovieCard`, `Hero`, `ContentRow`, `FeaturedGrid`, `CategoryPills` — рендер за пропсами, порожні/граничні стани.
- `ErrorBoundary` — перехоплення помилки дочірнього компонента (shell/module рівні).
- Сторінка **Movies** — пошук, фільтр за жанром, сортування, перемикач grid/compact, empty-state, «Load More».
- Сторінка **Home** — рендер рядів за даними TMDB (через MSW-фікстури).

> ⚠️ Під час тестування Movies врахувати відомий техборг — умовний виклик хука (`useSearchMovies` vs `useMovies`). Тест на зміну пошуку може виявити цей дефект; його треба виправити (див. [CONVENTIONS](../04-development/CONVENTIONS.md#відомий-техборг)).

## E2E

Кілька сценаріїв поверх реально зібраного застосунку (host + обидва MFE). Мокати TMDB на рівні мережі або використовувати стабільний тест-акаунт.

**Критичні шляхи (MVP):**
1. Відкриття Home → відображаються Hero та ряди контенту.
2. Перехід Home → Movies через навігацію.
3. Пошук фільму на Movies → результати оновлюються.
4. Фільтр за жанром + сортування → список змінюється.
5. Деградація: якщо remote MFE недоступний — показується module-level error boundary, а не білий екран.

## CI-інтеграція

⬜ Наразі CI (`.github/workflows/firebase-deploy.yml`) виконує лише `build` + деплой, без жодних перевірок якості.

**План:** додати окремий workflow (тригер на `pull_request` та `push`) з кроками:
```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm lint          # Biome
- run: pnpm typecheck     # tsc через turbo
- run: pnpm test          # Vitest (додати task у turbo.json + скрипт)
```
Деплой на `main` має залежати від проходження цих перевірок (quality gate). Див. [CI_CD → Quality gates](../06-deployment/CI_CD.md#quality-gates).

## Цілі покриття

⚠️ Числові цілі ще не визначено. Пропонований старт після впровадження:
- Unit: критичні утиліти/мапери/події — **≥ 80%**.
- Component: ключові сторінки та компоненти зі станами — базове покриття happy-path + empty/error.
- E2E: покривають перелічені критичні шляхи (не метрика %, а чеклист сценаріїв).
- Coverage-репорт через `vitest --coverage` (v8), публікувати в CI.

## TODO-чеклист впровадження

- [ ] Додати `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`/`happy-dom` у корінь монорепо.
- [ ] Створити спільний `vitest.config.ts` (workspace-режим для пакетів).
- [ ] Додати task `test` у `turbo.json` і скрипт `test` у `package.json`.
- [ ] Написати перші unit-тести (мапери, `buildQueryString`, event bus).
- [ ] Додати MSW + фікстури для `/api/tmdb`.
- [ ] Написати component-тести для Movies і Home.
- [ ] Додати Playwright + перші E2E критичних шляхів.
- [ ] Створити CI-workflow з lint + typecheck + test як quality gate перед деплоєм.
- [ ] Визначити й зафіксувати числові цілі покриття.
