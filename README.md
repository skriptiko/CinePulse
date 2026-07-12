# CinePulse

Micro-frontend (MFE) застосунок, побудований на Turborepo, Vite та React.

## Архітектура

- **Оркестрація монорепозиторію**: Turborepo
- **Пакетний менеджер**: pnpm
- **Статичний аналіз**: Biome.js
- **Механізм федерації**: `@module-federation/vite`
- **UI-бібліотека**: Shadcn UI + Radix

## Структура проєкту

```
├── apps/
│   ├── host/           # Host-застосунок (оболонка) — порт 5000
│   ├── pages-mfe/      # MFE публічного каталогу: Home, Movies, ... (remote) — порт 5001
│   └── user-mfe/       # MFE особистого кабінету: Profile, Settings, ... (remote) — порт 5002
├── packages/
│   ├── api/             # Клієнт TMDB API + React Query хуки
│   ├── routes/          # Спільні константи шляхів маршрутизації
│   ├── events/          # Типізована шина подій і глобальний стор
│   ├── ui/               # Спільні UI-компоненти / дизайн-система
│   └── typescript-config/  # Спільні конфігурації TypeScript
└── functions/           # Firebase Cloud Functions (проксі до TMDB)
```

## Документація

Детальна технічна документація — архітектура, каталог сторінок зі статусом реалізації, покриття TMDB API та специфікація особистого кабінету — міститься в [`docs/`](./docs/README.md).

## Початок роботи

### Передумови

- Node.js >= 20
- pnpm >= 9

### Встановлення

```bash
pnpm install
```

### Розробка

Запуск усіх застосунків у режимі розробки:

```bash
pnpm dev
```

Або запуск окремих застосунків:

```bash
# Host (порт 5000)
pnpm --filter @repo/host dev

# Pages MFE (порт 5001)
pnpm --filter @repo/pages-mfe dev

# User MFE (порт 5002)
pnpm --filter @repo/user-mfe dev
```

### Збірка

```bash
pnpm build
```

### Гібридний режим розробки

Можна вказати staging-адреси remote-модулів через змінні оточення:

```bash
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js pnpm --filter @repo/host dev
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js pnpm --filter @repo/host dev
```

## Ключові можливості

### Типобезпечні події

Уся крос-MFE комунікація використовує типізовані emitter/listener з `@repo/events`:

```typescript
import { createTypedEmitter, createTypedListener } from '@repo/events';

const emitUserLogin = createTypedEmitter('user:login');
const onUserLogin = createTypedListener('user:login');
```

### Межі обробки помилок (Error Boundaries)

Дворівневі межі обробки помилок для плавної деградації:

- **Рівень оболонки (shell-level)**: перехоплює критичні збої, пропонує перезавантажити застосунок
- **Рівень модуля (module-level)**: окремий MFE може повторити спробу без перезавантаження всього застосунку

### Ізоляція стилів

Кожен MFE використовує Tailwind-скоупінг з унікальними ID-префіксами, щоб уникнути конфліктів стилів.

## Скрипти

- `pnpm dev` — запуск серверів розробки
- `pnpm build` — збірка всіх пакетів і застосунків
- `pnpm lint` — лінтинг через Biome
- `pnpm format` — форматування коду через Biome
- `pnpm check` — перевірка Biome з автоматичним застосуванням виправлень
- `pnpm typecheck` — перевірка типів TypeScript
- `pnpm sync-types` — синхронізація типів remote-модулів у host
- `pnpm build:deploy` — збірка всіх застосунків і об'єднання їхніх `dist/` для Firebase Hosting
- `pnpm deploy` — збірка, об'єднання та деплой на Firebase Hosting (продакшн-таргет)

## Ліцензія

MIT
