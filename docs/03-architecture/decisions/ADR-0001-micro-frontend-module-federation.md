🔗 Частина роадмапи: [Етап 3 — Архітектура](../../00-roadmap/PROJECT_ROADMAP.md#етап-3-архітектура)

# ADR-0001: Micro-frontend через Module Federation

## Статус

Accepted

## Контекст

CinePulse логічно ділиться на дві незалежні площини: публічний каталог (Home, Movies, у майбутньому TV/Search/Detail) і особистий кабінет (Profile, Settings, авторизація). Ці площини мають різні цикли розробки та потенційно різні команди-власники. Потрібна архітектура, що дозволяє розробляти й деплоїти їх незалежно, але подавати користувачу як єдиний застосунок.

Розглянуті варіанти: (1) єдиний моноліт-SPA; (2) micro-frontend через Module Federation; (3) окремі застосунки за роутами без федерації (iframe/redirect).

## Рішення

Обрано **micro-frontend на `@module-federation/vite`**:

- `apps/host` (порт 5000) — shell, що не містить сторінок, а динамічно завантажує remote-роути.
- `apps/pages-mfe` (5001) і `apps/user-mfe` (5002) — remote-модулі, кожен `exposes: { './routes': './src/routes.tsx' }`.
- Одиниця композиції — **масив роутів** (`RouteObject[]`), а не окремі компоненти: host робить `import('pagesMfe/routes')` / `import('userMfe/routes')` і зливає їх у спільний роутер.
- Спільні залежності (`shareScope: 'default'`): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@repo/events`, `@repo/routes`, `@repo/api`.
- Гібридна розробка: адреси remote перевизначаються через `PAGES_MFE_URL` / `USER_MFE_URL`.

## Наслідки

**Плюси:**
- Незалежна розробка та деплой кожного MFE.
- Чіткі межі відповідальності; мінімальний контракт (лише експорт роутів).
- Можливість локально працювати проти staging-remote (гібридний режим).

**Мінуси / компроміси:**
- Спільні `react`/`react-router-dom` жорстко зв'язують версії між MFE — оновлення треба координувати.
- Складніша збірка (`target: chrome89`, `minify: false`, `cssCodeSplit: false`, `modulePreload: false`) і потреба в `merge-dist` для Firebase.
- Додаткова інфраструктура типів remote (`sync-types`, `@mf-types/`).
- Помилки завантаження remote потрібно окремо деградувати (реалізовано в `App.tsx` + shell-level ErrorBoundary).
