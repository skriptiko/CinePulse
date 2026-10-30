🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CI/CD

Автоматичний деплой на Firebase Hosting (+ Cloud Functions) через GitHub Actions. Статус етапу: **🟡 частково** — деплой і quality gates (lint + typecheck + test) працюють, немає документованого rollback.

## GitHub Actions

Пайплайн: [`.github/workflows/firebase-deploy.yml`](../../.github/workflows/firebase-deploy.yml).

- **Тригери:** `push` у `main` і `develop`, будь-який `pull_request`.
- **Runner:** `ubuntu-latest`, Node.js `24`, pnpm з `packageManager` у `package.json`.
- **Job `quality`** (на кожен тригер):
  1. checkout, pnpm, Node (кеш `pnpm`).
  2. `pnpm install --frozen-lockfile` — падає, якщо `pnpm-lock.yaml` не синхронізований з `package.json`.
  3. `pnpm lint` (Biome + заборона JSX-spread).
  4. `pnpm typecheck`.
  5. `pnpm test`.
- **Job `size`** (на кожен тригер, не обов'язковий для мерджу): `pnpm turbo build --filter=@repo/host` → `pnpm size` (бюджет у `.size-limit.json`).
- **Job `build-and-deploy`** (`needs: quality`, лише push у `main`, без паралельних деплоїв):
  1. Ті самі checkout / pnpm / Node / install.
  2. `pnpm build:deploy` — Turbo збирає всі застосунки й пакети, крім sandbox `apps/design` (у прод не йде), і `scripts/merge-dist.js` об'єднує `dist/` (див. нижче). Локально — та сама команда.
  3. Деплой функцій (`firebase deploy --only functions`) — спершу, бо rewrite `/api/tmdb/**` веде на `tmdbProxy`.
  4. `FirebaseExtended/action-hosting-deploy@v0` — деплой на `projectId: cinepulse-eec15`, `target: production`, `channelId: live`.

**Секрети GitHub:**

| Секрет | Призначення |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account для деплою на Firebase |
| `GITHUB_TOKEN` | Стандартний токен Actions (`repoToken`) |

> ⚠️ Workflow деплоїть лише **hosting**. Деплой Cloud Functions наразі виконується вручну (див. [RUNBOOK](../07-operations/RUNBOOK.md#процедура-деплою-вручну)) або спрацьовує через `firebase deploy` локально.

## Функції (Functions)

Firebase Function `tmdbProxy` ([`functions/src/index.ts`](../../functions/src/index.ts)) — проксі до TMDB.

- Джерело: `functions` (з `firebase.json`), codebase `default`.
- **Predeploy hook:** `pnpm --filter @repo/functions build` — функції збираються перед деплоєм.
- Секрет `TMDB_API_READ_TOKEN` — через `defineSecret` (Firebase Secret Manager), не в коді.
- Rewrite `/api/tmdb/**` → функція `tmdbProxy` (з `firebase.json`).
- Read-only allowlisted proxy (GET/HEAD, fixed paths and query params, neutral `502`/`503` for upstream errors, CDN `Cache-Control` on 2xx); full rules in [ADR-0003](../03-architecture/decisions/ADR-0003-tmdb-proxy.md).
- Build: `tsc -p tsconfig.build.json` (tests in `src/**/__tests__` stay out of `dist/`); the rules are unit-tested by the `functions` Vitest project in `pnpm test`.

## Збірка і merge

Кожен застосунок (`host`, `pages-mfe`, `user-mfe`) збирається у власний `dist/`. Оскільки Firebase Hosting віддає єдину теку `dist` (з `firebase.json`), скрипт [`scripts/merge-dist.js`](../../scripts/merge-dist.js) об'єднує їх:

- очищає/створює кореневий `/dist`;
- `apps/host/dist` → корінь `/dist` (shell-застосунок);
- `apps/pages-mfe/dist` → `/dist/pages-mfe`;
- `apps/user-mfe/dist` → `/dist/user-mfe`.

Rewrites у `firebase.json` спрямовують `/pages-mfe/**` і `/user-mfe/**` на відповідні `index.html`, решту — на SPA-fallback `/index.html`.

**Локальні скрипти деплою** (`package.json`):
- `pnpm build:deploy` = `turbo build --filter=!@repo/design && pnpm merge-dist` (те саме, що в CI).
- `pnpm deploy` = `pnpm build:deploy && firebase deploy --only hosting:production`.

## Quality gates

🟡 **Lint + typecheck** — job `quality`; деплой залежить від нього (`needs`), тож падіння зупиняє деплой. На PR перевірки видно у вкладці Checks.

⬜ **Тести** — `pnpm test` додається в job `quality` після впровадження тестів.

⬜ **Branch protection** — щоб PR не можна було змерджити з червоним `quality`, увімкни required check у налаштуваннях репо (GitHub → Settings → Branches → `main`). Див. [TEST_STRATEGY → CI](../05-testing/TEST_STRATEGY.md#ci).

## Rollback

⬜ **Не задокументовано.** Рекомендований підхід через Firebase Hosting (кожен деплой = окремий реліз):

- **Через консоль:** Firebase Console → Hosting → історія релізів → обрати попередній справний → «Rollback».
- **Через CLI (орієнтовно):**
  ```bash
  firebase hosting:clone cinepulse-eec15:live:<PREV_VERSION> cinepulse-eec15:live
  ```
- **Через Git:** `revert` проблемного коміту в `main` → пайплайн задеплоїть попередній стан.

**TODO:** зафіксувати перевірену процедуру rollback і додати її в [RUNBOOK](../07-operations/RUNBOOK.md).
