# CinePulse — Project Roadmap

> **Головний трекер прогресу.** Це живий документ. Кожна секція нижче — етап життєвого циклу проєкту. Чекбокси відображають **фактичний стан коду** на дату останнього аудиту, а не плани. Деталі кожного пункту — у відповідному документі `docs/`.
>
> Умовні позначення статусу: ✅ готово · 🟡 в процесі / частково · ⬜ не почато · ⚠️ потребує моєї участі (рішення/дані поза кодом).

---

## Summary

**CinePulse** — micro-frontend вебзастосунок-каталог фільмів на базі TMDB API; стек: Turborepo + pnpm, Vite + React 18, Module Federation, TanStack Query, Firebase Hosting + Cloud Functions.

| # | Етап | % готовності | Статус |
|---|------|:---:|:---:|
| 1 | [Аналіз вимог](#етап-1-аналіз-вимог) | 85% | ✅ |
| 2 | [Дизайн та UX](#етап-2-дизайн-та-ux) | 40% | 🟡 |
| 3 | [Архітектура](#етап-3-архітектура) | 85% | ✅ |
| 4 | [Розробка](#етап-4-розробка) | 45% | 🟡 |
| 5 | [Тестування](#етап-5-тестування) | 0% | ⬜ |
| 6 | [Деплой та CI/CD](#етап-6-деплой-та-cicd) | 60% | 🟡 |
| 7 | [Операції](#етап-7-операції) | 10% | ⬜ |

**Загальна вага готовності проєкту (орієнтовно): ~30%** — міцний технічний фундамент (архітектура, інфраструктура, API-шар, дизайн-система), але прогалини в реалізації, тестуванні та операційній зрілості.

> ⚠️ **Скоуп формалізовано (сесія 2026-07-12):** продуктову частину визначено (див. [PRD](../01-product/PRD.md)) — CinePulse тепер це discovery-каталог **+ особистий watchlist із папками та auth (Firebase)**. Це суттєво **розширило** цільовий скоуп (auth, Firestore, детальні сторінки, TV, Person, Search, дерево папок), тому фактичний % реалізації відносно повного скоупу нижчий, ніж в оцінці до сесії. Нові архітектурні наслідки (Firebase Auth + Firestore) — до опрацювання на Етапах 3–4.

---

## Каталог сторінок і план розробки

> Це «серце» роадмапи розробки додатку: що вже є, наскільки готове і робоче, що ще треба додати. Джерело істини — код у `apps/*/src/pages/` та `packages/routes/src/index.ts`. Деталі UX — у [UX_NOTES](../02-design/UX_NOTES.md), деталі API під кожну сторінку — у [API_SPEC](../03-architecture/API_SPEC.md).

### Легенда готовності сторінки
- **✅ Готова/робоча** — рендериться, підключена до реальних даних, є основні стани (loading/empty/error достатньо).
- **🟡 Частково** — сторінка існує, але це заглушка або бракує ключової функціональності.
- **⬜ Немає** — роуту та сторінки не існує (навіть якщо API/хук під неї вже є).

### Публічний каталог (`apps/pages-mfe`, remote, порт 5001)

| Сторінка | Роут | Файл | Готовність | Що є / чого бракує |
|----------|------|------|:---:|--------------------|
| **Home** | `/` | `apps/pages-mfe/src/pages/Home.tsx` | ✅ ~95% | Hero, CategoryPills, ряди Trending/New Releases/Top Rated/Popular, FeaturedGrid («Editor's Picks»). Реальні дані TMDB через `useTrending`/`useMovies`/`useMovieGenres`. **Бракує:** станів завантаження (skeleton) та порожніх станів; фільтр CategoryPills на Home ще не змінює контент. |
| **Movies** | `/movies` | `apps/pages-mfe/src/pages/Movies.tsx` | ✅ ~90% | Пошук, фільтр за жанром (локально), сортування (Popular/Newest/Rating, локально), перемикач grid/compact, «Load More» (infinite query), empty-state. **Техборг:** умовний виклик хука `searchQuery ? useSearchMovies() : useMovies()` — порушення React rules of hooks (див. [Наступні кроки](#наступні-кроки)). Фільтрація/сортування — лише в межах завантажених сторінок, не серверні. |
| **Movie Detail** | `/movies/:id` | — | ⬜ | Роуту/сторінки немає. API готове: `useMovieDetails(id)` + тип `MovieDetails`. Найпріоритетніша нова сторінка. |
| **TV Shows (список)** | `/tv` | — | ⬜ | Немає. API готове: `useTVShows`, `useTVGenres`. |
| **TV Detail** | `/tv/:id` | — | ⬜ | Немає. API готове: `useTVDetails(id)`. |
| **Search (окрема)** | `/search` | — | ⬜ | Немає окремої сторінки; пошук наразі лише всередині Movies. API готове: `useSearchMulti`, `useSearchMovies/TV/Person`. |
| **Person / Актор** | `/person/:id` | — | ⬜ | Немає. API готове: `usePersonDetails(id)`. |
| **404 / Not Found** | `*` | інлайн у `apps/host/src/AppRoutes.tsx` | 🟡 | Лише рядок «Page not found», окремого дизайну немає. |

### Особистий кабінет (`apps/user-mfe`, remote, порт 5002)

| Сторінка | Роут | Файл | Готовність | Що є / чого бракує |
|----------|------|------|:---:|--------------------|
| **Profile** | `/user/profile` | `apps/user-mfe/src/pages/Profile.tsx` | 🟡 ~10% | Заглушка: `<h1>User Profile</h1>` + текст. **У скоупі:** дані користувача (Firebase Auth), точка входу до watchlist. У `@repo/events` є `globalStore` (user, isAuthenticated) — ще не підключений до UI. |
| **Settings** | `/user/settings` | `apps/user-mfe/src/pages/Settings.tsx` | 🟡 ~10% | Заглушка. **У скоупі:** налаштування акаунта, перемикач теми (`setTheme` у store існує). |
| **Auth (Login/Register)** | `/auth/*` | — | ⬜ | **У скоупі (підтверджено 2026-07-12).** Firebase Auth: email+пароль із реєстрацією (соц-логін — поза скоупом). Store має `isAuthenticated`/`setUser`, події `user:login`/`user:logout` типізовані — UI та логіки авторизації ще немає. |
| **Watchlist** | `/user/watchlist` | — | ⬜ | **У скоупі — ядро кабінету (підтверджено 2026-07-12).** Дерево папок (до 6 рівнів, необмежена ширина), тайтл може бути в кількох папках, статус *переглянуто/заплановано*. Зберігання — Firestore. Доступ лише зареєстрованим. → [PRD](../01-product/PRD.md#ключова-фіча-watchlist-папки--статуси) |

### Спільна оболонка (`apps/host`, порт 5000)
- ✅ Host завантажує remote-роути обох MFE (`import('pagesMfe/routes')`, `import('userMfe/routes')`) і рендерить через `useRoutes`.
- ✅ `AppLayout` (Header + Footer) з `@repo/ui`.
- ✅ Двошарові Error Boundaries: shell-level в `App.tsx`.
- 🟡 **Навігація:** Header існує в дизайн-системі, але треба перевірити, що всі роути (включно з майбутніми) в ньому представлені.

**Підсумок розробки сторінок:** 2 повноцінні (Home, Movies) + 2 заглушки (Profile, Settings) + ~8 запланованих (Movie Detail, TV, TV Detail, Search, Person, 404, Auth, Watchlist). Інфраструктура під каталог (API, UI-kit, роутинг, MFE) переважно готова — тому нові сторінки додаються швидко; **новий блок робіт** — auth + watchlist (потребує Firebase Auth + Firestore, яких ще немає).

> **Скоуп сторінок підтверджено (2026-07-12):** усі перелічені сторінки входять у [Definition of Done](../01-product/PRD.md#скоуп-проєкту-definition-of-done) — Movie Detail, TV, TV Detail, Search, Person більше **не** опційні. Person і Search тепер у скоупі. Обсяг сторінок деталей — «IMDb-like» (каст, медіа, схожі, відгуки, провайдери), але не весь TMDB API.

---

## Етап 1. Аналіз вимог

> Деталі: [PRD](../01-product/PRD.md) · [GLOSSARY](../01-product/GLOSSARY.md)

- [x] **Product Requirements Document (PRD)** — ✅ визначено у grilling-сесії 2026-07-12: природа (портфоліо/навчання), проблема, продукт (трекер + каталог). → [PRD.md](../01-product/PRD.md)
- [x] **Бізнес-цілі та метрики успіху** — ✅ ціль = навчальний рубіж; метрики (навчальні + повнота + якість коду + NFR) визначено. → [PRD.md](../01-product/PRD.md#цілі-та-метрики-успіху)
- [x] **User personas / user research** — ✅ 2 персони: Кіно-ентузіаст-організатор (осн.) + Кежуал-глядач. → [PRD.md](../01-product/PRD.md#персони)
- [x] **Скоуп проєкту (Definition of Done)** — ✅ без MVP-фаз: усі задокументовані сторінки + профіль + watchlist; «IMDb-like», не весь API. → [PRD.md](../01-product/PRD.md#скоуп-проєкту-definition-of-done)
- [x] **Ключова фіча: Watchlist (папки + статуси)** — ✅ специфіковано: дерево папок ≤6 рівнів, multi-membership, статус переглянуто/заплановано, Firestore, лише для авторизованих. → [PRD.md](../01-product/PRD.md#ключова-фіча-watchlist-папки--статуси)
- [x] **Нефункціональні вимоги (NFR)** — ✅ Lighthouse Perf ≥90, LCP <2.5s, WCAG 2.1 AA, evergreen-браузери, mobile-first. → [PRD.md](../01-product/PRD.md#нефункціональні-вимоги-nfr)
- [x] **Функціональні можливості (де-факто, з коду)** — ✅ каталог фільмів, пошук, фільтри — реалізовано; зафіксовано в цій роадмапі та PRD як «як є». → [Каталог сторінок](#каталог-сторінок-і-план-розробки)
- [x] **Глосарій ключових термінів** — 🟡 базовий є (TMDB-сутності, MFE); додано терміни watchlist/папки/Firebase; уточнювати з реалізацією. → [GLOSSARY.md](../01-product/GLOSSARY.md)

## Етап 2. Дизайн та UX

> Деталі: [UX_NOTES](../02-design/UX_NOTES.md)

- [x] **Дизайн-система (компоненти)** — ✅ 19 компонентів у `packages/ui` (Shadcn UI + Radix + Tailwind): Button, Card, MovieCard, Hero, ContentRow, FeaturedGrid, CategoryPills, DropdownMenu тощо. → [UX_NOTES.md](../02-design/UX_NOTES.md#компоненти-дизайн-системи)
- [x] **Тема та токени (dark-first)** — ✅ Tailwind-змінні (`bg-background`, `text-foreground`, `bg-secondary`…) у `packages/ui/src/styles/globals.css`. → [UX_NOTES.md](../02-design/UX_NOTES.md#тема-та-токени)
- [x] **Ізоляція стилів між MFE** — ✅ Tailwind-скоупінг з унікальними префіксами. → [UX_NOTES.md](../02-design/UX_NOTES.md#ізоляція-стилів)
- [ ] **Формальні макети / Figma** — ⬜ ⚠️ потребує моєї участі. Немає посилань на дизайн-файли. → [UX_NOTES.md](../02-design/UX_NOTES.md#макети)
- [ ] **Стани UI (loading/empty/error) — уніфіковані** — 🟡 Skeleton-компонент є, empty-state є в Movies, але не всюди (Home без skeleton). → [UX_NOTES.md](../02-design/UX_NOTES.md#стани-ui)
- [ ] **Адаптивність / accessibility (a11y) аудит** — ⬜ адаптивні класи є, але формального a11y-аудиту не проводилось. → [UX_NOTES.md](../02-design/UX_NOTES.md#accessibility)

## Етап 3. Архітектура

> Деталі: [ARCHITECTURE](../03-architecture/ARCHITECTURE.md) · [DATA_MODEL](../03-architecture/DATA_MODEL.md) · [API_SPEC](../03-architecture/API_SPEC.md) · [ADR](../03-architecture/decisions/)

- [x] **Monorepo (Turborepo + pnpm)** — ✅ `turbo.json`, `pnpm-workspace.yaml`, workspace-пакети. → [ARCHITECTURE.md](../03-architecture/ARCHITECTURE.md#монорепозиторій)
- [x] **Micro-frontend (Module Federation)** — ✅ host + 2 remote MFE, `@module-federation/vite`. → [ADR-0001](../03-architecture/decisions/ADR-0001-micro-frontend-module-federation.md)
- [x] **Крос-MFE комунікація** — ✅ типізована event bus + global store (`@repo/events`). → [ADR-0004](../03-architecture/decisions/ADR-0004-typed-event-bus.md)
- [x] **Шар доступу до даних** — ✅ `@repo/api`: клієнт, endpoints, React Query хуки, типи. → [API_SPEC.md](../03-architecture/API_SPEC.md)
- [x] **Модель даних (типи TMDB)** — ✅ повні TS-типи (Movie, TV, Person, Trending…). → [DATA_MODEL.md](../03-architecture/DATA_MODEL.md)
- [x] **Проксі до TMDB (приховання токена)** — ✅ Firebase Function `tmdbProxy` + Vite-proxy у dev. → [ADR-0003](../03-architecture/decisions/ADR-0003-tmdb-proxy.md)
- [x] **Error boundaries (2 рівні)** — ✅ shell-level + module-level. → [ARCHITECTURE.md](../03-architecture/ARCHITECTURE.md#обробка-помилок)
- [ ] **ADR задокументовані** — 🟡 створюються зараз (ADR-0001…0005); підтримувати надалі. → [decisions/](../03-architecture/decisions/)
- [ ] **Діаграми (C4 / послідовності)** — ⬜ текстовий опис є, формальних діаграм немає. → [ARCHITECTURE.md](../03-architecture/ARCHITECTURE.md#діаграми)

## Етап 4. Розробка

> Деталі: [SETUP](../04-development/SETUP.md) · [CONVENTIONS](../04-development/CONVENTIONS.md) · [Каталог сторінок](#каталог-сторінок-і-план-розробки)

- [x] **Host-оболонка** — ✅ завантаження remote-роутів, layout, error boundary. → [Каталог сторінок](#спільна-оболонка-appshost-порт-5000)
- [x] **Home (публічний каталог)** — ✅ повноцінна, реальні дані. → [Каталог сторінок](#публічний-каталог-appspages-mfe-remote-порт-5001)
- [x] **Movies (каталог з фільтрами)** — ✅ робоча; є техборг (умовний хук). → [CONVENTIONS.md](../04-development/CONVENTIONS.md#відомий-техборг)
- [ ] **Profile / Settings** — 🟡 заглушки, потребують реалізації. → [Каталог сторінок](#особистий-кабінет-appsuser-mfe-remote-порт-5002)
- [ ] **Movie Detail / TV / Search / Person / Auth** — ⬜ не почато (API частково готове). → [Каталог сторінок](#каталог-сторінок-і-план-розробки)
- [x] **UI-kit / дизайн-система** — ✅ `@repo/ui` (19 компонентів + mappers). → [UX_NOTES.md](../02-design/UX_NOTES.md)
- [x] **Lint/format (Biome) + pre-commit (Husky)** — ✅ `biome.json`, `.husky/pre-commit` → lint-staged. → [CONVENTIONS.md](../04-development/CONVENTIONS.md#лінтинг-і-форматування)
- [x] **Локальний запуск / SETUP** — ✅ `pnpm dev`, порти 5000/5001/5002, env `TMDB_API_READ_TOKEN`. → [SETUP.md](../04-development/SETUP.md)
- [ ] **Типізований роутинг для динамічних сторінок** — ⬜ `ROUTE_PATHS` статичні; немає патернів `:id`. → [CONVENTIONS.md](../04-development/CONVENTIONS.md#роутинг)

## Етап 5. Тестування

> Деталі: [TEST_STRATEGY](../05-testing/TEST_STRATEGY.md)

- [ ] **Unit-тести** — ⬜ фреймворк не встановлено (нема vitest/jest). → [TEST_STRATEGY.md](../05-testing/TEST_STRATEGY.md#unit)
- [ ] **Component/integration-тести** — ⬜ немає (@testing-library відсутній). → [TEST_STRATEGY.md](../05-testing/TEST_STRATEGY.md#component--integration)
- [ ] **E2E-тести** — ⬜ немає (Playwright/Cypress відсутні). → [TEST_STRATEGY.md](../05-testing/TEST_STRATEGY.md#e2e)
- [ ] **Тести у CI** — ⬜ CI виконує лише build+deploy, без test/lint/typecheck. → [TEST_STRATEGY.md](../05-testing/TEST_STRATEGY.md#ci-інтеграція)
- [ ] **Покриття (coverage) цілі** — ⬜ не визначено. → [TEST_STRATEGY.md](../05-testing/TEST_STRATEGY.md#цілі-покриття)

## Етап 6. Деплой та CI/CD

> Деталі: [CI_CD](../06-deployment/CI_CD.md) · [ENVIRONMENTS](../06-deployment/ENVIRONMENTS.md)

- [x] **Firebase Hosting (production)** — ✅ проєкт `cinepulse-eec15`, target `production`. → [ENVIRONMENTS.md](../06-deployment/ENVIRONMENTS.md#production)
- [x] **Firebase Function (tmdbProxy)** — ✅ деплоїться разом (`predeploy` build). → [CI_CD.md](../06-deployment/CI_CD.md#functions)
- [x] **Auto-deploy на push у main** — ✅ GitHub Actions `firebase-deploy.yml`. → [CI_CD.md](../06-deployment/CI_CD.md#github-actions)
- [x] **Merge dist MFE перед деплоєм** — ✅ `scripts/merge-dist.js`. → [CI_CD.md](../06-deployment/CI_CD.md#збірка-і-merge)
- [ ] **Quality gates у CI (lint/typecheck/test)** — ⬜ відсутні у пайплайні. → [CI_CD.md](../06-deployment/CI_CD.md#quality-gates)
- [ ] **Staging / preview-канали** — ⬜ немає окремого середовища / PR-preview. → [ENVIRONMENTS.md](../06-deployment/ENVIRONMENTS.md#staging)
- [ ] **Стратегія rollback** — ⬜ не задокументовано. → [CI_CD.md](../06-deployment/CI_CD.md#rollback)

## Етап 7. Операції

> Деталі: [RUNBOOK](../07-operations/RUNBOOK.md) · [MONITORING](../07-operations/MONITORING.md)

- [ ] **Моніторинг / uptime** — ⬜ не налаштовано. → [MONITORING.md](../07-operations/MONITORING.md)
- [ ] **Error tracking (Sentry тощо)** — ⬜ немає (лише `console.error` у dev). → [MONITORING.md](../07-operations/MONITORING.md#error-tracking)
- [ ] **Логування / аналітика** — ⬜ немає. → [MONITORING.md](../07-operations/MONITORING.md#логування)
- [ ] **Алерти / SLO** — ⬜ ⚠️ потребує моєї участі (визначити цілі). → [MONITORING.md](../07-operations/MONITORING.md#алерти-та-slo)
- [ ] **Runbook інцидентів** — ⬜ структуру створено, зміст TODO. → [RUNBOOK.md](../07-operations/RUNBOOK.md)
- [x] **Управління секретами** — ✅ TMDB-токен через `defineSecret` (Functions) + `.env` локально. → [RUNBOOK.md](../07-operations/RUNBOOK.md#секрети)

---

## Наступні кроки

Пріоритезований список — найкритичніше першим:

1. **[Техборг] Виправити умовний виклик хука в `Movies.tsx`** — `searchQuery ? useSearchMovies() : useMovies()` порушує React rules of hooks і може спричинити краш при зміні пошуку. Розділити на стабільний виклик обох хуків з `enabled`-прапорцем. → *Етап 4*
2. **Додати quality gates у CI** — lint + typecheck (потім test) як обов'язкові кроки перед деплоєм. Дешево, високий ефект. → *Етап 6*
3. **Реалізувати сторінку Movie Detail (`/movies/:id`)** — API вже готове (`useMovieDetails`); це найочевидніша прогалина UX. → *Етап 4*
4. **Підключити тестовий фреймворк (Vitest + Testing Library)** — почати з `@repo/api` (мапери, client) і ключових компонентів. → *Етап 5*
5. **Реалізувати Profile та Settings** — підключити `globalStore` (user, theme) до UI; винести з заглушок. → *Етап 4*
6. **✅ (Виконано 2026-07-12) Написати PRD і визначити скоуп** — природу, цілі, персони, метрики, NFR і межі проєкту (Definition of Done) зафіксовано у grilling-сесії. → *Етап 1*
7. **Додати skeleton/loading-стани на Home** — прибрати «стрибки» контенту під час завантаження. → *Етап 2*
8. **Налаштувати staging / PR-preview канали Firebase** — безпечніше тестувати перед production. → *Етап 6*
9. **Підключити error tracking (Sentry)** — бачити реальні збої в проді. → *Етап 7*
10. **⚠️ Формалізувати макети/дизайн-токени** — узгодити джерело істини для дизайну. → *Етап 2*

**Нові кроки з формалізації watchlist-скоупу (2026-07-12):**

- **Спроєктувати модель Firestore** для watchlist: дерево папок (≤6 рівнів), membership тайтлів (many-to-many, фільми+серіали), статус *переглянуто/заплановано* + security rules. → *Етап 3*
- **Реалізувати Firebase Auth** (email+пароль, реєстрація); підключити `globalStore` до реального провайдера. → *Етап 4*
- **Реалізувати Watchlist UI** у `user-mfe`: дерево папок (створення/перейменування/переміщення), додавання тайтлів із каталогу та сторінок деталей, статуси. → *Етап 4*
- **Реалізувати сторінки скоупу:** Movie Detail (збагатити: каст/медіа/схожі/відгуки/провайдери), TV, TV Detail, Search, Person. → *Етап 4*

---

## Journal

> Хронологія сесій роботи. Кожен запис — що змінилося у статусах. Формат: `### YYYY-MM-DD — [опис]`.

### 2026-07-11 — Ініціалізація документаційного пакета
- Проведено повний аудит кодової бази (apps, packages, functions, CI).
- Створено структуру `docs/` (00–07) і цей роадмап як центральний трекер.
- Створено повний пакет: **20 документів** (роадмап + індекс + 18 деталізуючих: PRD, GLOSSARY, UX_NOTES, ARCHITECTURE, DATA_MODEL, API_SPEC, 5×ADR, SETUP, CONVENTIONS, TEST_STRATEGY, CI_CD, ENVIRONMENTS, RUNBOOK, MONITORING).
- Зафіксовано базові статуси всіх 7 етапів на основі доказів у коді (див. таблицю Summary).
- Виявлено техборг: умовний виклик хука в `Movies.tsx` (додано в «Наступні кроки» #1).
- Ключові прогалини: тестування (0%), продуктова документація (10%), операційна зрілість (10%).
- Верифікація посилань: 123 файлових + 37 якірних, 0 битих. Кожен документ 01–07 має рядок-повернення на відповідний етап роадмапи.

### 2026-07-12 — Аналіз вимог: grilling-сесія і формалізація скоупу
- Проведено grilling-сесію (техніка «одне питання за раз») по Етапу 1 з власником продукту.
- **Зафіксовано природу:** портфоліо; головна ціль — навчальний рубіж (MFE, Firebase, тестування); демонструє 4 компетенції.
- **Визначено продукт:** discovery-каталог TMDB + **особистий watchlist** із папками та статусами.
- **Ключові рішення:** Firebase Auth (email+пароль) + Firestore; папки до 6 рівнів вкладеності, multi-membership, статус переглянуто/заплановано, доступ лише авторизованим; сторінки деталей «IMDb-like» (каст/медіа/схожі/відгуки/провайдери).
- **Скоуп:** відмовились від MVP-фазування на користь Definition of Done (усі задокументовані сторінки + профіль + watchlist; не весь TMDB API). Person і Search переведено з опційних у скоуп.
- **NFR:** Lighthouse Perf ≥90, LCP <2.5s, WCAG 2.1 AA, evergreen-браузери, mobile-first.
- **Оновлено:** PRD.md (повний перепис), Каталог сторінок (Auth/Watchlist як підтверджений скоуп), Етап 1 (усі пункти ✅, 10%→85%), GLOSSARY (нові терміни), ARCHITECTURE/DATA_MODEL (позначено наслідки Firebase Auth+Firestore).
- **Наслідок:** цільовий скоуп суттєво розширено — додано новий блок робіт (auth+watchlist+Firestore) на Етапи 3–4.

<!-- Наступні сесії додавай сюди новим записом: ### YYYY-MM-DD — [опис що змінилось у статусах] -->

