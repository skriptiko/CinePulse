🔗 Частина роадмапи: [Етап 4 — Розробка](../00-roadmap/PROJECT_ROADMAP.md#етап-4-розробка)

# SETUP — Локальний запуск

## Передумови

- **Node.js** >= 20
- **pnpm** >= 9.15.4 (проєкт закріплено на `pnpm@9.15.4` через `packageManager`)
- Токен доступу до TMDB API (read access token)

## Встановлення

```bash
pnpm install
```

`prepare`-скрипт автоматично налаштує Husky (git hooks).

## Змінні оточення

Створи файл `.env` у **корені** репозиторію:

```bash
TMDB_API_READ_TOKEN=<твій TMDB read access token>
```

- Токен береться тут: https://www.themoviedb.org/settings/api (API Read Access Token).
- `.env` **не комітиться**. Токен використовується як у dev (Vite-proxy додає `Authorization` до запитів на `/api/tmdb`), так і в проді (Firebase Function `tmdbProxy` через `defineSecret`).

## Запуск у режимі розробки

Усі застосунки одразу (через Turborepo):

```bash
pnpm dev
```

Або окремо:

```bash
pnpm --filter @repo/host dev       # Host (оболонка)   — порт 5000
pnpm --filter @repo/pages-mfe dev  # Публічний каталог — порт 5001
pnpm --filter @repo/user-mfe dev   # Особистий кабінет — порт 5002
```

Точка входу застосунку — **http://localhost:5000** (host).

### Порти

| Застосунок | Пакет | Порт |
|-----------|-------|:----:|
| Host (оболонка) | `@repo/host` | 5000 |
| Pages MFE | `@repo/pages-mfe` | 5001 |
| User MFE | `@repo/user-mfe` | 5002 |

Порти фіксовані (`strictPort: true`) — якщо порт зайнятий, застосунок не стартує (не переходить на інший порт).

### Порядок запуску MFE

Host у рантаймі завантажує `remoteEntry.js` кожного remote-модуля. Тому **remotes (5001, 5002) мають бути доступні**, коли host намагається їх завантажити. `pnpm dev` піднімає все паралельно; якщо запускаєш вручну — стартуй remotes до/разом із host. Якщо remote недоступний, host логуватиме помилку завантаження роутів і покаже порожній набір роутів.

### Гібридний режим (remote зі staging)

Можна підмінити адресу remote-модуля через env (напр., щоб місцевий host працював зі staging-версією MFE):

```bash
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js pnpm --filter @repo/host dev
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js pnpm --filter @repo/host dev
```

## Збірка

```bash
pnpm build          # збірка всіх пакетів і застосунків (turbo)
pnpm build:deploy   # build + merge dist усіх MFE у єдину теку для Firebase
```

## Корисні скрипти

| Команда | Призначення |
|---------|-------------|
| `pnpm lint` | Лінтинг через Biome (turbo) |
| `pnpm format` | Форматування через Biome |
| `pnpm check` | Biome check з автозастосуванням виправлень |
| `pnpm typecheck` | Перевірка типів TypeScript |
| `pnpm sync-types` | Синхронізація типів remote-модулів у host |
| `pnpm build:deploy` | Збірка + об'єднання `dist/` MFE |
| `pnpm deploy` | Збірка, merge та деплой на Firebase Hosting (production) |

## Типи remote-модулів

Host отримує типи remotes у `apps/host/src/@types/remotes/` та `apps/host/@mf-types/`. Після зміни експонованого API remote-модуля онови типи:

```bash
pnpm sync-types
```

## Troubleshooting

- **Host не бачить сторінки / «Failed to load remote routes»** — переконайся, що `pages-mfe` (5001) і `user-mfe` (5002) запущені й `remoteEntry.js` доступний. У dev-консолі host логує помилку завантаження.
- **Порт зайнятий** — через `strictPort: true` застосунок впаде; звільни порт (5000/5001/5002) або зупини попередній процес.
- **Порожні дані / 401 від TMDB** — перевір `TMDB_API_READ_TOKEN` у `.env` (кореневий), що це саме Read Access Token, а не API Key v3.
- **Розсинхрон типів remotes** — виконай `pnpm sync-types` (потребує попередньої збірки remote-модулів).
- **CORS / стилі конфліктують** — переконайся, що кожен MFE стартував на своєму порту зі своїм скоуп-префіксом стилів.
